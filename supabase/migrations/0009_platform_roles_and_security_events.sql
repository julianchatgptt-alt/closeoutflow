-- Phase 4 platform-role separation and user-facing security activity.
create table public.platform_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_admin', 'platform_support')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'sign_in', 'password_changed', 'email_changed', 'mfa_enrolled',
      'mfa_removed', 'session_revoked', 'recovery_used'
    )
  ),
  ip inet,
  user_agent text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index user_security_events_user_occurred_idx
on public.user_security_events(user_id, occurred_at desc);

create trigger platform_roles_set_updated_at
before update on public.platform_roles
for each row execute function public.set_updated_at();

alter table public.platform_roles enable row level security;
alter table public.platform_roles force row level security;
alter table public.user_security_events enable row level security;
alter table public.user_security_events force row level security;

create policy platform_roles_select_self
on public.platform_roles for select to authenticated
using (user_id = auth.uid());

create policy user_security_events_select_self
on public.user_security_events for select to authenticated
using (user_id = auth.uid());

revoke all on public.platform_roles, public.user_security_events from public, anon, authenticated;
grant select on public.platform_roles, public.user_security_events to authenticated;
grant all on public.platform_roles, public.user_security_events to service_role;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = auth.uid() and role = 'platform_admin'
  );
$$;

create or replace function public.is_platform_support()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_roles
    where user_id = auth.uid() and role in ('platform_admin', 'platform_support')
  );
$$;

revoke all on function public.is_platform_admin() from public, anon;
revoke all on function public.is_platform_support() from public, anon;
grant execute on function public.is_platform_admin() to authenticated, service_role;
grant execute on function public.is_platform_support() to authenticated, service_role;

create or replace function public.record_user_security_event(
  target_user_id uuid,
  target_event_type text,
  target_ip inet default null,
  target_user_agent text default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
begin
  if target_event_type not in (
    'sign_in', 'password_changed', 'email_changed', 'mfa_enrolled',
    'mfa_removed', 'session_revoked', 'recovery_used'
  ) then
    raise exception 'invalid security event type' using errcode = '22023';
  end if;
  insert into public.user_security_events (
    user_id, event_type, ip, user_agent, metadata
  ) values (
    target_user_id, target_event_type, target_ip, target_user_agent, target_metadata
  )
  returning id into event_id;
  return event_id;
end;
$$;

revoke all on function public.record_user_security_event(
  uuid, text, inet, text, jsonb
) from public, anon, authenticated;
grant execute on function public.record_user_security_event(
  uuid, text, inet, text, jsonb
) to service_role;

create or replace function public.record_identity_event(
  target_action text,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  event_id uuid;
  security_type text;
begin
  if actor_id is null or target_action not in (
    'auth.registered', 'auth.email_verified', 'auth.signed_in',
    'auth.signed_out', 'auth.password_reset_requested', 'auth.password_changed',
    'auth.email_changed', 'auth.mfa_enrolled', 'auth.mfa_removed',
    'auth.session_revoked', 'profile.updated'
  ) then
    raise exception 'identity event is not permitted' using errcode = '42501';
  end if;
  if length(target_metadata::text) > 4096
    or target_metadata::text ~* '"[^"]*(password|token|secret|recovery.?code|session)[^"]*"'
  then
    raise exception 'unsafe identity event metadata' using errcode = '22023';
  end if;

  event_id := public.write_audit_event(
    'internal_user',
    case when target_action = 'profile.updated' then 'user_profile' else 'user' end,
    target_action,
    gen_random_uuid()::text,
    'web',
    null,
    actor_id,
    null,
    actor_id,
    null,
    null,
    null,
    null,
    null,
    target_metadata
  );

  security_type := case target_action
    when 'auth.signed_in' then 'sign_in'
    when 'auth.password_changed' then 'password_changed'
    when 'auth.email_changed' then 'email_changed'
    when 'auth.mfa_enrolled' then 'mfa_enrolled'
    when 'auth.mfa_removed' then 'mfa_removed'
    when 'auth.session_revoked' then 'session_revoked'
    else null
  end;
  if security_type is not null then
    insert into public.user_security_events (user_id, event_type, metadata)
    values (actor_id, security_type, target_metadata);
  end if;
  return event_id;
end;
$$;

create or replace function public.replace_recovery_code_hashes(target_hashes text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or cardinality(target_hashes) not between 1 and 10
    or exists (
      select 1 from unnest(target_hashes) hash
      where hash !~ '^[a-f0-9]{32}:[a-f0-9]{64}$'
    )
  then
    raise exception 'AAL2 and valid recovery hashes are required' using errcode = '42501';
  end if;
  update public.user_profiles
  set recovery_codes_hash = target_hashes
  where id = auth.uid();
end;
$$;

create or replace function public.consume_recovery_code_hash(target_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed boolean;
begin
  if auth.uid() is null or target_hash !~ '^[a-f0-9]{32}:[a-f0-9]{64}$' then
    return false;
  end if;
  update public.user_profiles
  set recovery_codes_hash = array_remove(recovery_codes_hash, target_hash)
  where id = auth.uid() and target_hash = any(recovery_codes_hash);
  consumed := found;
  if consumed then
    insert into public.user_security_events (user_id, event_type)
    values (auth.uid(), 'recovery_used');
    perform public.write_audit_event(
      'internal_user', 'user', 'auth.recovery_code_used',
      gen_random_uuid()::text, 'web', null, auth.uid(), null, auth.uid()
    );
  end if;
  return consumed;
end;
$$;

create or replace function public.request_account_deletion(confirmation text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null
    or confirmation <> 'DELETE'
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or coalesce((auth.jwt() ->> 'auth_time')::bigint, 0)
      < extract(epoch from now() - interval '15 minutes')::bigint
  then
    raise exception 'recent AAL2 and exact confirmation are required' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.organization_memberships
    where user_id = actor_id and role = 'owner' and status = 'active'
  ) then
    raise exception 'transfer or delete owned organizations first' using errcode = '23514';
  end if;

  update public.organization_memberships
  set status = 'removed', removed_at = now(), suspended_at = null,
      removal_reason = 'account_deleted'
  where user_id = actor_id and status <> 'removed';
  update public.user_profiles
  set account_status = 'deleted', deleted_at = now(),
      display_name = 'Deleted user', first_name = null, last_name = null,
      preferred_name = null, avatar_url = null, phone = null,
      recovery_codes_hash = '{}'::text[]
  where id = actor_id;
  perform public.write_audit_event(
    'internal_user', 'user', 'auth.account_deletion_requested',
    gen_random_uuid()::text, 'web', null, actor_id, null, actor_id
  );
end;
$$;

revoke all on function public.record_identity_event(text, jsonb) from public, anon;
revoke all on function public.replace_recovery_code_hashes(text[]) from public, anon;
revoke all on function public.consume_recovery_code_hash(text) from public, anon;
grant execute on function public.record_identity_event(text, jsonb) to authenticated;
grant execute on function public.replace_recovery_code_hashes(text[]) to authenticated;
grant execute on function public.consume_recovery_code_hash(text) to authenticated;
revoke all on function public.request_account_deletion(text) from public, anon;
grant execute on function public.request_account_deletion(text) to authenticated;

create or replace function public.get_organization_audit(
  target_organization_id uuid,
  result_limit integer default 50,
  before_time timestamptz default null
)
returns setof audit.audit_events
language sql
stable
security definer
set search_path = ''
as $$
  select event.*
  from audit.audit_events event
  where event.organization_id = target_organization_id
    and public.has_org_permission(target_organization_id, 'audit.view')
    and (before_time is null or event.occurred_at < before_time)
  order by event.occurred_at desc
  limit least(greatest(result_limit, 1), 100);
$$;

revoke all on function public.get_organization_audit(uuid, integer, timestamptz)
from public, anon;
grant execute on function public.get_organization_audit(uuid, integer, timestamptz)
to authenticated;

create or replace function public.platform_suspend_organization(
  target_organization_id uuid,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if not public.is_platform_admin()
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or nullif(trim(reason), '') is null
  then
    raise exception 'platform admin AAL2 and reason required' using errcode = '42501';
  end if;

  update public.organizations
  set status = 'suspended', suspended_at = now()
  where id = target_organization_id and status <> 'suspended';
  perform public.write_audit_event(
    'platform_admin', 'organization', 'platform.org_suspended',
    gen_random_uuid()::text, 'web', target_organization_id, actor_id,
    null, target_organization_id, null,
    jsonb_build_object('status', 'suspended'), null, null, null,
    jsonb_build_object('reason', reason)
  );
end;
$$;

create or replace function public.platform_suspend_user(
  target_user_id uuid,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if not public.is_platform_admin()
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or nullif(trim(reason), '') is null
  then
    raise exception 'platform admin AAL2 and reason required' using errcode = '42501';
  end if;
  if target_user_id = actor_id then
    raise exception 'platform administrators cannot suspend themselves'
      using errcode = '23514';
  end if;
  update public.user_profiles
  set account_status = 'suspended'
  where id = target_user_id and account_status = 'active';
  perform public.write_audit_event(
    'platform_admin', 'user', 'platform.user_suspended',
    gen_random_uuid()::text, 'web', null, actor_id, null, target_user_id,
    null, jsonb_build_object('account_status', 'suspended'), null, null, null,
    jsonb_build_object('reason', reason)
  );
end;
$$;

create or replace function public.platform_get_security_events(
  reason text,
  result_limit integer default 50
)
returns setof public.user_security_events
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_support()
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or nullif(trim(reason), '') is null
  then
    raise exception 'platform role, AAL2, and reason required' using errcode = '42501';
  end if;
  perform public.write_audit_event(
    case when public.is_platform_admin() then 'platform_admin' else 'internal_user' end,
    'user_security_event', 'platform.security_events_viewed',
    gen_random_uuid()::text, 'web', null, auth.uid(), null, null,
    null, null, null, null, null,
    jsonb_build_object('reason', trim(reason), 'limit', least(greatest(result_limit, 1), 100))
  );
  return query
  select event.*
  from public.user_security_events event
  order by event.occurred_at desc
  limit least(greatest(result_limit, 1), 100);
end;
$$;

revoke all on function public.platform_suspend_organization(uuid, text)
from public, anon;
revoke all on function public.platform_suspend_user(uuid, text)
from public, anon;
grant execute on function public.platform_suspend_organization(uuid, text)
to authenticated;
grant execute on function public.platform_suspend_user(uuid, text)
to authenticated;
revoke all on function public.platform_get_security_events(text, integer)
from public, anon;
grant execute on function public.platform_get_security_events(text, integer)
to authenticated;

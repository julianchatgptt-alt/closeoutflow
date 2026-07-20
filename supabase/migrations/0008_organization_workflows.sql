-- Phase 4 atomic organization, membership lifecycle, and ownership workflows.
create table public.organization_ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  from_user uuid not null references auth.users(id),
  to_user uuid not null references auth.users(id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  initiated_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create unique index organization_ownership_transfers_one_pending
on public.organization_ownership_transfers(organization_id)
where status = 'pending';
create index organization_ownership_transfers_target_status_idx
on public.organization_ownership_transfers(to_user, status);

create trigger organization_ownership_transfers_set_updated_at
before update on public.organization_ownership_transfers
for each row execute function public.set_updated_at();

alter table public.organization_ownership_transfers enable row level security;
alter table public.organization_ownership_transfers force row level security;

create policy ownership_transfers_select_involved
on public.organization_ownership_transfers for select to authenticated
using (
  from_user = auth.uid()
  or to_user = auth.uid()
  or public.has_org_permission(organization_id, 'organization.manage_members')
);

revoke all on public.organization_ownership_transfers from public, anon, authenticated;
grant select on public.organization_ownership_transfers to authenticated;
grant all on public.organization_ownership_transfers to service_role;

create or replace function public.create_organization_with_owner(target_display_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
  organization_id uuid;
  membership_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if length(trim(coalesce(target_display_name, ''))) not between 2 and 120 then
    raise exception 'organization name must be between 2 and 120 characters'
      using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.user_profiles
    where id = actor_id and account_status = 'active'
  ) then
    raise exception 'active profile required' using errcode = '42501';
  end if;

  base_slug := public.slugify(target_display_name);
  if base_slug = '' then base_slug := 'organization'; end if;
  candidate_slug := base_slug;
  while exists (select 1 from public.organizations where slug = candidate_slug) loop
    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix::text;
  end loop;

  insert into public.organizations (display_name, slug)
  values (trim(target_display_name), candidate_slug)
  returning id into organization_id;

  insert into public.organization_memberships (
    organization_id, user_id, role, status, joined_at
  ) values (
    organization_id, actor_id, 'owner', 'active', now()
  )
  returning id into membership_id;

  update public.user_profiles
  set onboarding_status = case
    when nullif(trim(display_name), '') is null then 'profile_pending'
    else 'complete'
  end
  where id = actor_id;

  perform public.write_audit_event(
    'internal_user', 'organization', 'organization.created',
    gen_random_uuid()::text, 'web', organization_id, actor_id,
    null, organization_id, null, null, null, null, null,
    jsonb_build_object('display_name', trim(target_display_name), 'slug', candidate_slug)
  );
  perform public.write_audit_event(
    'internal_user', 'organization_membership', 'membership.activated',
    gen_random_uuid()::text, 'web', organization_id, actor_id,
    null, membership_id, null, null, null, null, null,
    jsonb_build_object('role', 'owner', 'via', 'organization_creation')
  );

  return organization_id;
end;
$$;

create or replace function public.change_member_role(
  target_membership_id uuid,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  membership public.organization_memberships;
begin
  select * into membership from public.organization_memberships
  where id = target_membership_id for update;
  if not found or not public.has_org_permission(
    membership.organization_id, 'membership.change_role'
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if membership.role = 'owner' or target_role = 'owner' or target_role not in (
    'administrator', 'project_manager', 'closeout_coordinator',
    'internal_reviewer', 'viewer'
  ) then
    raise exception 'ownership changes require the transfer workflow' using errcode = '22023';
  end if;

  update public.organization_memberships set role = target_role
  where id = membership.id;
  perform public.write_audit_event(
    'internal_user', 'organization_membership', 'membership.role_changed',
    gen_random_uuid()::text, 'web', membership.organization_id, actor_id,
    null, membership.id, jsonb_build_object('role', membership.role),
    jsonb_build_object('role', target_role), null, null, null, '{}'::jsonb
  );
end;
$$;

create or replace function public.suspend_member(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  membership public.organization_memberships;
begin
  select * into membership from public.organization_memberships
  where id = target_membership_id for update;
  if not found or not public.has_org_permission(
    membership.organization_id, 'membership.suspend'
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if membership.role = 'owner' then
    raise exception 'the organization owner cannot be suspended' using errcode = '23514';
  end if;
  if membership.status = 'suspended' then return; end if;
  if membership.status <> 'active' then
    raise exception 'only active memberships can be suspended' using errcode = '22023';
  end if;

  update public.organization_memberships
  set status = 'suspended', suspended_at = now()
  where id = membership.id;
  perform public.write_audit_event(
    'internal_user', 'organization_membership', 'membership.suspended',
    gen_random_uuid()::text, 'web', membership.organization_id, actor_id,
    null, membership.id
  );
end;
$$;

create or replace function public.reactivate_member(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  membership public.organization_memberships;
begin
  select * into membership from public.organization_memberships
  where id = target_membership_id for update;
  if not found or not public.has_org_permission(
    membership.organization_id, 'membership.reactivate'
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if membership.status = 'active' then return; end if;
  if membership.status <> 'suspended' then
    raise exception 'a removed member must accept a new invitation' using errcode = '22023';
  end if;

  update public.organization_memberships
  set status = 'active', suspended_at = null
  where id = membership.id;
  perform public.write_audit_event(
    'internal_user', 'organization_membership', 'membership.reactivated',
    gen_random_uuid()::text, 'web', membership.organization_id, actor_id,
    null, membership.id
  );
end;
$$;

create or replace function public.remove_member(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  membership public.organization_memberships;
begin
  select * into membership from public.organization_memberships
  where id = target_membership_id for update;
  if not found or not public.has_org_permission(
    membership.organization_id, 'membership.remove'
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if membership.role = 'owner' then
    raise exception 'the organization owner cannot be removed' using errcode = '23514';
  end if;
  if membership.status = 'removed' then return; end if;

  update public.organization_memberships
  set status = 'removed', removed_at = now(), suspended_at = null,
      removal_reason = 'removed_by_admin'
  where id = membership.id;
  perform public.write_audit_event(
    'internal_user', 'organization_membership', 'membership.removed',
    gen_random_uuid()::text, 'web', membership.organization_id, actor_id,
    null, membership.id
  );
end;
$$;

create or replace function public.leave_organization(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  membership public.organization_memberships;
begin
  select * into membership from public.organization_memberships
  where organization_id = target_organization_id and user_id = actor_id
  for update;
  if not found or membership.status <> 'active' then
    raise exception 'active membership required' using errcode = '42501';
  end if;
  if membership.role = 'owner' then
    raise exception 'transfer ownership before leaving' using errcode = '23514';
  end if;

  update public.organization_memberships
  set status = 'removed', removed_at = now(), removal_reason = 'left'
  where id = membership.id;
  perform public.write_audit_event(
    'internal_user', 'organization_membership', 'membership.left',
    gen_random_uuid()::text, 'web', membership.organization_id, actor_id,
    null, membership.id
  );
end;
$$;

create or replace function public.initiate_ownership_transfer(
  target_organization_id uuid,
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer_id uuid;
begin
  if not public.has_org_permission(
    target_organization_id, 'organization.transfer_ownership'
  )
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or coalesce((auth.jwt() ->> 'auth_time')::bigint, 0)
      < extract(epoch from now() - interval '15 minutes')::bigint
  then
    raise exception 'ownership transfer requires owner access, recent reauthentication, and AAL2'
      using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id
      and user_id = target_user_id
      and status = 'active'
      and role <> 'owner'
  ) then
    raise exception 'target must be an active non-owner member' using errcode = '22023';
  end if;

  insert into public.organization_ownership_transfers (
    organization_id, from_user, to_user
  ) values (target_organization_id, actor_id, target_user_id)
  returning id into transfer_id;
  perform public.write_audit_event(
    'internal_user', 'organization_ownership_transfer',
    'ownership_transfer.initiated', gen_random_uuid()::text, 'web',
    target_organization_id, actor_id, null, transfer_id, null, null,
    null, null, null, jsonb_build_object('to_user', target_user_id)
  );
  return transfer_id;
end;
$$;

create or replace function public.complete_ownership_transfer(target_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer public.organization_ownership_transfers;
begin
  select * into transfer from public.organization_ownership_transfers
  where id = target_transfer_id for update;
  if not found
    or transfer.status <> 'pending'
    or transfer.expires_at <= now()
    or transfer.to_user <> actor_id
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
  then
    raise exception 'ownership transfer cannot be completed' using errcode = '42501';
  end if;

  perform 1 from public.organization_memberships
  where organization_id = transfer.organization_id for update;

  update public.organization_memberships
  set role = 'administrator'
  where organization_id = transfer.organization_id
    and user_id = transfer.from_user
    and role = 'owner'
    and status = 'active';
  if not found then
    raise exception 'current owner membership is invalid' using errcode = '23514';
  end if;

  update public.organization_memberships
  set role = 'owner'
  where organization_id = transfer.organization_id
    and user_id = transfer.to_user
    and status = 'active';
  if not found then
    raise exception 'target membership is invalid' using errcode = '23514';
  end if;

  update public.organization_ownership_transfers
  set status = 'accepted', responded_at = now()
  where id = transfer.id;
  perform public.write_audit_event(
    'internal_user', 'organization_ownership_transfer',
    'ownership_transfer.completed', gen_random_uuid()::text, 'web',
    transfer.organization_id, actor_id, null, transfer.id, null, null,
    null, null, null,
    jsonb_build_object('from_user', transfer.from_user, 'to_user', transfer.to_user)
  );
end;
$$;

create or replace function public.cancel_ownership_transfer(target_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  transfer public.organization_ownership_transfers;
begin
  select * into transfer from public.organization_ownership_transfers
  where id = target_transfer_id for update;
  if not found or transfer.status <> 'pending' or transfer.from_user <> actor_id then
    raise exception 'ownership transfer cannot be cancelled' using errcode = '42501';
  end if;
  update public.organization_ownership_transfers
  set status = 'cancelled', responded_at = now()
  where id = transfer.id;
  perform public.write_audit_event(
    'internal_user', 'organization_ownership_transfer',
    'ownership_transfer.cancelled', gen_random_uuid()::text, 'web',
    transfer.organization_id, actor_id, null, transfer.id
  );
end;
$$;

create or replace function public.update_organization_identity(
  target_organization_id uuid,
  target_display_name text,
  target_timezone text,
  target_locale text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.organizations;
begin
  select * into prior from public.organizations
  where id = target_organization_id for update;
  if not found or not public.has_org_permission(
    target_organization_id, 'organization.update'
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if length(trim(coalesce(target_display_name, ''))) not between 2 and 120
    or length(trim(coalesce(target_timezone, ''))) not between 1 and 80
    or target_locale !~ '^[a-z]{2,3}(-[A-Z]{2})?$'
  then
    raise exception 'invalid organization settings' using errcode = '22023';
  end if;

  update public.organizations
  set display_name = trim(target_display_name),
      timezone = trim(target_timezone),
      default_locale = target_locale
  where id = target_organization_id;
  perform public.write_audit_event(
    'internal_user', 'organization', 'organization.updated',
    gen_random_uuid()::text, 'web', target_organization_id, actor_id,
    null, target_organization_id,
    jsonb_build_object(
      'display_name', prior.display_name,
      'timezone', prior.timezone,
      'default_locale', prior.default_locale
    ),
    jsonb_build_object(
      'display_name', trim(target_display_name),
      'timezone', trim(target_timezone),
      'default_locale', target_locale
    )
  );
end;
$$;

create or replace function public.archive_organization(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if not public.has_org_permission(target_organization_id, 'organization.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.organizations
  set status = 'archived', archived_at = now()
  where id = target_organization_id and status = 'active';
  perform public.write_audit_event(
    'internal_user', 'organization', 'organization.archived',
    gen_random_uuid()::text, 'web', target_organization_id, actor_id,
    null, target_organization_id
  );
end;
$$;

create or replace function public.request_organization_deletion(
  target_organization_id uuid,
  confirmation text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  organization_name text;
  authenticated_at bigint := coalesce((auth.jwt() ->> 'auth_time')::bigint, 0);
begin
  select display_name into organization_name
  from public.organizations where id = target_organization_id for update;
  if not found
    or not public.has_org_permission(target_organization_id, 'organization.delete')
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or authenticated_at < extract(epoch from now() - interval '15 minutes')::bigint
    or confirmation <> organization_name
  then
    raise exception 'recent AAL2 verification and exact confirmation required'
      using errcode = '42501';
  end if;
  update public.organizations
  set status = 'pending_deletion', deletion_requested_at = now()
  where id = target_organization_id and status = 'active';
  perform public.write_audit_event(
    'internal_user', 'organization', 'organization.deletion_requested',
    gen_random_uuid()::text, 'web', target_organization_id, actor_id,
    null, target_organization_id
  );
end;
$$;

create or replace function public.cancel_organization_deletion(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if not exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id
      and user_id = actor_id and role = 'owner' and status = 'active'
  ) then
    raise exception 'owner access required' using errcode = '42501';
  end if;
  update public.organizations
  set status = 'active', deletion_requested_at = null
  where id = target_organization_id and status = 'pending_deletion';
  perform public.write_audit_event(
    'internal_user', 'organization', 'organization.deletion_cancelled',
    gen_random_uuid()::text, 'web', target_organization_id, actor_id,
    null, target_organization_id
  );
end;
$$;

do $$
declare
  signature text;
begin
  foreach signature in array array[
    'public.create_organization_with_owner(text)',
    'public.change_member_role(uuid,text)',
    'public.suspend_member(uuid)',
    'public.reactivate_member(uuid)',
    'public.remove_member(uuid)',
    'public.leave_organization(uuid)',
    'public.initiate_ownership_transfer(uuid,uuid)',
    'public.complete_ownership_transfer(uuid)',
    'public.cancel_ownership_transfer(uuid)',
    'public.update_organization_identity(uuid,text,text,text)',
    'public.archive_organization(uuid)',
    'public.request_organization_deletion(uuid,text)',
    'public.cancel_organization_deletion(uuid)'
  ]
  loop
    execute 'revoke all on function ' || signature || ' from public, anon';
    execute 'grant execute on function ' || signature || ' to authenticated';
  end loop;
end;
$$;

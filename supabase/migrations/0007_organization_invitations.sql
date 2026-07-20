-- Phase 4 secure, non-enumerable organization invitations.
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email extensions.citext not null,
  role text not null check (
    role in (
      'administrator', 'project_manager', 'closeout_coordinator',
      'internal_reviewer', 'viewer'
    )
  ),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  accepted_by uuid references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organization_invitations_one_pending_email
on public.organization_invitations(organization_id, email)
where status = 'pending';
create index organization_invitations_org_status_idx
on public.organization_invitations(organization_id, status);
create index organization_invitations_email_status_idx
on public.organization_invitations(email, status);

create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row execute function public.set_updated_at();

alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;

create policy invitations_select_admin
on public.organization_invitations for select to authenticated
using (public.has_org_permission(organization_id, 'membership.invite'));

revoke all on public.organization_invitations from public, anon, authenticated;
grant select on public.organization_invitations to authenticated;
grant all on public.organization_invitations to service_role;

create or replace function public.create_invitation(
  target_organization_id uuid,
  target_email text,
  target_role text
)
returns table (invitation_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  raw_token text;
  created_id uuid;
  normalized_email extensions.citext := lower(trim(target_email))::extensions.citext;
begin
  if actor_id is null or not public.has_org_permission(
    target_organization_id, 'membership.invite'
  ) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if target_role not in (
    'administrator', 'project_manager', 'closeout_coordinator',
    'internal_reviewer', 'viewer'
  ) then
    raise exception 'invalid invitation role' using errcode = '22023';
  end if;
  if normalized_email is null or normalized_email::text !~ '^[^@[:space:]]+@[^@[:space:]]+$' then
    raise exception 'invalid invitation email' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.organization_memberships membership
    join auth.users account on account.id = membership.user_id
    where membership.organization_id = target_organization_id
      and lower(account.email) = lower(normalized_email::text)
      and membership.status = 'active'
  ) then
    raise exception 'user is already an active member' using errcode = '23505';
  end if;

  raw_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'base64');
  raw_token := translate(raw_token, '+/=', '-_');

  insert into public.organization_invitations (
    organization_id, email, role, token_hash, invited_by, expires_at
  ) values (
    target_organization_id,
    normalized_email,
    target_role,
    pg_catalog.encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    actor_id,
    now() + interval '14 days'
  )
  returning id into created_id;

  perform public.write_audit_event(
    p_actor_type => 'internal_user',
    p_target_type => 'organization_invitation',
    p_action => 'invitation.created',
    p_request_id => gen_random_uuid()::text,
    p_source => 'web',
    p_organization_id => target_organization_id,
    p_actor_id => actor_id,
    p_target_id => created_id,
    p_metadata => jsonb_build_object('email', normalized_email::text, 'role', target_role)
  );

  return query select created_id, raw_token;
end;
$$;

create or replace function public.accept_invitation(raw_token text)
returns table (membership_id uuid, organization_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invitation public.organization_invitations;
  resulting_membership_id uuid;
begin
  if actor_id is null or raw_token is null or length(raw_token) < 32 then
    raise exception 'invitation is no longer valid' using errcode = '22023';
  end if;

  select * into invitation
  from public.organization_invitations candidate
  where candidate.token_hash = pg_catalog.encode(extensions.digest(raw_token, 'sha256'), 'hex')
  for update;

  if not found then
    raise exception 'invitation is no longer valid' using errcode = '22023';
  end if;

  if invitation.status = 'accepted' and invitation.accepted_by = actor_id then
    select id into resulting_membership_id
    from public.organization_memberships membership
    where membership.organization_id = invitation.organization_id
      and membership.user_id = actor_id;
    return query select resulting_membership_id, invitation.organization_id;
    return;
  end if;

  if invitation.status <> 'pending'
    or invitation.expires_at <= now()
    or actor_email = ''
    or actor_email <> lower(invitation.email::text)
    or not exists (
      select 1 from public.organizations organization
      where organization.id = invitation.organization_id and organization.status = 'active'
    )
  then
    raise exception 'invitation is no longer valid' using errcode = '22023';
  end if;

  insert into public.organization_memberships (
    organization_id, user_id, role, status, invited_by, joined_at,
    suspended_at, removed_at, removal_reason
  ) values (
    invitation.organization_id, actor_id, invitation.role, 'active',
    invitation.invited_by, now(), null, null, null
  )
  on conflict on constraint organization_memberships_organization_id_user_id_key do update
    set role = excluded.role,
        status = 'active',
        invited_by = excluded.invited_by,
        joined_at = coalesce(organization_memberships.joined_at, now()),
        suspended_at = null,
        removed_at = null,
        removal_reason = null
  returning id into resulting_membership_id;

  update public.organization_invitations
  set status = 'accepted', accepted_by = actor_id, accepted_at = now()
  where id = invitation.id;

  perform public.write_audit_event(
    p_actor_type => 'internal_user',
    p_target_type => 'organization_invitation',
    p_action => 'invitation.accepted',
    p_request_id => gen_random_uuid()::text,
    p_source => 'web',
    p_organization_id => invitation.organization_id,
    p_actor_id => actor_id,
    p_target_id => invitation.id,
    p_metadata => jsonb_build_object('role', invitation.role)
  );
  perform public.write_audit_event(
    p_actor_type => 'internal_user',
    p_target_type => 'organization_membership',
    p_action => 'membership.activated',
    p_request_id => gen_random_uuid()::text,
    p_source => 'web',
    p_organization_id => invitation.organization_id,
    p_actor_id => actor_id,
    p_target_id => resulting_membership_id,
    p_metadata => jsonb_build_object('role', invitation.role, 'via', 'invitation')
  );

  return query select resulting_membership_id, invitation.organization_id;
end;
$$;

create or replace function public.get_invitation_preview(raw_token text)
returns table (
  organization_name text,
  invitation_email text,
  invitation_role text,
  invitation_state text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    organization.display_name,
    invitation.email::text,
    invitation.role,
    case
      when invitation.status <> 'pending' then 'invalid'
      when invitation.expires_at <= now() then 'invalid'
      when organization.status <> 'active' then 'unavailable'
      else 'pending'
    end
  from public.organization_invitations invitation
  join public.organizations organization on organization.id = invitation.organization_id
  where length(coalesce(raw_token, '')) >= 32
    and invitation.token_hash = pg_catalog.encode(
      extensions.digest(raw_token, 'sha256'), 'hex'
    )
  limit 1;
$$;

create or replace function public.revoke_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  invitation public.organization_invitations;
begin
  select * into invitation
  from public.organization_invitations
  where id = target_invitation_id
  for update;
  if not found or not public.has_org_permission(invitation.organization_id, 'membership.invite') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if invitation.status <> 'pending' then
    raise exception 'invitation is no longer pending' using errcode = '22023';
  end if;

  update public.organization_invitations
  set status = 'revoked', revoked_at = now()
  where id = invitation.id;
  perform public.write_audit_event(
    'internal_user', 'organization_invitation', 'invitation.revoked',
    gen_random_uuid()::text, 'web', invitation.organization_id, actor_id,
    null, invitation.id, null, null, null, null, null,
    jsonb_build_object('email', invitation.email::text)
  );
end;
$$;

create or replace function public.resend_invitation(target_invitation_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  invitation public.organization_invitations;
  raw_token text;
begin
  select * into invitation
  from public.organization_invitations
  where id = target_invitation_id
  for update;
  if not found or not public.has_org_permission(invitation.organization_id, 'membership.invite') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if invitation.status <> 'pending' then
    raise exception 'invitation is no longer pending' using errcode = '22023';
  end if;

  raw_token := translate(
    pg_catalog.encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_'
  );
  update public.organization_invitations
  set token_hash = pg_catalog.encode(extensions.digest(raw_token, 'sha256'), 'hex'),
      expires_at = now() + interval '14 days'
  where id = invitation.id;
  perform public.write_audit_event(
    'internal_user', 'organization_invitation', 'invitation.resent',
    gen_random_uuid()::text, 'web', invitation.organization_id, actor_id,
    null, invitation.id, null, null, null, null, null,
    jsonb_build_object('email', invitation.email::text)
  );
  return raw_token;
end;
$$;

revoke all on function public.create_invitation(uuid, text, text) from public, anon;
revoke all on function public.accept_invitation(text) from public, anon;
revoke all on function public.get_invitation_preview(text) from public;
revoke all on function public.revoke_invitation(uuid) from public, anon;
revoke all on function public.resend_invitation(uuid) from public, anon;
grant execute on function public.create_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.get_invitation_preview(text) to anon, authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.resend_invitation(uuid) to authenticated;

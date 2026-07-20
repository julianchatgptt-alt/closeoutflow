-- Phase 4 organization membership and database authorization helpers.
create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (
    role in (
      'owner', 'administrator', 'project_manager', 'closeout_coordinator',
      'internal_reviewer', 'viewer'
    )
  ),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'removed')),
  job_title text,
  invited_by uuid references auth.users(id) on delete set null,
  removal_reason text check (
    removal_reason is null or removal_reason in (
      'left', 'removed_by_admin', 'account_deleted', 'org_deleted'
    )
  ),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  suspended_at timestamptz,
  removed_at timestamptz,
  unique (organization_id, user_id)
);

create unique index organization_memberships_one_active_owner
on public.organization_memberships(organization_id)
where role = 'owner' and status = 'active';
create index organization_memberships_user_status_idx
on public.organization_memberships(user_id, status);
create index organization_memberships_org_status_idx
on public.organization_memberships(organization_id, status);
create index organization_memberships_org_role_idx
on public.organization_memberships(organization_id, role);

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function public.set_updated_at();

alter table public.organization_memberships enable row level security;
alter table public.organization_memberships force row level security;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_org_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.organizations organization on organization.id = membership.organization_id
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
      and organization.status = 'active'
  );
$$;

create or replace function public.has_org_permission(
  target_organization_id uuid,
  permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case permission
    when 'profile.update_self' then public.has_org_role(
      target_organization_id,
      array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer']
    )
    when 'organization.view' then public.has_org_role(
      target_organization_id,
      array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer']
    )
    when 'membership.view' then public.has_org_role(
      target_organization_id,
      array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer']
    )
    when 'membership.leave' then public.has_org_role(
      target_organization_id,
      array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer']
    )
    when 'organization.update' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'organization.manage_members' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'organization.manage_roles' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'membership.invite' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'membership.change_role' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'membership.suspend' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'membership.reactivate' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'membership.remove' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'audit.view' then public.has_org_role(
      target_organization_id, array['owner','administrator']
    )
    when 'organization.transfer_ownership' then public.has_org_role(
      target_organization_id, array['owner']
    )
    when 'organization.archive' then public.has_org_role(
      target_organization_id, array['owner']
    )
    when 'organization.delete' then public.has_org_role(
      target_organization_id, array['owner']
    )
    when 'organization.manage_security' then public.has_org_role(
      target_organization_id, array['owner']
    )
    when 'security.manage' then public.has_org_role(
      target_organization_id, array['owner']
    )
    else false
  end;
$$;

revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.has_org_role(uuid, text[]) from public, anon;
revoke all on function public.has_org_permission(uuid, text) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.has_org_role(uuid, text[]) to authenticated, service_role;
grant execute on function public.has_org_permission(uuid, text) to authenticated, service_role;

create policy organizations_select_member
on public.organizations for select to authenticated
using (public.is_org_member(id));

create policy organizations_update_admin
on public.organizations for update to authenticated
using (status = 'active' and public.has_org_permission(id, 'organization.update'))
with check (status = 'active' and public.has_org_permission(id, 'organization.update'));

create policy memberships_select_same_org
on public.organization_memberships for select to authenticated
using (user_id = auth.uid() or public.is_org_member(organization_id));

create policy memberships_update_self_job_title
on public.organization_memberships for update to authenticated
using (user_id = auth.uid() and status = 'active')
with check (
  user_id = auth.uid()
  and status = 'active'
  and organization_id = organization_id
);

create policy user_profiles_select_shared_org
on public.user_profiles for select to authenticated
using (
  exists (
    select 1
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
    join public.organizations organization
      on organization.id = mine.organization_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = user_profiles.id
      and theirs.status = 'active'
      and organization.status = 'active'
  )
);

revoke all on public.organization_memberships from public, anon, authenticated;
grant select on public.organization_memberships to authenticated;
grant update (job_title) on public.organization_memberships to authenticated;
grant all on public.organization_memberships to service_role;

create or replace function public.get_organization_members(target_organization_id uuid)
returns table (
  membership_id uuid,
  user_id uuid,
  display_name text,
  email text,
  role text,
  status text,
  job_title text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    membership.id,
    membership.user_id,
    coalesce(nullif(profile.display_name, ''), account.email, 'Closeout user'),
    account.email::text,
    membership.role,
    membership.status,
    membership.job_title,
    membership.joined_at
  from public.organization_memberships membership
  join auth.users account on account.id = membership.user_id
  left join public.user_profiles profile on profile.id = membership.user_id
  where membership.organization_id = target_organization_id
    and public.has_org_permission(target_organization_id, 'membership.view')
  order by
    case membership.status when 'active' then 0 when 'suspended' then 1 else 2 end,
    lower(coalesce(nullif(profile.display_name, ''), account.email, ''))
$$;

revoke all on function public.get_organization_members(uuid) from public, anon;
grant execute on function public.get_organization_members(uuid) to authenticated;

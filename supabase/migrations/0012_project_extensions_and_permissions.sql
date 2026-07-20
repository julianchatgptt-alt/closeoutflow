-- Phase 5 project-foundation extensions and organization permission parity.
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists citext with schema extensions;

create or replace function public.normalize_directory_text(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(regexp_replace(lower(coalesce(value, '')), '[^a-z0-9]+', ' ', 'g'));
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
    when 'profile.update_self' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'organization.view' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'membership.view' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'membership.leave' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'company.view' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'contact.view' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'organization.update' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'organization.manage_members' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'organization.manage_roles' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.invite' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.change_role' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.suspend' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.reactivate' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.remove' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'audit.view' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'project.create' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'project.view_all' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'company.create' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'company.update' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'company.archive' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'contact.create' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'contact.update' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'contact.archive' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'organization.transfer_ownership' then public.has_org_role(target_organization_id, array['owner'])
    when 'organization.archive' then public.has_org_role(target_organization_id, array['owner'])
    when 'organization.delete' then public.has_org_role(target_organization_id, array['owner'])
    when 'organization.manage_security' then public.has_org_role(target_organization_id, array['owner'])
    when 'security.manage' then public.has_org_role(target_organization_id, array['owner'])
    else false
  end;
$$;

revoke all on function public.normalize_directory_text(text) from public, anon;
grant execute on function public.normalize_directory_text(text) to authenticated, service_role;
revoke all on function public.has_org_permission(uuid, text) from public, anon;
grant execute on function public.has_org_permission(uuid, text) to authenticated, service_role;

comment on function public.has_org_permission(uuid, text) is
  'Organization permission mirror for packages/authz. Project-scoped permissions are resolved separately by project_permission.';

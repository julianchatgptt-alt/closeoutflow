-- Phase 6 requirement foundations: template/requirement permission parity and
-- the organization requirement-category taxonomy.

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
    when 'template.view' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator','internal_reviewer','viewer'])
    when 'organization.update' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'organization.manage_members' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'organization.manage_roles' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.invite' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.change_role' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.suspend' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.reactivate' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'membership.remove' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'audit.view' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'template.archive' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'project.create' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'project.view_all' then public.has_org_role(target_organization_id, array['owner','administrator'])
    when 'company.create' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'company.update' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'company.archive' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'contact.create' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'contact.update' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'contact.archive' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'template.manage' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'template.publish' then public.has_org_role(target_organization_id, array['owner','administrator','project_manager','closeout_coordinator'])
    when 'organization.transfer_ownership' then public.has_org_role(target_organization_id, array['owner'])
    when 'organization.archive' then public.has_org_role(target_organization_id, array['owner'])
    when 'organization.delete' then public.has_org_role(target_organization_id, array['owner'])
    when 'organization.manage_security' then public.has_org_role(target_organization_id, array['owner'])
    when 'security.manage' then public.has_org_role(target_organization_id, array['owner'])
    else false
  end;
$$;

create or replace function public.project_permission(target_project_id uuid, permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  effective_role text;
begin
  select case
    when membership.role in ('owner','administrator') then 'project_administrator'
    else assignment.project_role
  end into effective_role
  from public.projects project
  join public.organizations organization on organization.id = project.organization_id
  join public.organization_memberships membership
    on membership.organization_id = project.organization_id
   and membership.user_id = auth.uid()
   and membership.status = 'active'
  left join public.project_members assignment
    on assignment.project_id = project.id
   and assignment.membership_id = membership.id
   and assignment.status = 'active'
  where project.id = target_project_id and organization.status = 'active';

  if effective_role is null then return false; end if;
  return case permission
    when 'project.view' then effective_role in ('project_administrator','project_manager','closeout_coordinator','internal_reviewer','viewer')
    when 'project.update' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'project.archive' then effective_role = 'project_administrator'
    when 'project.restore' then effective_role = 'project_administrator'
    when 'project.manage_team' then effective_role in ('project_administrator','project_manager')
    when 'project.manage_companies' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'project.manage_contacts' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'requirement.view' then effective_role in ('project_administrator','project_manager','closeout_coordinator','internal_reviewer','viewer')
    when 'requirement.manage' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'requirement.assign' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'requirement.set_dates' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'requirement.apply_template' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'requirement.set_not_applicable' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    when 'requirement.archive' then effective_role in ('project_administrator','project_manager','closeout_coordinator')
    else false
  end;
end;
$$;

-- Organization requirement-category taxonomy (shared by templates and registers).
create table public.requirement_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  description text,
  sort_order integer not null default 0,
  is_system boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  archived_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create unique index requirement_categories_org_active_name_unique
on public.requirement_categories (organization_id, lower(name))
where archived_at is null;
create index requirement_categories_org_sort_idx
on public.requirement_categories (organization_id, sort_order, id);

create trigger requirement_categories_set_updated_at before update on public.requirement_categories
for each row execute function public.set_updated_at();

alter table public.requirement_categories enable row level security;
alter table public.requirement_categories force row level security;

create policy requirement_categories_select_members on public.requirement_categories
for select to authenticated
using (public.is_org_member(organization_id));

revoke all on public.requirement_categories from public, anon, authenticated;
grant select on public.requirement_categories to authenticated;
grant all on public.requirement_categories to service_role;

create or replace function public.create_requirement_category(
  target_organization_id uuid,
  category_name text,
  category_description text default null,
  request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  next_sort integer;
  new_category_id uuid;
begin
  if actor_id is null or not public.has_org_permission(target_organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(category_name, ''))) not between 2 and 80 then
    raise exception 'category name must be between 2 and 80 characters' using errcode = '22023';
  end if;
  select coalesce(max(sort_order), 0) + 10 into next_sort
  from public.requirement_categories where organization_id = target_organization_id;

  insert into public.requirement_categories (organization_id, name, description, sort_order, created_by)
  values (target_organization_id, trim(category_name), nullif(trim(category_description), ''), next_sort, actor_id)
  returning id into new_category_id;

  perform public.write_audit_event(
    'internal_user', 'requirement_category', 'requirement_category.created',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    target_organization_id, actor_id, null, new_category_id,
    null, null, null, null, null,
    jsonb_build_object('name', trim(category_name))
  );
  return new_category_id;
exception
  when unique_violation then
    raise exception 'a category with that name already exists' using errcode = '23505';
end;
$$;

create or replace function public.update_requirement_category(
  target_category_id uuid,
  expected_updated_at timestamptz,
  category_data jsonb,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_categories;
  next_updated_at timestamptz;
  changed_fields text[];
begin
  select * into prior from public.requirement_categories where id = target_category_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.archived_at is not null then
    raise exception 'archived categories are read only' using errcode = '22023';
  end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'category was updated by another user' using errcode = 'P0001';
  end if;
  if category_data - array['name','description'] <> '{}'::jsonb then
    raise exception 'unsupported category field' using errcode = '22023';
  end if;
  if category_data ? 'name' and char_length(trim(coalesce(category_data->>'name',''))) not between 2 and 80 then
    raise exception 'category name must be between 2 and 80 characters' using errcode = '22023';
  end if;

  select coalesce(array_agg(key order by key), '{}') into changed_fields from jsonb_object_keys(category_data) key;
  update public.requirement_categories set
    name = case when category_data ? 'name' then trim(category_data->>'name') else name end,
    description = case when category_data ? 'description' then nullif(trim(category_data->>'description'),'') else description end
  where id = target_category_id
  returning updated_at into next_updated_at;

  perform public.write_audit_event(
    'internal_user', 'requirement_category', 'requirement_category.updated',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, target_category_id,
    null, null, null, null, null,
    jsonb_strip_nulls(jsonb_build_object(
      'changed_fields', to_jsonb(changed_fields),
      'renamed_from', case when category_data ? 'name' and trim(category_data->>'name') <> prior.name then prior.name end
    ))
  );
  return next_updated_at;
exception
  when unique_violation then
    raise exception 'a category with that name already exists' using errcode = '23505';
end;
$$;

create or replace function public.reorder_requirement_categories(
  target_organization_id uuid,
  ordered_category_ids uuid[],
  request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  owned_count integer;
begin
  if actor_id is null or not public.has_org_permission(target_organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  select count(*) into owned_count from public.requirement_categories
  where organization_id = target_organization_id and id = any(ordered_category_ids);
  if owned_count <> coalesce(array_length(ordered_category_ids, 1), 0) or owned_count = 0 then
    raise exception 'invalid category selection' using errcode = '22023';
  end if;

  update public.requirement_categories category
  set sort_order = ordering.position * 10
  from unnest(ordered_category_ids) with ordinality as ordering(category_id, position)
  where category.id = ordering.category_id
    and category.organization_id = target_organization_id;

  perform public.write_audit_event(
    'internal_user', 'requirement_category', 'requirement_category.updated',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    target_organization_id, actor_id, null, null,
    null, null, null, null, null,
    jsonb_build_object('changed_fields', jsonb_build_array('sort_order'), 'reordered_count', owned_count)
  );
end;
$$;

create or replace function public.archive_requirement_category(target_category_id uuid, request_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_categories;
begin
  select * into prior from public.requirement_categories where id = target_category_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.archived_at is not null then return; end if;
  update public.requirement_categories set archived_at = now(), archived_by = actor_id where id = target_category_id;
  perform public.write_audit_event(
    'internal_user', 'requirement_category', 'requirement_category.archived',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, target_category_id,
    null, null, null, null, null,
    jsonb_build_object('name', prior.name)
  );
end;
$$;

create or replace function public.restore_requirement_category(target_category_id uuid, request_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_categories;
begin
  select * into prior from public.requirement_categories where id = target_category_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.archived_at is null then return; end if;
  update public.requirement_categories set archived_at = null, archived_by = null where id = target_category_id;
  perform public.write_audit_event(
    'internal_user', 'requirement_category', 'requirement_category.restored',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, target_category_id,
    null, null, null, null, null,
    jsonb_build_object('name', prior.name)
  );
exception
  when unique_violation then
    raise exception 'an active category with that name already exists' using errcode = '23505';
end;
$$;

-- Idempotent starter content (categories now; the starter template joins in 0023).
create or replace function public.ensure_requirement_defaults(
  target_organization_id uuid,
  request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  default_names text[] := array[
    'O&M Manuals',
    'Warranties',
    'As-Built Drawings',
    'Permits & Inspections',
    'Test & Commissioning Reports',
    'Training & Demonstrations',
    'Attic Stock & Spare Parts',
    'Lien Waivers & Financial',
    'General'
  ];
  created_names text[] := array[]::text[];
  category_name text;
  position integer := 0;
begin
  if actor_id is null or not public.has_org_permission(target_organization_id, 'template.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if exists (select 1 from public.requirement_categories where organization_id = target_organization_id) then
    return;
  end if;

  foreach category_name in array default_names loop
    position := position + 10;
    insert into public.requirement_categories (organization_id, name, sort_order, is_system, created_by)
    values (target_organization_id, category_name, position, true, actor_id)
    on conflict (organization_id, lower(name)) where archived_at is null do nothing;
    created_names := created_names || category_name;
  end loop;

  perform public.write_audit_event(
    'internal_user', 'requirement_category', 'requirement_category.created',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    target_organization_id, actor_id, null, null,
    null, null, null, null, null,
    jsonb_build_object('seeded', true, 'names', to_jsonb(created_names))
  );
end;
$$;

do $$ declare signature text; begin
  foreach signature in array array[
    'public.create_requirement_category(uuid,text,text,text)',
    'public.update_requirement_category(uuid,timestamptz,jsonb,text)',
    'public.reorder_requirement_categories(uuid,uuid[],text)',
    'public.archive_requirement_category(uuid,text)',
    'public.restore_requirement_category(uuid,text)',
    'public.ensure_requirement_defaults(uuid,text)'
  ] loop
    execute 'revoke all on function '||signature||' from public, anon';
    execute 'grant execute on function '||signature||' to authenticated';
  end loop;
end $$;

comment on function public.has_org_permission(uuid, text) is
  'Organization permission mirror for packages/authz. Project-scoped permissions are resolved separately by project_permission.';
comment on function public.project_permission(uuid, text) is
  'Project-scoped permission mirror for packages/authz, including Phase 6 requirement configuration permissions.';
comment on table public.requirement_categories is
  'Organization-defined requirement grouping taxonomy shared by templates and project requirement registers.';

-- Phase 5 projects and atomic internal project assignment.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  project_number text,
  status text not null default 'draft' check (
    status in ('draft','active','closeout_in_progress','owner_review','published','complete','archived','cancelled')
  ),
  project_type text check (
    project_type is null or project_type in ('restaurant','retail','medical','office','warehouse','church','school','municipal','multifamily','other')
  ),
  delivery_method text check (
    delivery_method is null or delivery_method in ('design_bid_build','design_build','cm_at_risk','cm_agency','ipd','other')
  ),
  description text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text not null default 'US' check (country ~ '^[A-Z]{2}$'),
  timezone text,
  planned_start_date date,
  substantial_completion_date date,
  final_completion_date date,
  closeout_target_date date,
  actual_completion_date date,
  cover_image_url text,
  tags text[] not null default '{}',
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  archived_by uuid references auth.users(id) on delete restrict,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check (planned_start_date is null or substantial_completion_date is null or planned_start_date <= substantial_completion_date),
  check (substantial_completion_date is null or final_completion_date is null or substantial_completion_date <= final_completion_date),
  check (planned_start_date is null or actual_completion_date is null or planned_start_date <= actual_completion_date)
);

create unique index projects_org_number_unique
on public.projects (organization_id, lower(project_number))
where project_number is not null;
create index projects_org_status_idx on public.projects (organization_id, status);
create index projects_org_updated_idx on public.projects (organization_id, updated_at desc, id);
create index projects_org_target_idx on public.projects (organization_id, closeout_target_date);
create index projects_name_trgm_idx on public.projects using gin (lower(name) extensions.gin_trgm_ops);
create index projects_number_trgm_idx on public.projects using gin (lower(project_number) extensions.gin_trgm_ops);
create index projects_tags_idx on public.projects using gin (tags);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  membership_id uuid not null references public.organization_memberships(id) on delete restrict,
  project_role text not null check (
    project_role in ('project_administrator','project_manager','closeout_coordinator','internal_reviewer','viewer')
  ),
  status text not null default 'active' check (status in ('active','removed')),
  assigned_by uuid not null references auth.users(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (project_id, membership_id)
);

create index project_members_project_status_idx on public.project_members (project_id, status);
create index project_members_membership_status_idx on public.project_members (membership_id, status);

create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
create trigger project_members_set_updated_at before update on public.project_members
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.project_members enable row level security;
alter table public.project_members force row level security;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.projects project
    join public.organizations organization on organization.id = project.organization_id
    join public.organization_memberships membership
      on membership.organization_id = project.organization_id
     and membership.user_id = auth.uid()
     and membership.status = 'active'
    where project.id = target_project_id
      and organization.status = 'active'
      and (
        membership.role in ('owner','administrator')
        or exists (
          select 1 from public.project_members assignment
          where assignment.project_id = project.id
            and assignment.organization_id = project.organization_id
            and assignment.membership_id = membership.id
            and assignment.status = 'active'
        )
      )
  );
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
    else false
  end;
end;
$$;

create policy projects_select_accessible on public.projects for select to authenticated
using (public.can_access_project(id));

create policy project_members_select_accessible on public.project_members for select to authenticated
using (
  exists (
    select 1 from public.organization_memberships mine
    join public.organizations organization on organization.id = mine.organization_id
    where mine.organization_id = project_members.organization_id
      and mine.user_id = auth.uid()
      and mine.status = 'active'
      and organization.status = 'active'
      and (
        mine.role in ('owner','administrator')
        or mine.id = project_members.membership_id
        or public.can_access_project(project_members.project_id)
      )
  )
);

revoke all on public.projects, public.project_members from public, anon, authenticated;
grant select on public.projects, public.project_members to authenticated;
grant all on public.projects, public.project_members to service_role;
revoke all on function public.can_access_project(uuid) from public, anon;
revoke all on function public.project_permission(uuid, text) from public, anon;
grant execute on function public.can_access_project(uuid) to authenticated, service_role;
grant execute on function public.project_permission(uuid, text) to authenticated, service_role;

create or replace function public.create_project(
  target_organization_id uuid,
  project_name text,
  project_number text default null,
  project_type text default null,
  request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_membership public.organization_memberships;
  new_project_id uuid;
  initial_project_role text;
begin
  if actor_id is null or not public.has_org_permission(target_organization_id, 'project.create') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(project_name, ''))) not between 2 and 160 then
    raise exception 'project name must be between 2 and 160 characters' using errcode = '22023';
  end if;

  select * into actor_membership from public.organization_memberships
  where organization_id = target_organization_id and user_id = actor_id and status = 'active';
  if not found then raise exception 'active membership required' using errcode = '42501'; end if;

  initial_project_role := case
    when actor_membership.role in ('owner','administrator') then 'project_administrator'
    else 'project_manager'
  end;

  insert into public.projects (
    organization_id, name, project_number, project_type, created_by
  ) values (
    target_organization_id,
    trim(project_name),
    nullif(trim(project_number), ''),
    nullif(project_type, ''),
    actor_id
  ) returning id into new_project_id;

  insert into public.project_members (
    organization_id, project_id, membership_id, project_role, assigned_by
  ) values (
    target_organization_id, new_project_id, actor_membership.id, initial_project_role, actor_id
  );

  perform public.write_audit_event(
    'internal_user', 'project', 'project.created', coalesce(request_id, gen_random_uuid()::text), 'web',
    target_organization_id, actor_id, new_project_id, new_project_id,
    null, null, null, null, null,
    jsonb_build_object('name', trim(project_name))
  );
  return new_project_id;
exception
  when unique_violation then
    raise exception 'project number is already in use' using errcode = '23505';
end;
$$;

create or replace function public.update_project(
  target_project_id uuid,
  expected_updated_at timestamptz,
  project_data jsonb,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.projects;
  next_updated_at timestamptz;
  changed_fields text[];
begin
  select * into prior from public.projects where id = target_project_id for update;
  if not found or not public.project_permission(target_project_id, 'project.update') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.status = 'archived' then raise exception 'archived projects are read only' using errcode = '22023'; end if;
  if prior.updated_at <> expected_updated_at then raise exception 'project was updated by another user' using errcode = '40001'; end if;
  if project_data - array[
    'name','project_number','project_type','delivery_method','description','address_line1','address_line2','city','region','postal_code','country','timezone','planned_start_date','substantial_completion_date','final_completion_date','closeout_target_date','actual_completion_date','tags','notes'
  ] <> '{}'::jsonb then
    raise exception 'unsupported project field' using errcode = '22023';
  end if;
  if project_data ? 'name' and char_length(trim(coalesce(project_data->>'name',''))) not between 2 and 160 then
    raise exception 'project name must be between 2 and 160 characters' using errcode = '22023';
  end if;

  select coalesce(array_agg(key order by key), '{}') into changed_fields from jsonb_object_keys(project_data) key;
  update public.projects set
    name = case when project_data ? 'name' then trim(project_data->>'name') else name end,
    project_number = case when project_data ? 'project_number' then nullif(trim(project_data->>'project_number'),'') else project_number end,
    project_type = case when project_data ? 'project_type' then nullif(project_data->>'project_type','') else project_type end,
    delivery_method = case when project_data ? 'delivery_method' then nullif(project_data->>'delivery_method','') else delivery_method end,
    description = case when project_data ? 'description' then nullif(trim(project_data->>'description'),'') else description end,
    address_line1 = case when project_data ? 'address_line1' then nullif(trim(project_data->>'address_line1'),'') else address_line1 end,
    address_line2 = case when project_data ? 'address_line2' then nullif(trim(project_data->>'address_line2'),'') else address_line2 end,
    city = case when project_data ? 'city' then nullif(trim(project_data->>'city'),'') else city end,
    region = case when project_data ? 'region' then nullif(trim(project_data->>'region'),'') else region end,
    postal_code = case when project_data ? 'postal_code' then nullif(trim(project_data->>'postal_code'),'') else postal_code end,
    country = case when project_data ? 'country' then upper(project_data->>'country') else country end,
    timezone = case when project_data ? 'timezone' then nullif(trim(project_data->>'timezone'),'') else timezone end,
    planned_start_date = case when project_data ? 'planned_start_date' then nullif(project_data->>'planned_start_date','')::date else planned_start_date end,
    substantial_completion_date = case when project_data ? 'substantial_completion_date' then nullif(project_data->>'substantial_completion_date','')::date else substantial_completion_date end,
    final_completion_date = case when project_data ? 'final_completion_date' then nullif(project_data->>'final_completion_date','')::date else final_completion_date end,
    closeout_target_date = case when project_data ? 'closeout_target_date' then nullif(project_data->>'closeout_target_date','')::date else closeout_target_date end,
    actual_completion_date = case when project_data ? 'actual_completion_date' then nullif(project_data->>'actual_completion_date','')::date else actual_completion_date end,
    tags = case when project_data ? 'tags' then array(select jsonb_array_elements_text(project_data->'tags')) else tags end,
    notes = case when project_data ? 'notes' then nullif(project_data->>'notes','') else notes end
  where id = target_project_id returning updated_at into next_updated_at;

  perform public.write_audit_event(
    'internal_user','project','project.updated',coalesce(request_id,gen_random_uuid()::text),'web',
    prior.organization_id,actor_id,target_project_id,target_project_id,null,null,null,null,null,
    jsonb_build_object('changed_fields',to_jsonb(changed_fields))
  );
  return next_updated_at;
exception
  when unique_violation then raise exception 'project number is already in use' using errcode = '23505';
end;
$$;

create or replace function public.set_project_status(
  target_project_id uuid,
  target_status text,
  reason text default null,
  request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.projects;
  allowed boolean := false;
begin
  select * into prior from public.projects where id = target_project_id for update;
  if not found or not public.project_permission(target_project_id, 'project.update') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if target_status = 'archived' then raise exception 'use archive_project' using errcode = '22023'; end if;
  allowed := case prior.status
    when 'draft' then target_status in ('active','cancelled')
    when 'active' then target_status in ('closeout_in_progress','cancelled')
    when 'closeout_in_progress' then target_status in ('owner_review','cancelled')
    when 'owner_review' then target_status in ('closeout_in_progress','published','cancelled')
    when 'published' then target_status in ('owner_review','complete')
    else false
  end;
  if not allowed then raise exception 'invalid project status transition' using errcode = '22023'; end if;
  if target_status = 'cancelled' and length(trim(coalesce(reason,''))) < 3 then
    raise exception 'cancellation reason is required' using errcode = '22023';
  end if;
  update public.projects set status = target_status where id = target_project_id;
  perform public.write_audit_event(
    'internal_user','project','project.status_changed',coalesce(request_id,gen_random_uuid()::text),'web',
    prior.organization_id,actor_id,target_project_id,target_project_id,
    jsonb_build_object('status',prior.status),jsonb_build_object('status',target_status),null,null,null,
    jsonb_strip_nulls(jsonb_build_object('from',prior.status,'to',target_status,'reason',nullif(trim(reason),'')))
  );
end;
$$;

create or replace function public.archive_project(target_project_id uuid, reason text default null, request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); prior public.projects;
begin
  select * into prior from public.projects where id=target_project_id for update;
  if not found or not public.project_permission(target_project_id,'project.archive') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='archived' then return; end if;
  update public.projects set status='archived',archived_at=now(),archived_by=actor_id,archive_reason=nullif(trim(reason),'') where id=target_project_id;
  perform public.write_audit_event('internal_user','project','project.archived',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,target_project_id,target_project_id,null,null,null,null,null,jsonb_strip_nulls(jsonb_build_object('reason',nullif(trim(reason),''))));
end; $$;

create or replace function public.restore_project(target_project_id uuid, request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); prior public.projects;
begin
  select * into prior from public.projects where id=target_project_id for update;
  if not found or prior.status<>'archived' or not public.project_permission(target_project_id,'project.restore') then raise exception 'permission denied' using errcode='42501'; end if;
  update public.projects set status='active',archived_at=null,archived_by=null,archive_reason=null where id=target_project_id;
  perform public.write_audit_event('internal_user','project','project.restored',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,target_project_id,target_project_id);
end; $$;

create or replace function public.assign_project_member(target_project_id uuid,target_membership_id uuid,target_project_role text,request_id text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); project public.projects; membership public.organization_memberships; assignment_id uuid;
begin
  select * into project from public.projects where id=target_project_id;
  if not found or project.status='archived' or not public.project_permission(target_project_id,'project.manage_team') then raise exception 'permission denied' using errcode='42501'; end if;
  select * into membership from public.organization_memberships where id=target_membership_id and organization_id=project.organization_id and status='active';
  if not found then raise exception 'active organization member required' using errcode='22023'; end if;
  if target_project_role not in ('project_administrator','project_manager','closeout_coordinator','internal_reviewer','viewer') then raise exception 'invalid project role' using errcode='22023'; end if;
  insert into public.project_members(organization_id,project_id,membership_id,project_role,assigned_by)
  values(project.organization_id,target_project_id,target_membership_id,target_project_role,actor_id)
  on conflict(project_id,membership_id) do update set project_role=excluded.project_role,status='active',removed_at=null,assigned_by=actor_id,assigned_at=now()
  returning id into assignment_id;
  perform public.write_audit_event('internal_user','project_member','project.member_assigned',coalesce(request_id,gen_random_uuid()::text),'web',project.organization_id,actor_id,target_project_id,assignment_id,null,null,null,null,null,jsonb_build_object('member_user_id',membership.user_id,'project_role',target_project_role));
  return assignment_id;
end; $$;

create or replace function public.change_project_member_role(target_project_member_id uuid,target_project_role text,request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); prior public.project_members; member_user_id uuid;
begin
  select * into prior from public.project_members where id=target_project_member_id for update;
  if not found or prior.status<>'active' or not public.project_permission(prior.project_id,'project.manage_team') then raise exception 'permission denied' using errcode='42501'; end if;
  if target_project_role not in ('project_administrator','project_manager','closeout_coordinator','internal_reviewer','viewer') then raise exception 'invalid project role' using errcode='22023'; end if;
  select user_id into member_user_id from public.organization_memberships where id=prior.membership_id;
  update public.project_members set project_role=target_project_role where id=prior.id;
  perform public.write_audit_event('internal_user','project_member','project.member_role_changed',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,prior.project_id,prior.id,jsonb_build_object('project_role',prior.project_role),jsonb_build_object('project_role',target_project_role),null,null,null,jsonb_build_object('member_user_id',member_user_id,'from_role',prior.project_role,'to_role',target_project_role));
end; $$;

create or replace function public.remove_project_member(target_project_member_id uuid,request_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_id uuid:=auth.uid(); prior public.project_members; member_user_id uuid;
begin
  select * into prior from public.project_members where id=target_project_member_id for update;
  if not found or not public.project_permission(prior.project_id,'project.manage_team') then raise exception 'permission denied' using errcode='42501'; end if;
  if prior.status='removed' then return; end if;
  select user_id into member_user_id from public.organization_memberships where id=prior.membership_id;
  update public.project_members set status='removed',removed_at=now() where id=prior.id;
  perform public.write_audit_event('internal_user','project_member','project.member_removed',coalesce(request_id,gen_random_uuid()::text),'web',prior.organization_id,actor_id,prior.project_id,prior.id,null,null,null,null,null,jsonb_build_object('member_user_id',member_user_id));
end; $$;

do $$ declare signature text; begin
  foreach signature in array array[
    'public.create_project(uuid,text,text,text,text)',
    'public.update_project(uuid,timestamptz,jsonb,text)',
    'public.set_project_status(uuid,text,text,text)',
    'public.archive_project(uuid,text,text)',
    'public.restore_project(uuid,text)',
    'public.assign_project_member(uuid,uuid,text,text)',
    'public.change_project_member_role(uuid,text,text)',
    'public.remove_project_member(uuid,text)'
  ] loop
    execute 'revoke all on function '||signature||' from public, anon';
    execute 'grant execute on function '||signature||' to authenticated';
  end loop;
end $$;

-- Phase 6 project requirement instances: configuration snapshots with derived
-- assignment indicators, honest lifecycle, soft archival, and audited mutations.

create table public.project_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  notes text,
  category_id uuid not null references public.requirement_categories(id) on delete restrict,
  trade text,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  is_required boolean not null default true,
  record_type text,
  status text not null default 'active' check (status in ('active','not_applicable_approved')),
  na_reason text check (char_length(trim(na_reason)) between 3 and 200),
  responsible_project_company_id uuid references public.project_companies(id) on delete restrict,
  responsible_project_contact_id uuid references public.project_contacts(id) on delete restrict,
  internal_owner_member_id uuid references public.project_members(id) on delete restrict,
  due_date date check (due_date is null or due_date between date '1990-01-01' and date '2100-12-31'),
  source_template_id uuid references public.requirement_templates(id) on delete restrict,
  source_item_key text,
  sort_order integer not null default 0,
  normalized_title text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  archived_by uuid references auth.users(id) on delete restrict,
  archive_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  check ((status = 'not_applicable_approved') = (na_reason is not null)),
  check ((source_template_id is null) = (source_item_key is null))
);

create unique index project_requirements_source_key_unique
on public.project_requirements (project_id, source_item_key)
where source_item_key is not null and archived_at is null;
create index project_requirements_register_idx
on public.project_requirements (project_id, archived_at, category_id, sort_order, id);
create index project_requirements_project_status_idx on public.project_requirements (project_id, status);
create index project_requirements_project_due_idx on public.project_requirements (project_id, due_date);
create index project_requirements_company_idx on public.project_requirements (project_id, responsible_project_company_id);
create index project_requirements_title_trgm_idx
on public.project_requirements using gin (normalized_title extensions.gin_trgm_ops);
create index project_requirements_org_idx on public.project_requirements (organization_id);

create trigger project_requirements_set_updated_at before update on public.project_requirements
for each row execute function public.set_updated_at();

-- Invariant guard: organization/project consistency for category and responsibility references.
create or replace function public.project_requirements_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  project_org uuid;
  category_org uuid;
  reference_project uuid;
begin
  select organization_id into project_org from public.projects where id = new.project_id;
  if project_org is null or new.organization_id <> project_org then
    raise exception 'requirement organization mismatch' using errcode = '22023';
  end if;
  select organization_id into category_org from public.requirement_categories where id = new.category_id;
  if category_org is null or category_org <> project_org then
    raise exception 'requirement category mismatch' using errcode = '22023';
  end if;
  if new.responsible_project_company_id is not null then
    select project_id into reference_project from public.project_companies where id = new.responsible_project_company_id;
    if reference_project is null or reference_project <> new.project_id then
      raise exception 'responsible company must belong to this project' using errcode = '22023';
    end if;
  end if;
  if new.responsible_project_contact_id is not null then
    select project_id into reference_project from public.project_contacts where id = new.responsible_project_contact_id;
    if reference_project is null or reference_project <> new.project_id then
      raise exception 'responsible contact must belong to this project' using errcode = '22023';
    end if;
  end if;
  if new.internal_owner_member_id is not null then
    select project_id into reference_project from public.project_members where id = new.internal_owner_member_id;
    if reference_project is null or reference_project <> new.project_id then
      raise exception 'internal owner must belong to this project' using errcode = '22023';
    end if;
  end if;
  if new.source_template_id is not null then
    select organization_id into reference_project from public.requirement_templates where id = new.source_template_id;
    if reference_project is null or reference_project <> project_org then
      raise exception 'source template mismatch' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;

create trigger project_requirements_guard
before insert or update on public.project_requirements
for each row execute function public.project_requirements_guard();

alter table public.project_requirements enable row level security;
alter table public.project_requirements force row level security;

create policy project_requirements_select_accessible on public.project_requirements
for select to authenticated
using (public.can_access_project(project_id));

revoke all on public.project_requirements from public, anon, authenticated;
grant select on public.project_requirements to authenticated;
grant all on public.project_requirements to service_role;

-- Shared assignment-time validation for responsibility references (active-state checks).
create or replace function public.assert_requirement_responsibility(
  target_project_id uuid,
  company_reference uuid,
  contact_reference uuid,
  member_reference uuid
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if company_reference is not null and not exists (
    select 1 from public.project_companies relation
    join public.companies company on company.id = relation.company_id
    where relation.id = company_reference
      and relation.project_id = target_project_id
      and relation.status = 'active'
      and company.status = 'active'
  ) then
    raise exception 'responsible company must be active on this project' using errcode = '22023';
  end if;
  if contact_reference is not null and not exists (
    select 1 from public.project_contacts relation
    join public.contacts contact on contact.id = relation.contact_id
    where relation.id = contact_reference
      and relation.project_id = target_project_id
      and relation.status = 'active'
      and contact.status = 'active'
  ) then
    raise exception 'responsible contact must be active on this project' using errcode = '22023';
  end if;
  if member_reference is not null and not exists (
    select 1 from public.project_members assignment
    join public.organization_memberships membership on membership.id = assignment.membership_id
    where assignment.id = member_reference
      and assignment.project_id = target_project_id
      and assignment.status = 'active'
      and membership.status = 'active'
  ) then
    raise exception 'internal owner must be an active project member' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.create_project_requirement(
  target_project_id uuid,
  requirement_data jsonb,
  request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  project public.projects;
  resolved_category_id uuid;
  next_sort integer;
  new_requirement_id uuid;
  requirement_title text := trim(coalesce(requirement_data->>'title', ''));
begin
  select * into project from public.projects where id = target_project_id;
  if not found or not public.project_permission(target_project_id, 'requirement.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if project.status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if char_length(requirement_title) not between 2 and 200 then
    raise exception 'requirement title must be between 2 and 200 characters' using errcode = '22023';
  end if;
  if requirement_data - array[
    'title','description','notes','category_id','trade','priority','is_required',
    'responsible_project_company_id','responsible_project_contact_id','internal_owner_member_id','due_date'
  ] <> '{}'::jsonb then
    raise exception 'unsupported requirement field' using errcode = '22023';
  end if;

  resolved_category_id := nullif(requirement_data->>'category_id','')::uuid;
  if resolved_category_id is null then
    select id into resolved_category_id from public.requirement_categories
    where organization_id = project.organization_id and archived_at is null
    order by case when lower(name) = 'general' then 0 else 1 end, sort_order
    limit 1;
  elsif not exists (
    select 1 from public.requirement_categories
    where id = resolved_category_id and organization_id = project.organization_id and archived_at is null
  ) then
    raise exception 'requirement category is unavailable' using errcode = '22023';
  end if;
  if resolved_category_id is null then
    raise exception 'create a requirement category first' using errcode = '22023';
  end if;

  perform public.assert_requirement_responsibility(
    target_project_id,
    nullif(requirement_data->>'responsible_project_company_id','')::uuid,
    nullif(requirement_data->>'responsible_project_contact_id','')::uuid,
    nullif(requirement_data->>'internal_owner_member_id','')::uuid
  );

  select coalesce(max(sort_order), 0) + 10 into next_sort
  from public.project_requirements
  where project_id = target_project_id and category_id = resolved_category_id;

  insert into public.project_requirements (
    organization_id, project_id, title, description, notes, category_id, trade, priority, is_required,
    responsible_project_company_id, responsible_project_contact_id, internal_owner_member_id,
    due_date, sort_order, normalized_title, created_by
  ) values (
    project.organization_id, target_project_id, requirement_title,
    nullif(trim(coalesce(requirement_data->>'description','')),''),
    nullif(trim(coalesce(requirement_data->>'notes','')),''),
    resolved_category_id,
    nullif(trim(coalesce(requirement_data->>'trade','')),''),
    coalesce(nullif(requirement_data->>'priority',''), 'normal'),
    coalesce((requirement_data->>'is_required')::boolean, true),
    nullif(requirement_data->>'responsible_project_company_id','')::uuid,
    nullif(requirement_data->>'responsible_project_contact_id','')::uuid,
    nullif(requirement_data->>'internal_owner_member_id','')::uuid,
    nullif(requirement_data->>'due_date','')::date,
    next_sort,
    public.normalize_directory_text(requirement_title),
    actor_id
  ) returning id into new_requirement_id;

  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.created',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    project.organization_id, actor_id, target_project_id, new_requirement_id,
    null, null, null, null, null,
    jsonb_build_object('title', left(requirement_title, 80))
  );
  return new_requirement_id;
end;
$$;

create or replace function public.update_project_requirement(
  target_requirement_id uuid,
  expected_updated_at timestamptz,
  requirement_data jsonb,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.project_requirements;
  project_status text;
  next_updated_at timestamptz;
  general_fields text[];
  responsibility_changed boolean := false;
  due_date_changed boolean := false;
  request_key text := coalesce(request_id, gen_random_uuid()::text);
  next_company uuid;
  next_contact uuid;
  next_member uuid;
  next_due date;
  company_label text;
begin
  select * into prior from public.project_requirements where id = target_requirement_id for update;
  if not found or not public.project_permission(prior.project_id, 'requirement.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  select status into project_status from public.projects where id = prior.project_id;
  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is not null then
    raise exception 'restore this requirement before editing it' using errcode = '22023';
  end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'requirement was updated by another user' using errcode = 'P0001';
  end if;
  if requirement_data - array[
    'title','description','notes','category_id','trade','priority','is_required',
    'responsible_project_company_id','responsible_project_contact_id','internal_owner_member_id','due_date'
  ] <> '{}'::jsonb then
    raise exception 'unsupported requirement field' using errcode = '22023';
  end if;

  -- Resolve permission groups: general edits, responsibility, due dates.
  select coalesce(array_agg(key order by key), '{}') into general_fields
  from jsonb_object_keys(requirement_data) key
  where key not in ('responsible_project_company_id','responsible_project_contact_id','internal_owner_member_id','due_date');

  if array_length(general_fields, 1) is not null
     and not public.project_permission(prior.project_id, 'requirement.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  next_company := case when requirement_data ? 'responsible_project_company_id'
    then nullif(requirement_data->>'responsible_project_company_id','')::uuid
    else prior.responsible_project_company_id end;
  next_contact := case when requirement_data ? 'responsible_project_contact_id'
    then nullif(requirement_data->>'responsible_project_contact_id','')::uuid
    else prior.responsible_project_contact_id end;
  next_member := case when requirement_data ? 'internal_owner_member_id'
    then nullif(requirement_data->>'internal_owner_member_id','')::uuid
    else prior.internal_owner_member_id end;
  next_due := case when requirement_data ? 'due_date'
    then nullif(requirement_data->>'due_date','')::date
    else prior.due_date end;

  responsibility_changed :=
    next_company is distinct from prior.responsible_project_company_id
    or next_contact is distinct from prior.responsible_project_contact_id
    or next_member is distinct from prior.internal_owner_member_id;
  due_date_changed := next_due is distinct from prior.due_date;

  if responsibility_changed and not public.project_permission(prior.project_id, 'requirement.assign') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if due_date_changed and not public.project_permission(prior.project_id, 'requirement.set_dates') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if requirement_data ? 'title' and char_length(trim(coalesce(requirement_data->>'title',''))) not between 2 and 200 then
    raise exception 'requirement title must be between 2 and 200 characters' using errcode = '22023';
  end if;
  if requirement_data ? 'category_id' and not exists (
    select 1 from public.requirement_categories
    where id = nullif(requirement_data->>'category_id','')::uuid
      and organization_id = prior.organization_id
      and archived_at is null
  ) then
    raise exception 'requirement category is unavailable' using errcode = '22023';
  end if;

  -- Only validate references that are being newly set (stale existing pointers stay visible).
  perform public.assert_requirement_responsibility(
    prior.project_id,
    case when next_company is distinct from prior.responsible_project_company_id then next_company end,
    case when next_contact is distinct from prior.responsible_project_contact_id then next_contact end,
    case when next_member is distinct from prior.internal_owner_member_id then next_member end
  );

  update public.project_requirements set
    title = case when requirement_data ? 'title' then trim(requirement_data->>'title') else title end,
    normalized_title = case when requirement_data ? 'title' then public.normalize_directory_text(requirement_data->>'title') else normalized_title end,
    description = case when requirement_data ? 'description' then nullif(trim(coalesce(requirement_data->>'description','')),'') else description end,
    notes = case when requirement_data ? 'notes' then nullif(trim(coalesce(requirement_data->>'notes','')),'') else notes end,
    category_id = case when requirement_data ? 'category_id' then (requirement_data->>'category_id')::uuid else category_id end,
    trade = case when requirement_data ? 'trade' then nullif(trim(coalesce(requirement_data->>'trade','')),'') else trade end,
    priority = case when requirement_data ? 'priority' then coalesce(nullif(requirement_data->>'priority',''), 'normal') else priority end,
    is_required = case when requirement_data ? 'is_required' then coalesce((requirement_data->>'is_required')::boolean, true) else is_required end,
    responsible_project_company_id = next_company,
    responsible_project_contact_id = next_contact,
    internal_owner_member_id = next_member,
    due_date = next_due
  where id = target_requirement_id
  returning updated_at into next_updated_at;

  if responsibility_changed then
    select company.display_name into company_label
    from public.project_companies relation
    join public.companies company on company.id = relation.company_id
    where relation.id = next_company;
    perform public.write_audit_event(
      'internal_user', 'requirement', 'requirement.responsibility_changed', request_key, 'web',
      prior.organization_id, actor_id, prior.project_id, target_requirement_id,
      jsonb_strip_nulls(jsonb_build_object(
        'company', prior.responsible_project_company_id,
        'contact', prior.responsible_project_contact_id,
        'owner', prior.internal_owner_member_id
      )),
      jsonb_strip_nulls(jsonb_build_object('company', next_company, 'contact', next_contact, 'owner', next_member)),
      null, null, null,
      jsonb_strip_nulls(jsonb_build_object('title', left(prior.title, 80), 'company_name', company_label))
    );
  end if;
  if due_date_changed then
    perform public.write_audit_event(
      'internal_user', 'requirement', 'requirement.due_date_changed', request_key, 'web',
      prior.organization_id, actor_id, prior.project_id, target_requirement_id,
      jsonb_build_object('due_date', prior.due_date),
      jsonb_build_object('due_date', next_due),
      null, null, null,
      jsonb_strip_nulls(jsonb_build_object('title', left(prior.title, 80), 'from', prior.due_date, 'to', next_due))
    );
  end if;
  if array_length(general_fields, 1) is not null then
    perform public.write_audit_event(
      'internal_user', 'requirement', 'requirement.updated', request_key, 'web',
      prior.organization_id, actor_id, prior.project_id, target_requirement_id,
      null, null, null, null, null,
      jsonb_build_object('changed_fields', to_jsonb(general_fields))
    );
  end if;
  return next_updated_at;
end;
$$;

create or replace function public.mark_requirement_not_applicable(
  target_requirement_id uuid,
  expected_updated_at timestamptz,
  reason text,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.project_requirements;
  project_status text;
  next_updated_at timestamptz;
begin
  select * into prior from public.project_requirements where id = target_requirement_id for update;
  if not found or not public.project_permission(prior.project_id, 'requirement.set_not_applicable') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  select status into project_status from public.projects where id = prior.project_id;
  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is not null then
    raise exception 'restore this requirement first' using errcode = '22023';
  end if;
  if prior.status = 'not_applicable_approved' then return prior.updated_at; end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'requirement was updated by another user' using errcode = 'P0001';
  end if;
  if char_length(trim(coalesce(reason,''))) not between 3 and 200 then
    raise exception 'a reason between 3 and 200 characters is required' using errcode = '22023';
  end if;

  update public.project_requirements
  set status = 'not_applicable_approved', na_reason = trim(reason)
  where id = target_requirement_id
  returning updated_at into next_updated_at;

  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.marked_not_applicable',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, prior.project_id, target_requirement_id,
    jsonb_build_object('status', prior.status),
    jsonb_build_object('status', 'not_applicable_approved'),
    null, null, null,
    jsonb_build_object('title', left(prior.title, 80), 'reason_label', left(trim(reason), 80))
  );
  return next_updated_at;
end;
$$;

create or replace function public.reverse_requirement_not_applicable(
  target_requirement_id uuid,
  expected_updated_at timestamptz,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.project_requirements;
  project_status text;
  next_updated_at timestamptz;
begin
  select * into prior from public.project_requirements where id = target_requirement_id for update;
  if not found or not public.project_permission(prior.project_id, 'requirement.set_not_applicable') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  select status into project_status from public.projects where id = prior.project_id;
  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is not null then
    raise exception 'restore this requirement first' using errcode = '22023';
  end if;
  if prior.status <> 'not_applicable_approved' then return prior.updated_at; end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'requirement was updated by another user' using errcode = 'P0001';
  end if;

  update public.project_requirements
  set status = 'active', na_reason = null
  where id = target_requirement_id
  returning updated_at into next_updated_at;

  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.not_applicable_reversed',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, prior.project_id, target_requirement_id,
    jsonb_build_object('status', prior.status),
    jsonb_build_object('status', 'active'),
    null, null, null,
    jsonb_build_object('title', left(prior.title, 80))
  );
  return next_updated_at;
end;
$$;

create or replace function public.archive_project_requirement(
  target_requirement_id uuid,
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
  prior public.project_requirements;
  project_status text;
begin
  select * into prior from public.project_requirements where id = target_requirement_id for update;
  if not found or not public.project_permission(prior.project_id, 'requirement.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  select status into project_status from public.projects where id = prior.project_id;
  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is not null then return; end if;
  update public.project_requirements
  set archived_at = now(), archived_by = actor_id, archive_reason = nullif(trim(coalesce(reason,'')),'')
  where id = target_requirement_id;
  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.archived',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, prior.project_id, target_requirement_id,
    null, null, null, null, null,
    jsonb_strip_nulls(jsonb_build_object('title', left(prior.title, 80), 'reason', nullif(trim(coalesce(reason,'')),'')))
  );
end;
$$;

create or replace function public.restore_project_requirement(
  target_requirement_id uuid,
  request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.project_requirements;
  project_status text;
begin
  select * into prior from public.project_requirements where id = target_requirement_id for update;
  if not found or not public.project_permission(prior.project_id, 'requirement.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  select status into project_status from public.projects where id = prior.project_id;
  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is null then return; end if;
  update public.project_requirements
  set archived_at = null, archived_by = null, archive_reason = null
  where id = target_requirement_id;
  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.restored',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, prior.project_id, target_requirement_id,
    null, null, null, null, null,
    jsonb_build_object('title', left(prior.title, 80))
  );
exception
  when unique_violation then
    raise exception 'an active requirement from the same template item already exists' using errcode = '23505';
end;
$$;

create or replace function public.reorder_project_requirements(
  target_project_id uuid,
  target_category_id uuid,
  ordered_requirement_ids uuid[],
  request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  project public.projects;
  owned_count integer;
begin
  select * into project from public.projects where id = target_project_id;
  if not found or not public.project_permission(target_project_id, 'requirement.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if project.status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if coalesce(array_length(ordered_requirement_ids, 1), 0) < 1
     or coalesce(array_length(ordered_requirement_ids, 1), 0) > 200 then
    raise exception 'invalid requirement selection' using errcode = '22023';
  end if;
  select count(*) into owned_count from public.project_requirements
  where project_id = target_project_id and category_id = target_category_id
    and id = any(ordered_requirement_ids) and archived_at is null;
  if owned_count <> array_length(ordered_requirement_ids, 1) then
    raise exception 'invalid requirement selection' using errcode = '22023';
  end if;

  update public.project_requirements requirement
  set sort_order = ordering.position * 10
  from unnest(ordered_requirement_ids) with ordinality as ordering(requirement_id, position)
  where requirement.id = ordering.requirement_id
    and requirement.project_id = target_project_id;

  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.reordered',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    project.organization_id, actor_id, target_project_id, null,
    null, null, null, null, null,
    jsonb_build_object('moved_count', owned_count, 'category_id', target_category_id)
  );
end;
$$;

do $$ declare signature text; begin
  foreach signature in array array[
    'public.create_project_requirement(uuid,jsonb,text)',
    'public.update_project_requirement(uuid,timestamptz,jsonb,text)',
    'public.mark_requirement_not_applicable(uuid,timestamptz,text,text)',
    'public.reverse_requirement_not_applicable(uuid,timestamptz,text)',
    'public.archive_project_requirement(uuid,text,text)',
    'public.restore_project_requirement(uuid,text)',
    'public.reorder_project_requirements(uuid,uuid,uuid[],text)'
  ] loop
    execute 'revoke all on function '||signature||' from public, anon';
    execute 'grant execute on function '||signature||' to authenticated';
  end loop;
  execute 'revoke all on function public.assert_requirement_responsibility(uuid,uuid,uuid,uuid) from public, anon, authenticated';
  execute 'grant execute on function public.assert_requirement_responsibility(uuid,uuid,uuid,uuid) to service_role';
end $$;

comment on table public.project_requirements is
  'Project closeout requirement instances (configuration snapshots). Stored lifecycle is active/not_applicable_approved; assignment completeness is derived from responsibility columns; archived_at is independent soft archival.';

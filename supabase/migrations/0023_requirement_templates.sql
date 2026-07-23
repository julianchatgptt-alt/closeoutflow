-- Phase 6 reusable requirement templates: row-per-version model, draft editing,
-- published immutability, cloning, family archival, preview, and starter content.

create table public.requirement_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  family_id uuid not null,
  version integer not null default 1 check (version >= 1),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_starter boolean not null default false,
  source_template_id uuid references public.requirement_templates(id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  archived_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, family_id, version)
);

create index requirement_templates_org_status_idx on public.requirement_templates (organization_id, status);
create index requirement_templates_family_idx on public.requirement_templates (organization_id, family_id, version desc);
create index requirement_templates_name_trgm_idx on public.requirement_templates using gin (lower(name) extensions.gin_trgm_ops);

create table public.requirement_template_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.requirement_templates(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 3 and 80),
  title text not null check (char_length(trim(title)) between 2 and 200),
  description text,
  category_id uuid not null references public.requirement_categories(id) on delete restrict,
  trade text,
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  is_optional boolean not null default false,
  default_responsible_role text check (
    default_responsible_role is null or default_responsible_role in (
      'owner','general_contractor','subcontractor','architect','engineer','consultant',
      'supplier','manufacturer','commissioning_agent','testing_agency','other'
    )
  ),
  default_due_anchor text check (default_due_anchor is null or default_due_anchor in ('substantial_completion','closeout_target')),
  default_due_offset_days integer check (
    default_due_offset_days is null or default_due_offset_days between -365 and 730
  ),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, item_key),
  check (default_due_offset_days is null or default_due_anchor is not null)
);

create index requirement_template_items_template_sort_idx
on public.requirement_template_items (template_id, sort_order, id);
create index requirement_template_items_org_idx on public.requirement_template_items (organization_id);

create trigger requirement_templates_set_updated_at before update on public.requirement_templates
for each row execute function public.set_updated_at();
create trigger requirement_template_items_set_updated_at before update on public.requirement_template_items
for each row execute function public.set_updated_at();

-- Invariant triggers only: keep item organization/category consistent with the template.
create or replace function public.requirement_template_items_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  template_org uuid;
  category_org uuid;
begin
  select organization_id into template_org from public.requirement_templates where id = new.template_id;
  if template_org is null or new.organization_id <> template_org then
    raise exception 'template item organization mismatch' using errcode = '22023';
  end if;
  select organization_id into category_org from public.requirement_categories where id = new.category_id;
  if category_org is null or category_org <> template_org then
    raise exception 'template item category mismatch' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger requirement_template_items_guard
before insert or update on public.requirement_template_items
for each row execute function public.requirement_template_items_guard();

alter table public.requirement_templates enable row level security;
alter table public.requirement_templates force row level security;
alter table public.requirement_template_items enable row level security;
alter table public.requirement_template_items force row level security;

create policy requirement_templates_select_viewers on public.requirement_templates
for select to authenticated
using (public.has_org_permission(organization_id, 'template.view'));

create policy requirement_template_items_select_viewers on public.requirement_template_items
for select to authenticated
using (public.has_org_permission(organization_id, 'template.view'));

revoke all on public.requirement_templates, public.requirement_template_items from public, anon, authenticated;
grant select on public.requirement_templates, public.requirement_template_items to authenticated;
grant all on public.requirement_templates, public.requirement_template_items to service_role;

create or replace function public.generate_requirement_item_key(item_title text)
returns text
language sql
volatile
set search_path = ''
as $$
  select left(
    trim(both '-' from regexp_replace(public.normalize_directory_text(item_title), '\s+', '-', 'g')),
    60
  ) || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
$$;

create or replace function public.create_requirement_template(
  target_organization_id uuid,
  template_name text,
  template_description text default null,
  request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  new_template_id uuid := gen_random_uuid();
begin
  if actor_id is null or not public.has_org_permission(target_organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(template_name, ''))) not between 2 and 120 then
    raise exception 'template name must be between 2 and 120 characters' using errcode = '22023';
  end if;

  insert into public.requirement_templates (id, organization_id, family_id, version, name, description, created_by, updated_by)
  values (new_template_id, target_organization_id, new_template_id, 1, trim(template_name), nullif(trim(template_description), ''), actor_id, actor_id);

  perform public.write_audit_event(
    'internal_user', 'template', 'template.created',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    target_organization_id, actor_id, null, new_template_id,
    null, null, null, null, null,
    jsonb_build_object('name', trim(template_name), 'family_id', new_template_id, 'version', 1)
  );
  return new_template_id;
end;
$$;

create or replace function public.update_requirement_template(
  target_template_id uuid,
  expected_updated_at timestamptz,
  template_data jsonb,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_templates;
  next_updated_at timestamptz;
  changed_fields text[];
begin
  select * into prior from public.requirement_templates where id = target_template_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.status <> 'draft' then
    raise exception 'published template versions cannot be edited' using errcode = '22023';
  end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'template was updated by another user' using errcode = 'P0001';
  end if;
  if template_data - array['name','description'] <> '{}'::jsonb then
    raise exception 'unsupported template field' using errcode = '22023';
  end if;
  if template_data ? 'name' and char_length(trim(coalesce(template_data->>'name',''))) not between 2 and 120 then
    raise exception 'template name must be between 2 and 120 characters' using errcode = '22023';
  end if;

  select coalesce(array_agg(key order by key), '{}') into changed_fields from jsonb_object_keys(template_data) key;
  update public.requirement_templates set
    name = case when template_data ? 'name' then trim(template_data->>'name') else name end,
    description = case when template_data ? 'description' then nullif(trim(template_data->>'description'),'') else description end,
    updated_by = actor_id
  where id = target_template_id
  returning updated_at into next_updated_at;

  perform public.write_audit_event(
    'internal_user', 'template', 'template.updated',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, target_template_id,
    null, null, null, null, null,
    jsonb_build_object('changed_fields', to_jsonb(changed_fields))
  );
  return next_updated_at;
end;
$$;

-- Draft-only batched item reconciliation: the payload is the complete ordered item set.
create or replace function public.save_template_items(
  target_template_id uuid,
  expected_updated_at timestamptz,
  items jsonb,
  request_id text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_templates;
  next_updated_at timestamptz;
  entry jsonb;
  entry_id uuid;
  position integer := 0;
  kept_ids uuid[] := array[]::uuid[];
  added_count integer := 0;
  updated_count integer := 0;
  removed_count integer := 0;
begin
  select * into prior from public.requirement_templates where id = target_template_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.status <> 'draft' then
    raise exception 'published template versions cannot be edited' using errcode = '22023';
  end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'template was updated by another user' using errcode = 'P0001';
  end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 500 then
    raise exception 'invalid template item payload' using errcode = '22023';
  end if;

  for entry in select * from jsonb_array_elements(items) loop
    position := position + 10;
    if char_length(trim(coalesce(entry->>'title',''))) not between 2 and 200 then
      raise exception 'requirement title must be between 2 and 200 characters' using errcode = '22023';
    end if;
    entry_id := nullif(entry->>'id','')::uuid;
    if entry_id is not null then
      update public.requirement_template_items set
        title = trim(entry->>'title'),
        description = nullif(trim(coalesce(entry->>'description','')),''),
        category_id = (entry->>'category_id')::uuid,
        trade = nullif(trim(coalesce(entry->>'trade','')),''),
        priority = coalesce(nullif(entry->>'priority',''), 'normal'),
        is_optional = coalesce((entry->>'is_optional')::boolean, false),
        default_responsible_role = nullif(entry->>'default_responsible_role',''),
        default_due_anchor = nullif(entry->>'default_due_anchor',''),
        default_due_offset_days = nullif(entry->>'default_due_offset_days','')::integer,
        sort_order = position
      where id = entry_id and template_id = target_template_id;
      if not found then
        raise exception 'invalid template item reference' using errcode = '22023';
      end if;
      updated_count := updated_count + 1;
      kept_ids := kept_ids || entry_id;
    else
      insert into public.requirement_template_items (
        organization_id, template_id, item_key, title, description, category_id, trade,
        priority, is_optional, default_responsible_role, default_due_anchor, default_due_offset_days, sort_order
      ) values (
        prior.organization_id,
        target_template_id,
        public.generate_requirement_item_key(entry->>'title'),
        trim(entry->>'title'),
        nullif(trim(coalesce(entry->>'description','')),''),
        (entry->>'category_id')::uuid,
        nullif(trim(coalesce(entry->>'trade','')),''),
        coalesce(nullif(entry->>'priority',''), 'normal'),
        coalesce((entry->>'is_optional')::boolean, false),
        nullif(entry->>'default_responsible_role',''),
        nullif(entry->>'default_due_anchor',''),
        nullif(entry->>'default_due_offset_days','')::integer,
        position
      ) returning id into entry_id;
      added_count := added_count + 1;
      kept_ids := kept_ids || entry_id;
    end if;
  end loop;

  delete from public.requirement_template_items
  where template_id = target_template_id and id <> all(kept_ids);
  get diagnostics removed_count = row_count;

  update public.requirement_templates set updated_by = actor_id where id = target_template_id
  returning updated_at into next_updated_at;

  perform public.write_audit_event(
    'internal_user', 'template', 'template.updated',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, target_template_id,
    null, null, null, null, null,
    jsonb_build_object('items_changed', jsonb_build_object(
      'added', added_count, 'updated', updated_count, 'removed', removed_count
    ))
  );
  return next_updated_at;
end;
$$;

create or replace function public.publish_requirement_template(
  target_template_id uuid,
  expected_updated_at timestamptz,
  request_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_templates;
  item_count integer;
begin
  select * into prior from public.requirement_templates where id = target_template_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.publish') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.status <> 'draft' then
    raise exception 'only draft versions can be published' using errcode = '22023';
  end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'template was updated by another user' using errcode = 'P0001';
  end if;
  select count(*) into item_count from public.requirement_template_items where template_id = target_template_id;
  if item_count = 0 then
    raise exception 'a template needs at least one requirement before publishing' using errcode = '22023';
  end if;

  update public.requirement_templates
  set status = 'published', published_at = now(), published_by = actor_id, updated_by = actor_id
  where id = target_template_id;

  perform public.write_audit_event(
    'internal_user', 'template', 'template.published',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, target_template_id,
    null, null, null, null, null,
    jsonb_build_object('version', prior.version, 'item_count', item_count, 'name', prior.name)
  );
end;
$$;

create or replace function public.create_template_version(
  target_template_id uuid,
  request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  source public.requirement_templates;
  next_version integer;
  new_template_id uuid := gen_random_uuid();
begin
  select * into source from public.requirement_templates where id = target_template_id;
  if not found or not public.has_org_permission(source.organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if source.status <> 'published' then
    raise exception 'new versions start from a published version' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.requirement_templates
    where family_id = source.family_id and organization_id = source.organization_id and status = 'draft'
  ) then
    raise exception 'a draft version of this template already exists' using errcode = '22023';
  end if;
  select max(version) + 1 into next_version
  from public.requirement_templates
  where family_id = source.family_id and organization_id = source.organization_id;

  insert into public.requirement_templates (
    id, organization_id, family_id, version, name, description, status, is_starter, source_template_id, created_by, updated_by
  ) values (
    new_template_id, source.organization_id, source.family_id, next_version,
    source.name, source.description, 'draft', source.is_starter, source.id, actor_id, actor_id
  );

  insert into public.requirement_template_items (
    organization_id, template_id, item_key, title, description, category_id, trade,
    priority, is_optional, default_responsible_role, default_due_anchor, default_due_offset_days, sort_order
  )
  select organization_id, new_template_id, item_key, title, description, category_id, trade,
    priority, is_optional, default_responsible_role, default_due_anchor, default_due_offset_days, sort_order
  from public.requirement_template_items where template_id = source.id;

  perform public.write_audit_event(
    'internal_user', 'template', 'template.version_created',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    source.organization_id, actor_id, null, new_template_id,
    null, null, null, null, null,
    jsonb_build_object('from_version', source.version, 'to_version', next_version, 'name', source.name)
  );
  return new_template_id;
end;
$$;

create or replace function public.clone_requirement_template(
  target_template_id uuid,
  new_template_name text,
  request_id text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  source public.requirement_templates;
  new_template_id uuid := gen_random_uuid();
begin
  select * into source from public.requirement_templates where id = target_template_id;
  if not found or not public.has_org_permission(source.organization_id, 'template.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if source.archived_at is not null then
    raise exception 'archived templates cannot be duplicated' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(new_template_name, ''))) not between 2 and 120 then
    raise exception 'template name must be between 2 and 120 characters' using errcode = '22023';
  end if;

  insert into public.requirement_templates (
    id, organization_id, family_id, version, name, description, status, source_template_id, created_by, updated_by
  ) values (
    new_template_id, source.organization_id, new_template_id, 1,
    trim(new_template_name), source.description, 'draft', source.id, actor_id, actor_id
  );

  -- Clones start a new family, so item keys are regenerated (keys stay family-scoped).
  insert into public.requirement_template_items (
    organization_id, template_id, item_key, title, description, category_id, trade,
    priority, is_optional, default_responsible_role, default_due_anchor, default_due_offset_days, sort_order
  )
  select organization_id, new_template_id, public.generate_requirement_item_key(title), title, description, category_id, trade,
    priority, is_optional, default_responsible_role, default_due_anchor, default_due_offset_days, sort_order
  from public.requirement_template_items where template_id = source.id;

  perform public.write_audit_event(
    'internal_user', 'template', 'template.cloned',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    source.organization_id, actor_id, null, new_template_id,
    null, null, null, null, null,
    jsonb_build_object('source_template_id', source.id, 'name', trim(new_template_name))
  );
  return new_template_id;
end;
$$;

create or replace function public.archive_requirement_template(target_template_id uuid, request_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_templates;
begin
  select * into prior from public.requirement_templates where id = target_template_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.archived_at is not null then return; end if;
  update public.requirement_templates
  set archived_at = now(), archived_by = actor_id, status = 'archived', updated_by = actor_id
  where family_id = prior.family_id and organization_id = prior.organization_id and archived_at is null;
  perform public.write_audit_event(
    'internal_user', 'template', 'template.archived',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, prior.id,
    null, null, null, null, null,
    jsonb_build_object('family_id', prior.family_id, 'name', prior.name)
  );
end;
$$;

create or replace function public.restore_requirement_template(target_template_id uuid, request_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior public.requirement_templates;
begin
  select * into prior from public.requirement_templates where id = target_template_id for update;
  if not found or not public.has_org_permission(prior.organization_id, 'template.archive') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if prior.archived_at is null then return; end if;
  -- Restore the family: published versions return to published, unpublished to draft.
  update public.requirement_templates
  set archived_at = null, archived_by = null,
      status = case when published_at is not null then 'published' else 'draft' end,
      updated_by = actor_id
  where family_id = prior.family_id and organization_id = prior.organization_id and archived_at is not null;
  perform public.write_audit_event(
    'internal_user', 'template', 'template.restored',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, null, prior.id,
    null, null, null, null, null,
    jsonb_build_object('family_id', prior.family_id, 'name', prior.name)
  );
end;
$$;

-- Preview a template's items, optionally against a project (duplicate detection).
create or replace function public.get_template_preview(
  target_template_id uuid,
  target_project_id uuid default null
)
returns table (
  item_id uuid,
  item_key text,
  title text,
  description text,
  category_id uuid,
  category_name text,
  trade text,
  priority text,
  is_optional boolean,
  default_responsible_role text,
  default_due_anchor text,
  default_due_offset_days integer,
  sort_order integer,
  already_in_project boolean,
  previously_removed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  template public.requirement_templates;
begin
  select * into template from public.requirement_templates where id = target_template_id;
  if not found or not public.has_org_permission(template.organization_id, 'template.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if target_project_id is not null and not public.can_access_project(target_project_id) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  return query
  select
    item.id, item.item_key, item.title, item.description, item.category_id, category.name,
    item.trade, item.priority, item.is_optional, item.default_responsible_role,
    item.default_due_anchor, item.default_due_offset_days, item.sort_order,
    (target_project_id is not null and exists (
      select 1 from public.project_requirements existing
      where existing.project_id = target_project_id
        and existing.source_item_key = item.item_key
        and existing.archived_at is null
    )),
    (target_project_id is not null and exists (
      select 1 from public.project_requirements removed
      where removed.project_id = target_project_id
        and removed.source_item_key = item.item_key
        and removed.archived_at is not null
    ))
  from public.requirement_template_items item
  join public.requirement_categories category on category.id = item.category_id
  where item.template_id = target_template_id
  order by category.sort_order, item.sort_order, item.id;
end;
$$;

-- Extend the idempotent defaults: categories (0022) plus one editable starter template.
-- Starter content is a general example only — users must verify every requirement
-- against their contract documents and project obligations. Not legal advice.
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
  starter_id uuid;
  starter_items jsonb := '[
    {"c":"O&M Manuals","t":"HVAC O&M Manual","r":"subcontractor","tr":"23 - HVAC"},
    {"c":"O&M Manuals","t":"Electrical O&M Manual","r":"subcontractor","tr":"26 - Electrical"},
    {"c":"O&M Manuals","t":"Plumbing O&M Manual","r":"subcontractor","tr":"22 - Plumbing"},
    {"c":"O&M Manuals","t":"Fire Protection O&M Manual","r":"subcontractor","tr":"21 - Fire Suppression"},
    {"c":"O&M Manuals","t":"Fire Alarm O&M Manual","r":"subcontractor","tr":"28 - Electronic Safety"},
    {"c":"O&M Manuals","t":"Roofing O&M Manual","r":"subcontractor","tr":"07 - Thermal & Moisture","o":true},
    {"c":"O&M Manuals","t":"Elevator & Conveying O&M Manual","r":"subcontractor","tr":"14 - Conveying","o":true},
    {"c":"O&M Manuals","t":"Kitchen Equipment O&M Manual","r":"supplier","tr":"11 - Equipment","o":true},
    {"c":"Warranties","t":"General Contractor Warranty Letter","r":"general_contractor"},
    {"c":"Warranties","t":"Roofing Warranty","r":"subcontractor","tr":"07 - Thermal & Moisture"},
    {"c":"Warranties","t":"HVAC Equipment Warranties","r":"subcontractor","tr":"23 - HVAC"},
    {"c":"Warranties","t":"Electrical Equipment Warranties","r":"subcontractor","tr":"26 - Electrical"},
    {"c":"Warranties","t":"Plumbing Fixture & Equipment Warranties","r":"subcontractor","tr":"22 - Plumbing"},
    {"c":"Warranties","t":"Overhead Door Warranty","r":"subcontractor","tr":"08 - Openings","o":true},
    {"c":"Warranties","t":"Flooring Warranty","r":"subcontractor","tr":"09 - Finishes","o":true},
    {"c":"As-Built Drawings","t":"Architectural As-Built Drawings","r":"general_contractor"},
    {"c":"As-Built Drawings","t":"Mechanical As-Built Drawings","r":"subcontractor","tr":"23 - HVAC"},
    {"c":"As-Built Drawings","t":"Electrical As-Built Drawings","r":"subcontractor","tr":"26 - Electrical"},
    {"c":"As-Built Drawings","t":"Plumbing As-Built Drawings","r":"subcontractor","tr":"22 - Plumbing"},
    {"c":"As-Built Drawings","t":"Fire Protection As-Built Drawings","r":"subcontractor","tr":"21 - Fire Suppression"},
    {"c":"Permits & Inspections","t":"Certificate of Occupancy","r":"general_contractor","p":"high"},
    {"c":"Permits & Inspections","t":"Final Building Inspection Sign-Off","r":"general_contractor"},
    {"c":"Permits & Inspections","t":"Final Fire Marshal Inspection","r":"general_contractor"},
    {"c":"Permits & Inspections","t":"Health Department Approval","r":"general_contractor","o":true},
    {"c":"Permits & Inspections","t":"Elevator Certificate","r":"subcontractor","tr":"14 - Conveying","o":true},
    {"c":"Test & Commissioning Reports","t":"Test & Balance Report","r":"testing_agency","tr":"23 - HVAC"},
    {"c":"Test & Commissioning Reports","t":"Commissioning Report","r":"commissioning_agent","o":true},
    {"c":"Test & Commissioning Reports","t":"Fire Alarm Test & Acceptance Report","r":"subcontractor","tr":"28 - Electronic Safety"},
    {"c":"Test & Commissioning Reports","t":"Backflow Preventer Test Report","r":"subcontractor","tr":"22 - Plumbing"},
    {"c":"Training & Demonstrations","t":"HVAC Controls Training Record","r":"subcontractor","tr":"23 - HVAC","o":true},
    {"c":"Training & Demonstrations","t":"Fire Alarm Training Record","r":"subcontractor","tr":"28 - Electronic Safety","o":true},
    {"c":"Attic Stock & Spare Parts","t":"Attic Stock - Flooring","r":"subcontractor","tr":"09 - Finishes","o":true},
    {"c":"Attic Stock & Spare Parts","t":"Attic Stock - Paint","r":"subcontractor","tr":"09 - Finishes","o":true},
    {"c":"Attic Stock & Spare Parts","t":"Spare Filters & Belts","r":"subcontractor","tr":"23 - HVAC","o":true},
    {"c":"Lien Waivers & Financial","t":"Final Unconditional Lien Waivers - All Subcontractors","r":"general_contractor","p":"high"},
    {"c":"Lien Waivers & Financial","t":"Consent of Surety","r":"general_contractor","o":true},
    {"c":"General","t":"Closeout Letter / Notice of Completion","r":"general_contractor"},
    {"c":"General","t":"Keys, Fobs & Access Credential Transfer","r":"general_contractor"},
    {"c":"General","t":"Final Cleaning Confirmation","r":"subcontractor","o":true}
  ]'::jsonb;
  entry jsonb;
  entry_category_id uuid;
  item_position integer := 0;
begin
  if actor_id is null or not public.has_org_permission(target_organization_id, 'template.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if not exists (select 1 from public.requirement_categories where organization_id = target_organization_id) then
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
  end if;

  if not exists (select 1 from public.requirement_templates where organization_id = target_organization_id) then
    starter_id := gen_random_uuid();
    insert into public.requirement_templates (
      id, organization_id, family_id, version, name, description, status, is_starter,
      published_at, published_by, created_by, updated_by
    ) values (
      starter_id, target_organization_id, starter_id, 1,
      'Standard Commercial Closeout - Starter',
      'A general example of common commercial closeout requirements. Verify every requirement against your contract documents and project obligations. Closeout does not provide legal advice.',
      'published', true, now(), actor_id, actor_id, actor_id
    );

    for entry in select * from jsonb_array_elements(starter_items) loop
      select id into entry_category_id from public.requirement_categories
      where organization_id = target_organization_id
        and lower(name) = lower(entry->>'c')
        and archived_at is null
      limit 1;
      if entry_category_id is null then
        select id into entry_category_id from public.requirement_categories
        where organization_id = target_organization_id and archived_at is null
        order by sort_order limit 1;
      end if;
      item_position := item_position + 10;
      insert into public.requirement_template_items (
        organization_id, template_id, item_key, title, category_id, trade, priority, is_optional, default_responsible_role, sort_order
      ) values (
        target_organization_id, starter_id,
        public.generate_requirement_item_key(entry->>'t'),
        entry->>'t', entry_category_id,
        nullif(entry->>'tr',''),
        coalesce(nullif(entry->>'p',''), 'normal'),
        coalesce((entry->>'o')::boolean, false),
        nullif(entry->>'r',''),
        item_position
      );
    end loop;

    perform public.write_audit_event(
      'internal_user', 'template', 'template.created',
      coalesce(request_id, gen_random_uuid()::text), 'web',
      target_organization_id, actor_id, null, starter_id,
      null, null, null, null, null,
      jsonb_build_object('seeded', true, 'name', 'Standard Commercial Closeout - Starter', 'family_id', starter_id, 'version', 1)
    );
  end if;
end;
$$;

do $$ declare signature text; begin
  foreach signature in array array[
    'public.create_requirement_template(uuid,text,text,text)',
    'public.update_requirement_template(uuid,timestamptz,jsonb,text)',
    'public.save_template_items(uuid,timestamptz,jsonb,text)',
    'public.publish_requirement_template(uuid,timestamptz,text)',
    'public.create_template_version(uuid,text)',
    'public.clone_requirement_template(uuid,text,text)',
    'public.archive_requirement_template(uuid,text)',
    'public.restore_requirement_template(uuid,text)',
    'public.get_template_preview(uuid,uuid)'
  ] loop
    execute 'revoke all on function '||signature||' from public, anon';
    execute 'grant execute on function '||signature||' to authenticated';
  end loop;
  execute 'revoke all on function public.generate_requirement_item_key(text) from public, anon, authenticated';
  execute 'grant execute on function public.generate_requirement_item_key(text) to service_role';
end $$;

comment on table public.requirement_templates is
  'Reusable closeout requirement templates. One row per version (family_id + version); published rows and their items are immutable.';
comment on table public.requirement_template_items is
  'Checklist items of one template version. item_key is family-stable and powers apply-time deduplication.';

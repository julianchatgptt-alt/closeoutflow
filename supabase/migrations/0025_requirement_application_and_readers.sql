-- Phase 6 template application, capped atomic bulk operations, and the
-- authorization-gated register/summary readers.

create or replace function public.apply_requirement_template(
  target_project_id uuid,
  target_template_id uuid,
  selections jsonb default '{}'::jsonb,
  request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  project public.projects;
  template public.requirement_templates;
  selected_keys text[];
  role_assignments jsonb := coalesce(selections->'role_assignments', '{}'::jsonb);
  fallback_due date := nullif(selections->>'default_due_date','')::date;
  item record;
  resolved_company uuid;
  resolved_due date;
  next_sort integer;
  added_count integer := 0;
  skipped_count integer := 0;
  unassigned_count integer := 0;
  role_company uuid;
begin
  select * into project from public.projects where id = target_project_id;
  if not found or not public.project_permission(target_project_id, 'requirement.apply_template') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if project.status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  select * into template from public.requirement_templates where id = target_template_id;
  if not found or template.organization_id <> project.organization_id
     or not public.has_org_permission(template.organization_id, 'template.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if template.status <> 'published' then
    raise exception 'only published templates can be applied' using errcode = '22023';
  end if;
  if selections - array['selected_item_keys','role_assignments','default_due_date'] <> '{}'::jsonb then
    raise exception 'unsupported template application option' using errcode = '22023';
  end if;

  if selections ? 'selected_item_keys' then
    select coalesce(array_agg(value), '{}') into selected_keys
    from jsonb_array_elements_text(selections->'selected_item_keys') value;
  end if;

  -- Validate every provided role resolution once (active on this project).
  for role_company in
    select distinct nullif(value, '')::uuid from jsonb_each_text(role_assignments) entries(key, value)
  loop
    perform public.assert_requirement_responsibility(target_project_id, role_company, null, null);
  end loop;

  for item in
    select template_item.*, category.sort_order as category_sort
    from public.requirement_template_items template_item
    join public.requirement_categories category on category.id = template_item.category_id
    where template_item.template_id = target_template_id
      and (selected_keys is null or template_item.item_key = any(selected_keys))
    order by category.sort_order, template_item.sort_order, template_item.id
  loop
    if exists (
      select 1 from public.project_requirements existing
      where existing.project_id = target_project_id
        and existing.source_item_key = item.item_key
        and existing.archived_at is null
    ) then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    resolved_company := case
      when item.default_responsible_role is not null
      then nullif(role_assignments->>item.default_responsible_role, '')::uuid
      else null
    end;
    resolved_due := case item.default_due_anchor
      when 'substantial_completion' then project.substantial_completion_date + coalesce(item.default_due_offset_days, 0)
      when 'closeout_target' then project.closeout_target_date + coalesce(item.default_due_offset_days, 0)
      else null
    end;
    if resolved_due is null then resolved_due := fallback_due; end if;
    if resolved_company is null then unassigned_count := unassigned_count + 1; end if;

    select coalesce(max(sort_order), 0) + 10 into next_sort
    from public.project_requirements
    where project_id = target_project_id and category_id = item.category_id;

    insert into public.project_requirements (
      organization_id, project_id, title, description, category_id, trade, priority, is_required,
      responsible_project_company_id, due_date, source_template_id, source_item_key,
      sort_order, normalized_title, created_by
    ) values (
      project.organization_id, target_project_id, item.title, item.description, item.category_id,
      item.trade, item.priority, not item.is_optional,
      resolved_company, resolved_due, target_template_id, item.item_key,
      next_sort, public.normalize_directory_text(item.title), actor_id
    );
    added_count := added_count + 1;
  end loop;

  perform public.write_audit_event(
    'internal_user', 'project', 'template.applied',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    project.organization_id, actor_id, target_project_id, target_template_id,
    null, null, null, null, null,
    jsonb_build_object(
      'template_id', target_template_id,
      'template_name', template.name,
      'version', template.version,
      'added_count', added_count,
      'skipped_count', skipped_count,
      'unassigned_count', unassigned_count
    )
  );

  return jsonb_build_object(
    'added_count', added_count,
    'skipped_count', skipped_count,
    'unassigned_count', unassigned_count
  );
exception
  when unique_violation then
    raise exception 'these requirements were just added by another user' using errcode = '23505';
end;
$$;

create or replace function public.bulk_update_project_requirements(
  target_project_id uuid,
  requirement_ids uuid[],
  bulk_action text,
  action_value jsonb default '{}'::jsonb,
  request_id text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  project public.projects;
  selection_count integer := coalesce(array_length(requirement_ids, 1), 0);
  matched_count integer;
  required_permission text;
  na_reason_value text;
  value_label text;
  capped_ids jsonb;
begin
  select * into project from public.projects where id = target_project_id;
  if not found then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if project.status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if selection_count < 1 or selection_count > 200 then
    raise exception 'select between 1 and 200 requirements' using errcode = '22023';
  end if;

  required_permission := case bulk_action
    when 'set_category' then 'requirement.manage'
    when 'set_priority' then 'requirement.manage'
    when 'set_due_date' then 'requirement.set_dates'
    when 'set_responsible_company' then 'requirement.assign'
    when 'set_responsible_contact' then 'requirement.assign'
    when 'set_internal_owner' then 'requirement.assign'
    when 'mark_not_applicable' then 'requirement.set_not_applicable'
    when 'reverse_not_applicable' then 'requirement.set_not_applicable'
    when 'archive' then 'requirement.archive'
    when 'restore' then 'requirement.archive'
    else null
  end;
  if required_permission is null then
    raise exception 'unsupported bulk action' using errcode = '22023';
  end if;
  if not public.project_permission(target_project_id, required_permission) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  -- All selected rows must belong to this project and match the action's archive state.
  select count(*) into matched_count from public.project_requirements
  where project_id = target_project_id and id = any(requirement_ids)
    and case when bulk_action = 'restore' then archived_at is not null else archived_at is null end;
  if matched_count <> selection_count then
    raise exception 'invalid requirement selection' using errcode = '22023';
  end if;

  if bulk_action = 'set_category' then
    if not exists (
      select 1 from public.requirement_categories
      where id = nullif(action_value->>'category_id','')::uuid
        and organization_id = project.organization_id and archived_at is null
    ) then
      raise exception 'requirement category is unavailable' using errcode = '22023';
    end if;
    select name into value_label from public.requirement_categories where id = (action_value->>'category_id')::uuid;
    update public.project_requirements
    set category_id = (action_value->>'category_id')::uuid
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'set_priority' then
    if coalesce(action_value->>'priority','') not in ('low','normal','high') then
      raise exception 'invalid priority' using errcode = '22023';
    end if;
    value_label := action_value->>'priority';
    update public.project_requirements
    set priority = action_value->>'priority'
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'set_due_date' then
    value_label := nullif(action_value->>'due_date','');
    update public.project_requirements
    set due_date = nullif(action_value->>'due_date','')::date
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'set_responsible_company' then
    perform public.assert_requirement_responsibility(
      target_project_id, nullif(action_value->>'responsible_project_company_id','')::uuid, null, null);
    select company.display_name into value_label
    from public.project_companies relation
    join public.companies company on company.id = relation.company_id
    where relation.id = nullif(action_value->>'responsible_project_company_id','')::uuid;
    update public.project_requirements
    set responsible_project_company_id = nullif(action_value->>'responsible_project_company_id','')::uuid
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'set_responsible_contact' then
    perform public.assert_requirement_responsibility(
      target_project_id, null, nullif(action_value->>'responsible_project_contact_id','')::uuid, null);
    update public.project_requirements
    set responsible_project_contact_id = nullif(action_value->>'responsible_project_contact_id','')::uuid
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'set_internal_owner' then
    perform public.assert_requirement_responsibility(
      target_project_id, null, null, nullif(action_value->>'internal_owner_member_id','')::uuid);
    update public.project_requirements
    set internal_owner_member_id = nullif(action_value->>'internal_owner_member_id','')::uuid
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'mark_not_applicable' then
    na_reason_value := trim(coalesce(action_value->>'reason',''));
    if char_length(na_reason_value) not between 3 and 200 then
      raise exception 'a reason between 3 and 200 characters is required' using errcode = '22023';
    end if;
    value_label := left(na_reason_value, 80);
    update public.project_requirements
    set status = 'not_applicable_approved', na_reason = na_reason_value
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'reverse_not_applicable' then
    update public.project_requirements
    set status = 'active', na_reason = null
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'archive' then
    update public.project_requirements
    set archived_at = now(), archived_by = actor_id
    where project_id = target_project_id and id = any(requirement_ids);
  elsif bulk_action = 'restore' then
    update public.project_requirements
    set archived_at = null, archived_by = null, archive_reason = null
    where project_id = target_project_id and id = any(requirement_ids);
  end if;

  select jsonb_agg(to_jsonb(id)) into capped_ids
  from unnest(requirement_ids[1:50]) id;

  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.bulk_updated',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    project.organization_id, actor_id, target_project_id, null,
    null, null, null, null, null,
    jsonb_strip_nulls(jsonb_build_object(
      'action', bulk_action,
      'count', selection_count,
      'requirement_ids', capped_ids,
      'truncated', case when selection_count > 50 then true end,
      'value_label', value_label
    ))
  );
  return selection_count;
exception
  when unique_violation then
    raise exception 'an active requirement from the same template item already exists' using errcode = '23505';
end;
$$;

-- Register reader: grouped, filtered, cursor-paginated, with display names and
-- derived stale-reference indicators (no status is ever stored for these).
create or replace function public.search_project_requirements(
  target_project_id uuid,
  search_query text default null,
  filters jsonb default '{}'::jsonb,
  page_size integer default 100,
  cursor_category_sort integer default null,
  cursor_sort_order integer default null,
  cursor_id uuid default null
)
returns table (
  id uuid,
  title text,
  description text,
  notes text,
  category_id uuid,
  category_name text,
  category_sort integer,
  trade text,
  priority text,
  is_required boolean,
  status text,
  na_reason text,
  due_date date,
  sort_order integer,
  updated_at timestamptz,
  archived_at timestamptz,
  responsible_project_company_id uuid,
  responsible_company_name text,
  responsible_company_stale boolean,
  responsible_project_contact_id uuid,
  responsible_contact_name text,
  responsible_contact_stale boolean,
  internal_owner_member_id uuid,
  internal_owner_name text,
  internal_owner_stale boolean,
  source_template_id uuid,
  source_template_name text,
  source_template_version integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := public.normalize_directory_text(search_query);
  effective_page integer := least(greatest(coalesce(page_size, 100), 1), 200);
begin
  if not public.can_access_project(target_project_id)
     or not public.project_permission(target_project_id, 'requirement.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  return query
  with rows as (
    select
      requirement.id, requirement.title, requirement.description, requirement.notes,
      requirement.category_id, category.name as category_name, category.sort_order as category_sort,
      requirement.trade, requirement.priority, requirement.is_required, requirement.status,
      requirement.na_reason, requirement.due_date, requirement.sort_order, requirement.updated_at,
      requirement.archived_at,
      requirement.responsible_project_company_id,
      company.display_name as responsible_company_name,
      (requirement.responsible_project_company_id is not null and (
        company_relation.status is distinct from 'active' or company.status is distinct from 'active'
      )) as responsible_company_stale,
      requirement.responsible_project_contact_id,
      nullif(trim(concat(contact.first_name, ' ', contact.last_name)), '') as responsible_contact_name,
      (requirement.responsible_project_contact_id is not null and (
        contact_relation.status is distinct from 'active' or contact.status is distinct from 'active'
      )) as responsible_contact_stale,
      requirement.internal_owner_member_id,
      case when requirement.internal_owner_member_id is null then null
        else coalesce(nullif(owner_profile.display_name, ''), 'Teammate') end as internal_owner_name,
      (requirement.internal_owner_member_id is not null and (
        owner_assignment.status is distinct from 'active' or owner_membership.status is distinct from 'active'
      )) as internal_owner_stale,
      requirement.source_template_id,
      source_template.name as source_template_name,
      source_template.version as source_template_version,
      requirement.normalized_title
    from public.project_requirements requirement
    join public.requirement_categories category on category.id = requirement.category_id
    left join public.project_companies company_relation on company_relation.id = requirement.responsible_project_company_id
    left join public.companies company on company.id = company_relation.company_id
    left join public.project_contacts contact_relation on contact_relation.id = requirement.responsible_project_contact_id
    left join public.contacts contact on contact.id = contact_relation.contact_id
    left join public.project_members owner_assignment on owner_assignment.id = requirement.internal_owner_member_id
    left join public.organization_memberships owner_membership on owner_membership.id = owner_assignment.membership_id
    left join public.user_profiles owner_profile on owner_profile.id = owner_membership.user_id
    left join public.requirement_templates source_template on source_template.id = requirement.source_template_id
    where requirement.project_id = target_project_id
  )
  select
    rows.id, rows.title, rows.description, rows.notes, rows.category_id, rows.category_name,
    rows.category_sort, rows.trade, rows.priority, rows.is_required, rows.status, rows.na_reason,
    rows.due_date, rows.sort_order, rows.updated_at, rows.archived_at,
    rows.responsible_project_company_id, rows.responsible_company_name, rows.responsible_company_stale,
    rows.responsible_project_contact_id, rows.responsible_contact_name, rows.responsible_contact_stale,
    rows.internal_owner_member_id, rows.internal_owner_name, rows.internal_owner_stale,
    rows.source_template_id, rows.source_template_name, rows.source_template_version
  from rows
  where
    (coalesce(filters->>'include_archived','false')::boolean or rows.archived_at is null)
    and (nullif(filters->>'archived_only','') is null or not (filters->>'archived_only')::boolean or rows.archived_at is not null)
    and (nullif(filters->>'category_id','') is null or rows.category_id = (filters->>'category_id')::uuid)
    and (nullif(filters->>'status','') is null
      or (filters->>'status' = 'active' and rows.status = 'active')
      or (filters->>'status' = 'not_applicable' and rows.status = 'not_applicable_approved'))
    and (nullif(filters->>'responsible_company_id','') is null
      or rows.responsible_project_company_id = (filters->>'responsible_company_id')::uuid)
    and (coalesce(filters->>'optional_only','false')::boolean is false or rows.is_required = false)
    and (coalesce(filters->>'needs_attention','false')::boolean is false or (
      rows.status = 'active' and rows.archived_at is null and (
        rows.responsible_project_company_id is null
        or rows.responsible_company_stale
        or rows.responsible_contact_stale
        or rows.internal_owner_member_id is null
        or rows.internal_owner_stale
        or rows.due_date is null
      )
    ))
    and (normalized_query = '' or rows.normalized_title like '%' || normalized_query || '%')
    and (
      cursor_id is null
      or (rows.category_sort, rows.sort_order, rows.id) > (cursor_category_sort, cursor_sort_order, cursor_id)
    )
  order by rows.category_sort, rows.sort_order, rows.id
  limit effective_page;
end;
$$;

-- Real configuration summary for the register header and project overview.
create or replace function public.get_requirement_summary(target_project_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  summary jsonb;
begin
  if not public.can_access_project(target_project_id)
     or not public.project_permission(target_project_id, 'requirement.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  with active_rows as (
    select
      requirement.*,
      (requirement.responsible_project_company_id is not null and (
        company_relation.status is distinct from 'active' or company.status is distinct from 'active'
      )) as company_stale,
      (requirement.responsible_project_contact_id is not null and (
        contact_relation.status is distinct from 'active' or contact.status is distinct from 'active'
      )) as contact_stale,
      (requirement.internal_owner_member_id is not null and (
        owner_assignment.status is distinct from 'active' or owner_membership.status is distinct from 'active'
      )) as owner_stale
    from public.project_requirements requirement
    left join public.project_companies company_relation on company_relation.id = requirement.responsible_project_company_id
    left join public.companies company on company.id = company_relation.company_id
    left join public.project_contacts contact_relation on contact_relation.id = requirement.responsible_project_contact_id
    left join public.contacts contact on contact.id = contact_relation.contact_id
    left join public.project_members owner_assignment on owner_assignment.id = requirement.internal_owner_member_id
    left join public.organization_memberships owner_membership on owner_membership.id = owner_assignment.membership_id
    where requirement.project_id = target_project_id and requirement.archived_at is null
  )
  select jsonb_build_object(
    'total', count(*) filter (where status = 'active'),
    'not_applicable', count(*) filter (where status = 'not_applicable_approved'),
    'unassigned_company', count(*) filter (where status = 'active' and responsible_project_company_id is null),
    'unassigned_owner', count(*) filter (where status = 'active' and internal_owner_member_id is null),
    'missing_due_date', count(*) filter (where status = 'active' and due_date is null),
    'stale_references', count(*) filter (where status = 'active' and (company_stale or contact_stale or owner_stale)),
    'needs_attention', count(*) filter (where status = 'active' and (
      responsible_project_company_id is null or internal_owner_member_id is null
      or due_date is null or company_stale or contact_stale or owner_stale
    )),
    'configured', count(*) filter (where status = 'active'
      and responsible_project_company_id is not null and due_date is not null
      and not company_stale and not contact_stale and not owner_stale),
    'by_category', coalesce((
      select jsonb_agg(jsonb_build_object('category_id', c.id, 'name', c.name, 'count', c.category_count) order by c.sort_order)
      from (
        select category.id, category.name, category.sort_order, count(*) as category_count
        from active_rows
        join public.requirement_categories category on category.id = active_rows.category_id
        where active_rows.status = 'active'
        group by category.id, category.name, category.sort_order
      ) c
    ), '[]'::jsonb),
    'upcoming', coalesce((
      select jsonb_agg(jsonb_build_object('id', u.id, 'title', u.title, 'due_date', u.due_date) order by u.due_date)
      from (
        select id, title, due_date from active_rows
        where status = 'active' and due_date is not null and due_date >= (now() at time zone 'utc')::date
        order by due_date asc limit 3
      ) u
    ), '[]'::jsonb)
  ) into summary
  from active_rows;

  return coalesce(summary, '{}'::jsonb);
end;
$$;

do $$ declare signature text; begin
  foreach signature in array array[
    'public.apply_requirement_template(uuid,uuid,jsonb,text)',
    'public.bulk_update_project_requirements(uuid,uuid[],text,jsonb,text)',
    'public.search_project_requirements(uuid,text,jsonb,integer,integer,integer,uuid)',
    'public.get_requirement_summary(uuid)'
  ] loop
    execute 'revoke all on function '||signature||' from public, anon';
    execute 'grant execute on function '||signature||' to authenticated';
  end loop;
end $$;

comment on function public.apply_requirement_template(uuid,uuid,jsonb,text) is
  'Atomically snapshots a published template into project requirements with item_key idempotency; re-applies add nothing and report skips.';
comment on function public.bulk_update_project_requirements(uuid,uuid[],text,jsonb,text) is
  'All-or-nothing bulk configuration changes for up to 200 requirements of one project, audited as a single event.';

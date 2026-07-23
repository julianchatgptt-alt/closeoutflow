-- Phase 6D: close the empty-payload write path in requirement updates.
--
-- This append-only replacement authorizes every supplied field group before
-- mutation, returns authorized no-op payloads without touching updated_at or
-- audit, and records only fields whose stored value actually changed.
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
  general_fields text[] := '{}'::text[];
  has_general_fields boolean := false;
  has_responsibility_fields boolean := false;
  has_due_date_field boolean := false;
  responsibility_changed boolean := false;
  due_date_changed boolean := false;
  request_key text := coalesce(request_id, gen_random_uuid()::text);
  next_title text;
  next_description text;
  next_notes text;
  next_category uuid;
  next_trade text;
  next_priority text;
  next_is_required boolean;
  next_company uuid;
  next_contact uuid;
  next_member uuid;
  next_due date;
  company_label text;
begin
  select * into prior
  from public.project_requirements
  where id = target_requirement_id
  for update;

  if not found or not public.project_permission(prior.project_id, 'requirement.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select status into project_status
  from public.projects
  where id = prior.project_id;

  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is not null then
    raise exception 'restore this requirement before editing it' using errcode = '22023';
  end if;
  if requirement_data is null or jsonb_typeof(requirement_data) <> 'object' then
    raise exception 'requirement data must be an object' using errcode = '22023';
  end if;
  if requirement_data - array[
    'title','description','notes','category_id','trade','priority','is_required',
    'responsible_project_company_id','responsible_project_contact_id','internal_owner_member_id','due_date'
  ] <> '{}'::jsonb then
    raise exception 'unsupported requirement field' using errcode = '22023';
  end if;

  has_general_fields := requirement_data ?| array[
    'title','description','notes','category_id','trade','priority','is_required'
  ];
  has_responsibility_fields := requirement_data ?| array[
    'responsible_project_company_id','responsible_project_contact_id','internal_owner_member_id'
  ];
  has_due_date_field := requirement_data ? 'due_date';

  -- Empty objects are harmless only for an actor who has at least one write
  -- capability. Read-only roles must never be able to exercise a write RPC.
  if not has_general_fields and not has_responsibility_fields and not has_due_date_field then
    if not (
      public.project_permission(prior.project_id, 'requirement.manage')
      or public.project_permission(prior.project_id, 'requirement.assign')
      or public.project_permission(prior.project_id, 'requirement.set_dates')
    ) then
      raise exception 'permission denied' using errcode = '42501';
    end if;
    return prior.updated_at;
  end if;

  -- Permissions follow the supplied field groups, not whether a supplied value
  -- happens to equal the current value. Mixed payloads require every grant.
  if has_general_fields
     and not public.project_permission(prior.project_id, 'requirement.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if has_responsibility_fields
     and not public.project_permission(prior.project_id, 'requirement.assign') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if has_due_date_field
     and not public.project_permission(prior.project_id, 'requirement.set_dates') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  if prior.updated_at <> expected_updated_at then
    raise exception 'requirement was updated by another user' using errcode = 'P0001';
  end if;

  if requirement_data ? 'title'
     and char_length(trim(coalesce(requirement_data->>'title',''))) not between 2 and 200 then
    raise exception 'requirement title must be between 2 and 200 characters'
      using errcode = '22023';
  end if;
  if requirement_data ? 'category_id' and not exists (
    select 1
    from public.requirement_categories
    where id = nullif(requirement_data->>'category_id','')::uuid
      and organization_id = prior.organization_id
      and archived_at is null
  ) then
    raise exception 'requirement category is unavailable' using errcode = '22023';
  end if;

  next_title := case
    when requirement_data ? 'title' then trim(requirement_data->>'title')
    else prior.title
  end;
  next_description := case
    when requirement_data ? 'description'
      then nullif(trim(coalesce(requirement_data->>'description','')),'')
    else prior.description
  end;
  next_notes := case
    when requirement_data ? 'notes'
      then nullif(trim(coalesce(requirement_data->>'notes','')),'')
    else prior.notes
  end;
  next_category := case
    when requirement_data ? 'category_id' then (requirement_data->>'category_id')::uuid
    else prior.category_id
  end;
  next_trade := case
    when requirement_data ? 'trade'
      then nullif(trim(coalesce(requirement_data->>'trade','')),'')
    else prior.trade
  end;
  next_priority := case
    when requirement_data ? 'priority'
      then coalesce(nullif(requirement_data->>'priority',''), 'normal')
    else prior.priority
  end;
  next_is_required := case
    when requirement_data ? 'is_required'
      then coalesce((requirement_data->>'is_required')::boolean, true)
    else prior.is_required
  end;
  next_company := case
    when requirement_data ? 'responsible_project_company_id'
      then nullif(requirement_data->>'responsible_project_company_id','')::uuid
    else prior.responsible_project_company_id
  end;
  next_contact := case
    when requirement_data ? 'responsible_project_contact_id'
      then nullif(requirement_data->>'responsible_project_contact_id','')::uuid
    else prior.responsible_project_contact_id
  end;
  next_member := case
    when requirement_data ? 'internal_owner_member_id'
      then nullif(requirement_data->>'internal_owner_member_id','')::uuid
    else prior.internal_owner_member_id
  end;
  next_due := case
    when requirement_data ? 'due_date'
      then nullif(requirement_data->>'due_date','')::date
    else prior.due_date
  end;

  general_fields := array_remove(array[
    case when next_title is distinct from prior.title then 'title' end,
    case when next_description is distinct from prior.description then 'description' end,
    case when next_notes is distinct from prior.notes then 'notes' end,
    case when next_category is distinct from prior.category_id then 'category_id' end,
    case when next_trade is distinct from prior.trade then 'trade' end,
    case when next_priority is distinct from prior.priority then 'priority' end,
    case when next_is_required is distinct from prior.is_required then 'is_required' end
  ], null);
  responsibility_changed :=
    next_company is distinct from prior.responsible_project_company_id
    or next_contact is distinct from prior.responsible_project_contact_id
    or next_member is distinct from prior.internal_owner_member_id;
  due_date_changed := next_due is distinct from prior.due_date;

  -- Authorized same-value payloads, like authorized empty objects, are true
  -- no-ops: no token churn and no misleading audit event.
  if coalesce(array_length(general_fields, 1), 0) = 0
     and not responsibility_changed
     and not due_date_changed then
    return prior.updated_at;
  end if;

  -- Validate only references whose stored value is changing. Historical stale
  -- pointers remain visible but cannot be newly assigned.
  perform public.assert_requirement_responsibility(
    prior.project_id,
    case when next_company is distinct from prior.responsible_project_company_id
      then next_company end,
    case when next_contact is distinct from prior.responsible_project_contact_id
      then next_contact end,
    case when next_member is distinct from prior.internal_owner_member_id
      then next_member end
  );

  update public.project_requirements
  set
    title = next_title,
    normalized_title = case
      when next_title is distinct from prior.title
        then public.normalize_directory_text(next_title)
      else prior.normalized_title
    end,
    description = next_description,
    notes = next_notes,
    category_id = next_category,
    trade = next_trade,
    priority = next_priority,
    is_required = next_is_required,
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
      'internal_user', 'requirement', 'requirement.responsibility_changed',
      request_key, 'web',
      prior.organization_id, actor_id, prior.project_id, target_requirement_id,
      jsonb_strip_nulls(jsonb_build_object(
        'company', prior.responsible_project_company_id,
        'contact', prior.responsible_project_contact_id,
        'owner', prior.internal_owner_member_id
      )),
      jsonb_strip_nulls(jsonb_build_object(
        'company', next_company,
        'contact', next_contact,
        'owner', next_member
      )),
      null, null, null,
      jsonb_strip_nulls(jsonb_build_object(
        'title', left(prior.title, 80),
        'company_name', company_label
      ))
    );
  end if;

  if due_date_changed then
    perform public.write_audit_event(
      'internal_user', 'requirement', 'requirement.due_date_changed',
      request_key, 'web',
      prior.organization_id, actor_id, prior.project_id, target_requirement_id,
      jsonb_build_object('due_date', prior.due_date),
      jsonb_build_object('due_date', next_due),
      null, null, null,
      jsonb_strip_nulls(jsonb_build_object(
        'title', left(prior.title, 80),
        'from', prior.due_date,
        'to', next_due
      ))
    );
  end if;

  if coalesce(array_length(general_fields, 1), 0) > 0 then
    perform public.write_audit_event(
      'internal_user', 'requirement', 'requirement.updated',
      request_key, 'web',
      prior.organization_id, actor_id, prior.project_id, target_requirement_id,
      null, null, null, null, null,
      jsonb_build_object('changed_fields', to_jsonb(general_fields))
    );
  end if;

  return next_updated_at;
end;
$$;

revoke all on function public.update_project_requirement(uuid,timestamptz,jsonb,text)
  from public, anon;
grant execute on function public.update_project_requirement(uuid,timestamptz,jsonb,text)
  to authenticated;

comment on function public.update_project_requirement(uuid,timestamptz,jsonb,text) is
  'Updates supplied requirement field groups only after their specific permission checks. Empty and same-value payloads are authorized no-ops and never touch updated_at or audit.';

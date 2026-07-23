-- Phase 6D: replace the unused broad reorder RPC with the accessible
-- single-step ordering mutation used by the register, and keep suspended
-- organization memberships out of the active project-team presentation.

revoke all on function public.reorder_project_requirements(uuid,uuid,uuid[],text)
  from public, anon, authenticated;
drop function public.reorder_project_requirements(uuid,uuid,uuid[],text);

create or replace function public.move_project_requirement(
  target_requirement_id uuid,
  expected_updated_at timestamptz,
  move_direction text,
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
  adjacent public.project_requirements;
  project_status text;
  next_updated_at timestamptz;
  next_sort_order integer;
begin
  select * into prior
  from public.project_requirements
  where id = target_requirement_id
  for update;

  if not found or not public.project_permission(prior.project_id, 'requirement.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  select status into project_status
  from public.projects
  where id = prior.project_id;

  if project_status = 'archived' then
    raise exception 'archived projects are read only' using errcode = '22023';
  end if;
  if prior.archived_at is not null then
    raise exception 'restore this requirement before reordering it' using errcode = '22023';
  end if;
  if move_direction not in ('up', 'down') then
    raise exception 'move direction must be up or down' using errcode = '22023';
  end if;
  if prior.updated_at <> expected_updated_at then
    raise exception 'requirement was updated by another user' using errcode = 'P0001';
  end if;

  if move_direction = 'up' then
    select * into adjacent
    from public.project_requirements
    where project_id = prior.project_id
      and category_id = prior.category_id
      and archived_at is null
      and id <> prior.id
      and (sort_order, id) < (prior.sort_order, prior.id)
    order by sort_order desc, id desc
    limit 1
    for update;
  else
    select * into adjacent
    from public.project_requirements
    where project_id = prior.project_id
      and category_id = prior.category_id
      and archived_at is null
      and id <> prior.id
      and (sort_order, id) > (prior.sort_order, prior.id)
    order by sort_order, id
    limit 1
    for update;
  end if;

  -- Moving beyond a category boundary is a true no-op.
  if not found then
    return prior.updated_at;
  end if;

  if adjacent.sort_order = prior.sort_order then
    next_sort_order := adjacent.sort_order
      + case when move_direction = 'up' then -1 else 1 end;
    update public.project_requirements
    set sort_order = next_sort_order
    where id = prior.id
    returning updated_at into next_updated_at;
  else
    next_sort_order := adjacent.sort_order;
    update public.project_requirements
    set sort_order = case
      when id = prior.id then adjacent.sort_order
      else prior.sort_order
    end
    where id in (prior.id, adjacent.id);

    select updated_at into next_updated_at
    from public.project_requirements
    where id = prior.id;
  end if;

  perform public.write_audit_event(
    'internal_user', 'requirement', 'requirement.reordered',
    coalesce(request_id, gen_random_uuid()::text), 'web',
    prior.organization_id, actor_id, prior.project_id, prior.id,
    jsonb_build_object('sort_order', prior.sort_order),
    jsonb_build_object('sort_order', next_sort_order),
    null, null, null,
    jsonb_build_object(
      'moved_count', 1,
      'category_id', prior.category_id,
      'direction', move_direction
    )
  );

  return next_updated_at;
end;
$$;

revoke all on function public.move_project_requirement(uuid,timestamptz,text,text)
  from public, anon;
grant execute on function public.move_project_requirement(uuid,timestamptz,text,text)
  to authenticated;

comment on function public.move_project_requirement(uuid,timestamptz,text,text) is
  'Moves one active requirement one position within its category. Requires requirement.manage, enforces optimistic concurrency, and writes one blocking audit event.';

create or replace function public.get_project_overview(target_project_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.can_access_project(target_project_id) then
    raise exception 'project not found' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'project', to_jsonb(p),
    'team', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pm.id,
          'membership_id', pm.membership_id,
          'project_role', pm.project_role,
          'display_name', coalesce(nullif(up.display_name,''), 'Teammate'),
          'status', pm.status
        )
        order by pm.assigned_at
      )
      from public.project_members pm
      join public.organization_memberships om
        on om.id = pm.membership_id
       and om.status = 'active'
      left join public.user_profiles up on up.id = om.user_id
      where pm.project_id = p.id
        and pm.status = 'active'
    ), '[]'::jsonb),
    'companies', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pc.id,
          'company_id', c.id,
          'display_name', c.display_name,
          'role', pc.role,
          'trade_scope', pc.trade_scope,
          'status', pc.status
        )
        order by pc.role, c.display_name
      )
      from public.project_companies pc
      join public.companies c on c.id = pc.company_id
      where pc.project_id = p.id
        and pc.status = 'active'
    ), '[]'::jsonb),
    'contacts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pc.id,
          'contact_id', c.id,
          'name', trim(c.first_name||' '||c.last_name),
          'project_title', pc.project_title,
          'is_primary_contact', pc.is_primary_contact,
          'is_closeout_contact', pc.is_closeout_contact,
          'status', pc.status
        )
        order by c.last_name, c.first_name
      )
      from public.project_contacts pc
      join public.contacts c on c.id = pc.contact_id
      where pc.project_id = p.id
        and pc.status = 'active'
    ), '[]'::jsonb),
    'setup', jsonb_build_object(
      'details', (
        p.project_type is not null
        and (
          p.planned_start_date is not null
          or p.closeout_target_date is not null
          or p.substantial_completion_date is not null
        )
      ),
      'team', (
        select count(*) > 0
        from public.project_members pm
        join public.organization_memberships om
          on om.id = pm.membership_id
         and om.status = 'active'
        where pm.project_id = p.id
          and pm.status = 'active'
      ),
      'owner_company', (
        select count(*) > 0
        from public.project_companies pc
        where pc.project_id = p.id
          and pc.status = 'active'
          and pc.role = 'owner'
      ),
      'key_companies', (
        select count(*) > 0
        from public.project_companies pc
        where pc.project_id = p.id
          and pc.status = 'active'
          and pc.role <> 'owner'
      ),
      'key_contacts', (
        select count(*) > 0
        from public.project_contacts pc
        where pc.project_id = p.id
          and pc.status = 'active'
      )
    )
  )
  into result
  from public.projects p
  where p.id = target_project_id;

  return result;
end;
$$;

revoke all on function public.get_project_overview(uuid) from public, anon;
grant execute on function public.get_project_overview(uuid) to authenticated;

comment on function public.get_project_overview(uuid) is
  'Returns the authorized project overview. The active-team projection excludes suspended or removed organization memberships while preserving their historical project-member rows.';

-- Phase 5 authorized search, overview, activity, and final grants census.
create or replace function public.search_projects(
  search_query text default null,
  status_filter text default null,
  project_type_filter text default null,
  assigned_only boolean default false,
  include_archived boolean default false,
  page_size integer default 25,
  cursor_updated_at timestamptz default null,
  cursor_id uuid default null
)
returns table(id uuid,organization_id uuid,name text,project_number text,status text,project_type text,closeout_target_date date,updated_at timestamptz,team_count bigint)
language sql stable security definer set search_path='' as $$
  select p.id,p.organization_id,p.name,p.project_number,p.status,p.project_type,p.closeout_target_date,p.updated_at,
    (select count(*) from public.project_members pm where pm.project_id=p.id and pm.status='active')
  from public.projects p
  where public.can_access_project(p.id)
    and (include_archived or p.status<>'archived')
    and (status_filter is null or p.status=status_filter)
    and (project_type_filter is null or p.project_type=project_type_filter)
    and (
      not assigned_only or exists(
        select 1 from public.project_members pm join public.organization_memberships om on om.id=pm.membership_id
        where pm.project_id=p.id and pm.status='active' and om.user_id=auth.uid() and om.status='active'
      )
    )
    and (search_query is null or trim(search_query)='' or p.name ilike '%'||trim(search_query)||'%' or p.project_number ilike '%'||trim(search_query)||'%')
    and (cursor_updated_at is null or (p.updated_at,p.id)<(cursor_updated_at,cursor_id))
  order by p.updated_at desc,p.id desc
  limit least(greatest(page_size,1),100);
$$;

create or replace function public.search_companies(
  target_organization_id uuid,
  search_query text default null,
  include_archived boolean default false,
  page_size integer default 25,
  cursor_name text default null,
  cursor_id uuid default null
)
returns table(id uuid,organization_id uuid,display_name text,legal_name text,classifications text[],trade text,status text,updated_at timestamptz,project_count bigint,contact_count bigint)
language sql stable security definer set search_path='' as $$
  select c.id,c.organization_id,c.display_name,c.legal_name,c.classifications,c.trade,c.status,c.updated_at,
    (select count(*) from public.project_companies pc where pc.company_id=c.id and pc.status='active' and public.can_access_project(pc.project_id)),
    (select count(*) from public.company_contacts cc where cc.company_id=c.id and cc.status='active')
  from public.companies c
  where c.organization_id=target_organization_id
    and public.has_org_permission(target_organization_id,'company.view')
    and (include_archived or c.status='active')
    and (search_query is null or trim(search_query)='' or c.normalized_name ilike '%'||public.normalize_directory_text(search_query)||'%' or c.website_domain ilike '%'||lower(trim(search_query))||'%')
    and (cursor_name is null or (lower(c.display_name),c.id)>(lower(cursor_name),cursor_id))
  order by lower(c.display_name),c.id
  limit least(greatest(page_size,1),100);
$$;

create or replace function public.search_contacts(
  target_organization_id uuid,
  search_query text default null,
  include_archived boolean default false,
  page_size integer default 25,
  cursor_name text default null,
  cursor_id uuid default null
)
returns table(id uuid,organization_id uuid,first_name text,last_name text,preferred_name text,email extensions.citext,job_title text,status text,updated_at timestamptz,company_name text,project_count bigint)
language sql stable security definer set search_path='' as $$
  select c.id,c.organization_id,c.first_name,c.last_name,c.preferred_name,c.email,c.job_title,c.status,c.updated_at,
    (select company.display_name from public.company_contacts cc join public.companies company on company.id=cc.company_id where cc.contact_id=c.id and cc.status='active' order by cc.is_primary_contact desc,cc.created_at desc limit 1),
    (select count(*) from public.project_contacts pc where pc.contact_id=c.id and pc.status='active' and public.can_access_project(pc.project_id))
  from public.contacts c
  where c.organization_id=target_organization_id
    and public.has_org_permission(target_organization_id,'contact.view')
    and (include_archived or c.status='active')
    and (search_query is null or trim(search_query)='' or (c.first_name||' '||c.last_name) ilike '%'||trim(search_query)||'%' or c.normalized_email::text ilike '%'||lower(trim(search_query))||'%')
    and (cursor_name is null or (lower(c.last_name||' '||c.first_name),c.id)>(lower(cursor_name),cursor_id))
  order by lower(c.last_name||' '||c.first_name),c.id
  limit least(greatest(page_size,1),100);
$$;

create or replace function public.get_project_overview(target_project_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.can_access_project(target_project_id) then raise exception 'project not found' using errcode='42501'; end if;
  select jsonb_build_object(
    'project',to_jsonb(p),
    'team',coalesce((select jsonb_agg(jsonb_build_object('id',pm.id,'membership_id',pm.membership_id,'project_role',pm.project_role,'display_name',coalesce(nullif(up.display_name,''),'Teammate'),'status',pm.status) order by pm.assigned_at) from public.project_members pm join public.organization_memberships om on om.id=pm.membership_id left join public.user_profiles up on up.id=om.user_id where pm.project_id=p.id and pm.status='active'),'[]'::jsonb),
    'companies',coalesce((select jsonb_agg(jsonb_build_object('id',pc.id,'company_id',c.id,'display_name',c.display_name,'role',pc.role,'trade_scope',pc.trade_scope,'status',pc.status) order by pc.role,c.display_name) from public.project_companies pc join public.companies c on c.id=pc.company_id where pc.project_id=p.id and pc.status='active'),'[]'::jsonb),
    'contacts',coalesce((select jsonb_agg(jsonb_build_object('id',pc.id,'contact_id',c.id,'name',trim(c.first_name||' '||c.last_name),'project_title',pc.project_title,'is_primary_contact',pc.is_primary_contact,'is_closeout_contact',pc.is_closeout_contact,'status',pc.status) order by c.last_name,c.first_name) from public.project_contacts pc join public.contacts c on c.id=pc.contact_id where pc.project_id=p.id and pc.status='active'),'[]'::jsonb),
    'setup',jsonb_build_object(
      'details',(p.project_type is not null and (p.planned_start_date is not null or p.closeout_target_date is not null or p.substantial_completion_date is not null)),
      'team',(select count(*)>0 from public.project_members pm where pm.project_id=p.id and pm.status='active'),
      'owner_company',(select count(*)>0 from public.project_companies pc where pc.project_id=p.id and pc.status='active' and pc.role='owner'),
      'key_companies',(select count(*)>0 from public.project_companies pc where pc.project_id=p.id and pc.status='active' and pc.role<>'owner'),
      'key_contacts',(select count(*)>0 from public.project_contacts pc where pc.project_id=p.id and pc.status='active')
    )
  ) into result from public.projects p where p.id=target_project_id;
  return result;
end; $$;

create or replace function public.get_project_activity(target_project_id uuid,page_size integer default 20,cursor_occurred_at timestamptz default null,cursor_id uuid default null)
returns table(id uuid,occurred_at timestamptz,action text,actor_name text,target_type text,target_id uuid,metadata jsonb)
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.can_access_project(target_project_id) then raise exception 'project not found' using errcode='42501'; end if;
  return query
  select event.id,event.occurred_at,event.action,coalesce(nullif(profile.display_name,''),'A teammate'),event.target_type,event.target_id,
    event.metadata - array['email','phone','mobile_phone','notes','description','token','secret','session']
  from audit.audit_events event
  left join public.user_profiles profile on profile.id=event.actor_id
  where event.project_id=target_project_id
    and event.action like 'project.%'
    and (cursor_occurred_at is null or (event.occurred_at,event.id)<(cursor_occurred_at,cursor_id))
  order by event.occurred_at desc,event.id desc
  limit least(greatest(page_size,1),50);
end; $$;

do $$ declare signature text; begin foreach signature in array array[
  'public.search_projects(text,text,text,boolean,boolean,integer,timestamptz,uuid)',
  'public.search_companies(uuid,text,boolean,integer,text,uuid)',
  'public.search_contacts(uuid,text,boolean,integer,text,uuid)',
  'public.get_project_overview(uuid)',
  'public.get_project_activity(uuid,integer,timestamptz,uuid)'
] loop execute 'revoke all on function '||signature||' from public, anon'; execute 'grant execute on function '||signature||' to authenticated'; end loop; end $$;

-- Final Phase 5 grants census: authenticated reads are RLS-gated and every
-- mutation remains RPC-only. Anon receives no table or RPC access.
revoke all on public.projects,public.project_members,public.companies,public.contacts,public.company_contacts,public.project_companies,public.project_contacts from public,anon,authenticated;
grant select on public.projects,public.project_members,public.companies,public.contacts,public.company_contacts,public.project_companies,public.project_contacts to authenticated;
grant all on public.projects,public.project_members,public.companies,public.contacts,public.company_contacts,public.project_companies,public.project_contacts to service_role;

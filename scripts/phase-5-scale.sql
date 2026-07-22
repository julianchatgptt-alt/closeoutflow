begin;

insert into public.projects(
  organization_id,name,project_number,status,project_type,city,region,closeout_target_date,created_by,updated_at
)
select
  '30000000-0000-4000-8000-000000000001',
  case when n=75 then repeat('Long Scale Project Name ',6)||n else 'Phase 5D Scale Project '||lpad(n::text,3,'0') end,
  'SCALE-'||lpad(n::text,3,'0'),
  case when n%15=0 then 'archived' else 'active' end,
  case when n%2=0 then 'office' else 'warehouse' end,
  'Charlotte','NC',date '2027-01-01'+n,
  '20000000-0000-4000-8000-000000000001',
  timestamptz '2026-07-20 12:00:00+00' + (n||' seconds')::interval
from generate_series(1,75) n;

insert into public.companies(
  organization_id,display_name,status,normalized_name,created_by,updated_at
)
select
  '30000000-0000-4000-8000-000000000001',
  case when n in (20,21) then 'Repeated Scale Company' else 'Phase 5D Scale Company '||lpad(n::text,3,'0') end,
  case when n%17=0 then 'archived' else 'active' end,
  public.normalize_directory_text(case when n in (20,21) then 'Repeated Scale Company' else 'Phase 5D Scale Company '||lpad(n::text,3,'0') end),
  '20000000-0000-4000-8000-000000000001',
  timestamptz '2026-07-20 12:00:00+00' + (n||' seconds')::interval
from generate_series(1,75) n;

insert into public.contacts(
  organization_id,first_name,last_name,email,normalized_email,status,created_by,updated_at
)
select
  '30000000-0000-4000-8000-000000000001',
  'Scale',
  case when n in (30,31) then 'Repeated' else 'Person '||lpad(n::text,3,'0') end,
  ('phase5d-scale-'||n||'@example.com')::extensions.citext,
  ('phase5d-scale-'||n||'@example.com')::extensions.citext,
  case when n%19=0 then 'archived' else 'active' end,
  '20000000-0000-4000-8000-000000000001',
  timestamptz '2026-07-20 12:00:00+00' + (n||' seconds')::interval
from generate_series(1,75) n;

insert into audit.audit_events(
  organization_id,actor_type,actor_id,project_id,target_type,target_id,action,request_id,source,metadata,occurred_at
)
select
  '30000000-0000-4000-8000-000000000001','internal_user',
  '20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',
  'project','50000000-0000-4000-8000-000000000001','project.updated',
  'phase-5d-scale-activity-'||n,'web','{"changed_fields":["city"]}'::jsonb,
  timestamptz '2026-07-20 12:00:00+00' + (n||' seconds')::interval
from generate_series(1,75) n;

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);

create temporary table scale_projects_page_1 as
select * from public.search_projects('Phase 5D Scale',null,null,false,false,25,null,null);
create temporary table scale_projects_page_2 as
select next_page.*
from (
  select updated_at,id from scale_projects_page_1 order by updated_at desc,id desc offset 24 limit 1
) cursor_row
cross join lateral public.search_projects(
  'Phase 5D Scale',null,null,false,false,25,cursor_row.updated_at,cursor_row.id
) next_page;

create temporary table scale_companies_page_1 as
select * from public.search_companies(
  '30000000-0000-4000-8000-000000000001','Scale',false,25,null,null
);
create temporary table scale_companies_page_2 as
select next_page.*
from (
  select display_name,id from scale_companies_page_1 order by lower(display_name),id offset 24 limit 1
) cursor_row
cross join lateral public.search_companies(
  '30000000-0000-4000-8000-000000000001','Scale',false,25,cursor_row.display_name,cursor_row.id
) next_page;

create temporary table scale_contacts_page_1 as
select * from public.search_contacts(
  '30000000-0000-4000-8000-000000000001','Scale',false,25,null,null
);
create temporary table scale_contacts_page_2 as
select next_page.*
from (
  select last_name||' '||first_name as cursor_name,id
  from scale_contacts_page_1 order by lower(last_name||' '||first_name),id offset 24 limit 1
) cursor_row
cross join lateral public.search_contacts(
  '30000000-0000-4000-8000-000000000001','Scale',false,25,cursor_row.cursor_name,cursor_row.id
) next_page;

create temporary table scale_activity_page_1 as
select * from public.get_project_activity('50000000-0000-4000-8000-000000000001',25,null,null);
create temporary table scale_activity_page_2 as
select next_page.*
from (
  select occurred_at,id from scale_activity_page_1 order by occurred_at desc,id desc offset 24 limit 1
) cursor_row
cross join lateral public.get_project_activity(
  '50000000-0000-4000-8000-000000000001',25,cursor_row.occurred_at,cursor_row.id
) next_page;

do $$
begin
  if (select count(*) from scale_projects_page_1)<>25 or (select count(*) from scale_projects_page_2)<>25 then
    raise exception 'project pagination did not return two full pages';
  end if;
  if exists(select id from scale_projects_page_1 intersect select id from scale_projects_page_2) then
    raise exception 'project pagination repeated rows';
  end if;
  if (select count(*) from scale_companies_page_1)<>25 or (select count(*) from scale_companies_page_2)<>25 then
    raise exception 'company pagination did not return two full pages';
  end if;
  if exists(select id from scale_companies_page_1 intersect select id from scale_companies_page_2) then
    raise exception 'company pagination repeated rows';
  end if;
  if (select count(*) from scale_contacts_page_1)<>25 or (select count(*) from scale_contacts_page_2)<>25 then
    raise exception 'contact pagination did not return two full pages';
  end if;
  if exists(select id from scale_contacts_page_1 intersect select id from scale_contacts_page_2) then
    raise exception 'contact pagination repeated rows';
  end if;
  if (select count(*) from scale_activity_page_1)<>25 or (select count(*) from scale_activity_page_2)<>25 then
    raise exception 'activity pagination did not return two full pages';
  end if;
  if exists(select id from scale_activity_page_1 intersect select id from scale_activity_page_2) then
    raise exception 'activity pagination repeated rows';
  end if;
  if public.get_project_overview('50000000-0000-4000-8000-000000000001') is null then
    raise exception 'project overview failed at scale';
  end if;
end $$;

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000005","email":"owner-b@example.com","aal":"aal2"}',true);
do $$
begin
  if (select count(*) from public.search_projects('Phase 5D Scale',null,null,false,true,100,null,null))<>0 then
    raise exception 'scale data crossed tenant boundary';
  end if;
end $$;

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);

explain (analyze,buffers,format text)
select * from public.search_projects('Phase 5D Scale',null,null,false,false,25,null,null);
explain (analyze,buffers,format text)
select public.get_project_overview('50000000-0000-4000-8000-000000000001');
explain (analyze,buffers,format text)
select * from public.get_project_activity('50000000-0000-4000-8000-000000000001',25,null,null);

rollback;

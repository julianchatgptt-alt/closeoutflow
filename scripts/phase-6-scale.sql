begin;

-- 2,000 requirements on the seeded Riverside project across every category and state.
insert into public.project_requirements(
  organization_id,project_id,title,category_id,priority,is_required,status,na_reason,
  responsible_project_company_id,internal_owner_member_id,due_date,sort_order,normalized_title,created_by,archived_at
)
select
  '30000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  case when n=2000 then repeat('Long Scale Requirement Title ',6)||n else 'Phase 6 Scale Requirement '||lpad(n::text,4,'0') end,
  (array[
    'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000009'
  ])[1+(n%9)]::uuid,
  case when n%7=0 then 'high' else 'normal' end,
  n%5<>0,
  case when n%11=0 and n%13<>0 then 'not_applicable_approved' else 'active' end,
  case when n%11=0 and n%13<>0 then 'Scale fixture exclusion' else null end,
  case when n%3=0 then '80000000-0000-4000-8000-000000000002'::uuid else null end,
  case when n%4=0 then '51000000-0000-4000-8000-000000000003'::uuid else null end,
  case when n%2=0 then date '2026-06-01'+(n%400) else null end,
  1000+n*10,
  public.normalize_directory_text('Phase 6 Scale Requirement '||lpad(n::text,4,'0')),
  '20000000-0000-4000-8000-000000000001',
  case when n%13=0 then now() else null end
from generate_series(1,2000) n;

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);

-- Page 1 and page 2 through the register reader at the 200-row page size.
create temporary table scale_register_page_1 as
select * from public.search_project_requirements('50000000-0000-4000-8000-000000000001',null,'{}'::jsonb,200,null,null,null);
create temporary table scale_register_page_2 as
select next_page.*
from (
  select category_sort,sort_order,id from scale_register_page_1
  order by category_sort,sort_order,id offset 199 limit 1
) cursor_row
cross join lateral public.search_project_requirements(
  '50000000-0000-4000-8000-000000000001',null,'{}'::jsonb,200,
  cursor_row.category_sort,cursor_row.sort_order,cursor_row.id
) next_page;

create temporary table scale_register_search as
select * from public.search_project_requirements('50000000-0000-4000-8000-000000000001','scale requirement 1999','{}'::jsonb,200,null,null,null);

create temporary table scale_register_attention as
select * from public.search_project_requirements('50000000-0000-4000-8000-000000000001',null,'{"needs_attention":"true"}'::jsonb,200,null,null,null);

create temporary table scale_summary as
select public.get_requirement_summary('50000000-0000-4000-8000-000000000001') as summary;

-- One capped bulk update against 200 rows.
create temporary table scale_bulk_ids as
select id from public.project_requirements
where project_id='50000000-0000-4000-8000-000000000001'
  and normalized_title like 'phase 6 scale requirement%'
  and archived_at is null
order by sort_order limit 200;

do $$
declare
  started timestamptz;
  bulk_count integer;
  expected_active bigint;
begin
  if (select count(*) from scale_register_page_1)<>200 or (select count(*) from scale_register_page_2)<>200 then
    raise exception 'register pagination did not return two full pages';
  end if;
  if exists(select id from scale_register_page_1 intersect select id from scale_register_page_2) then
    raise exception 'register pagination repeated rows';
  end if;
  if (select count(*) from scale_register_search)<>1 then
    raise exception 'register search did not isolate the expected title';
  end if;
  if (select count(*) from scale_register_attention)<>200 then
    raise exception 'needs-attention filter did not fill its page at scale';
  end if;

  select count(*) into expected_active from public.project_requirements
  where project_id='50000000-0000-4000-8000-000000000001' and archived_at is null and status='active';
  if (select (summary->>'total')::bigint from scale_summary)<>expected_active then
    raise exception 'summary total does not match the active register';
  end if;

  started := clock_timestamp();
  perform public.get_requirement_summary('50000000-0000-4000-8000-000000000001');
  if clock_timestamp()-started > interval '1500 milliseconds' then
    raise exception 'summary exceeded the local latency budget at 2000 requirements';
  end if;

  started := clock_timestamp();
  perform count(*) from public.search_project_requirements('50000000-0000-4000-8000-000000000001','scale','{}'::jsonb,200,null,null,null);
  if clock_timestamp()-started > interval '1500 milliseconds' then
    raise exception 'register search exceeded the local latency budget at 2000 requirements';
  end if;

  select public.bulk_update_project_requirements(
    '50000000-0000-4000-8000-000000000001',
    (select array_agg(id) from scale_bulk_ids),
    'set_priority','{"priority":"low"}'::jsonb,'phase-6-scale-bulk'
  ) into bulk_count;
  if bulk_count<>200 then
    raise exception 'capped bulk update did not report 200 rows';
  end if;
  if (select count(*) from public.project_requirements where id in (select id from scale_bulk_ids) and priority='low')<>200 then
    raise exception 'capped bulk update was not applied atomically';
  end if;
end $$;

select
  (select count(*) from scale_register_page_1) as page_1_rows,
  (select count(*) from scale_register_page_2) as page_2_rows,
  (select count(*) from scale_register_attention) as attention_rows,
  (select summary->>'total' from scale_summary) as active_total;

rollback;

begin;

select plan(9);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
create temporary table phase5d_contact as
select public.create_contact(
  '30000000-0000-4000-8000-000000000001',
  '{"first_name":"Audit","last_name":"Privacy","email":"phase5d-private@example.com","phone":"555-010-9911"}'::jsonb,
  'phase-5d-contact-create'
) as id;
select lives_ok(
  $$select public.update_contact(
    (select id from phase5d_contact),
    (select updated_at from public.contacts where id=(select id from phase5d_contact)),
    '{"first_name":"Audit","last_name":"Privacy Check","email":"phase5d-private@example.com","phone":"555-010-9911"}'::jsonb,
    'phase-5d-contact-update'
  )$$,
  'contact update fixture writes an audit event'
);

reset role;
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id=(select id from phase5d_contact)
      and action like 'contact.%'
      and concat_ws(' ',coalesce(before,'{}'::jsonb)::text,coalesce(after,'{}'::jsonb)::text,metadata::text)
        ilike '%phase5d-private@example.com%'
  ),
  0::bigint,
  'contact audit fields omit the contact email value'
);
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id=(select id from phase5d_contact)
      and action like 'contact.%'
      and concat_ws(' ',coalesce(before,'{}'::jsonb)::text,coalesce(after,'{}'::jsonb)::text,metadata::text)
        like '%555-010-9911%'
  ),
  0::bigint,
  'contact audit fields omit the contact phone value'
);

select ok(
  position('''40001''' in pg_get_functiondef('public.update_project(uuid,timestamptz,jsonb,text)'::regprocedure)) = 0,
  'project stale conflicts do not use the retryable serialization SQLSTATE'
);
select ok(
  position('''40001''' in pg_get_functiondef('public.update_company(uuid,timestamptz,jsonb,text)'::regprocedure)) = 0,
  'company stale conflicts do not use the retryable serialization SQLSTATE'
);
select ok(
  position('''40001''' in pg_get_functiondef('public.update_contact(uuid,timestamptz,jsonb,text)'::regprocedure)) = 0,
  'contact stale conflicts do not use the retryable serialization SQLSTATE'
);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select throws_ok(
  $$select public.update_project(
    '50000000-0000-4000-8000-000000000001',
    '2020-01-01T00:00:00.000Z'::timestamptz,
    '{"description":"stale write must not land"}'::jsonb,
    'phase-5d-stale-conflict'
  )$$,
  'P0001',
  'project was updated by another user',
  'stale project tokens return the non-retryable application conflict code'
);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000009","email":"reviewer@example.com","aal":"aal1"}',true);
select ok(public.project_permission('50000000-0000-4000-8000-000000000002','project.view'),'active assigned reviewer has project permission before removal');
reset role;
update public.organization_memberships set status='removed',removed_at=now() where id='40000000-0000-4000-8000-000000000009';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000009","email":"reviewer@example.com","aal":"aal1"}',true);
select ok(not public.project_permission('50000000-0000-4000-8000-000000000002','project.view'),'removed organization membership is denied independently by live SQL');

select * from finish();
rollback;

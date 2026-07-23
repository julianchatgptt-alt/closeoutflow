begin;

select plan(32);

-- Remediation surface ------------------------------------------------------------
select has_function(
  'public',
  'update_project_requirement',
  array['uuid','timestamp with time zone','jsonb','text'],
  'the hardened requirement update RPC exists'
);
select hasnt_function(
  'public',
  'reorder_project_requirements',
  array['uuid','uuid','uuid[]','text'],
  'the orphaned broad reorder RPC is removed'
);
select has_function(
  'public',
  'move_project_requirement',
  array['uuid','timestamp with time zone','text','text'],
  'the single-step requirement ordering RPC exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.move_project_requirement(uuid,timestamptz,text,text)',
    'execute'
  ),
  'authenticated callers can execute the RLS-backed move RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.move_project_requirement(uuid,timestamptz,text,text)',
    'execute'
  ),
  'anonymous callers cannot execute the move RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',
  true
);
select ok(
  not exists (
    select 1
    from jsonb_array_elements(
      public.get_project_overview('50000000-0000-4000-8000-000000000001')->'team'
    ) member
    where member->>'id' = '51000000-0000-4000-8000-000000000005'
  ),
  'the active overview team excludes a suspended organization membership'
);
reset role;

-- Give the existing read-only fixtures project access only for this rolled-back
-- test transaction, then create two deterministic rows in one category.
insert into public.project_members(
  id, organization_id, project_id, membership_id, project_role, status, assigned_by
) values
  (
    '51000000-0000-4000-8000-0000000000d1',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000003',
    'viewer',
    'active',
    '20000000-0000-4000-8000-000000000001'
  ),
  (
    '51000000-0000-4000-8000-0000000000d2',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000009',
    'internal_reviewer',
    'active',
    '20000000-0000-4000-8000-000000000001'
  );

insert into public.project_requirements(
  id, organization_id, project_id, title, category_id, priority, is_required,
  status, sort_order, normalized_title, created_by
) values
  (
    'd1000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Phase 6D Alpha',
    'a0000000-0000-4000-8000-000000000009',
    'normal',
    true,
    'active',
    100,
    'phase 6d alpha',
    '20000000-0000-4000-8000-000000000001'
  ),
  (
    'd1000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Phase 6D Beta',
    'a0000000-0000-4000-8000-000000000009',
    'normal',
    true,
    'active',
    200,
    'phase 6d beta',
    '20000000-0000-4000-8000-000000000001'
  );

create temporary table phase6d_update_baseline as
select
  updated_at,
  (
    select count(*)
    from audit.audit_events
    where target_id = 'd1000000-0000-4000-8000-000000000001'
  ) as audit_count
from public.project_requirements
where id = 'd1000000-0000-4000-8000-000000000001';
grant select on phase6d_update_baseline to authenticated;

-- Read-only roles cannot exercise the mutation RPC, even with no fields.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000003","email":"viewer@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{}'::jsonb
  )$$,
  '42501',
  'permission denied',
  'an assigned viewer cannot send an empty update payload'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000009","email":"reviewer@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{}'::jsonb
  )$$,
  '42501',
  'permission denied',
  'an assigned internal reviewer cannot send an empty update payload'
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{"title":"Reviewer title"}'::jsonb
  )$$,
  '42501',
  'permission denied',
  'general fields require requirement.manage'
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{"responsible_project_company_id":null}'::jsonb
  )$$,
  '42501',
  'permission denied',
  'responsibility fields require requirement.assign even when the value matches'
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{"due_date":null}'::jsonb
  )$$,
  '42501',
  'permission denied',
  'date fields require requirement.set_dates even when the value matches'
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{"title":"Mixed attempt","due_date":"2026-10-01"}'::jsonb
  )$$,
  '42501',
  'permission denied',
  'mixed payloads require every included field-group permission'
);
reset role;

select is(
  (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
  (select updated_at from phase6d_update_baseline),
  'read-only attempts do not change updated_at'
);

-- Authorized no-op payloads do not churn concurrency tokens or audit.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',
  true
);
select is(
  public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{}'::jsonb
  ),
  (select updated_at from phase6d_update_baseline),
  'an authorized empty payload returns the existing concurrency token'
);
reset role;
select is(
  (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
  (select updated_at from phase6d_update_baseline),
  'an authorized empty payload does not touch updated_at'
);
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id='d1000000-0000-4000-8000-000000000001'
  ),
  (select audit_count from phase6d_update_baseline),
  'an authorized empty payload writes no audit event'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{"status":"requested"}'::jsonb
  )$$,
  '22023',
  'unsupported requirement field',
  'unknown requirement fields remain rejected'
);
select is(
  public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
    '{"title":"Phase 6D Alpha"}'::jsonb
  ),
  (select updated_at from phase6d_update_baseline),
  'an authorized same-value payload is also a true no-op'
);
reset role;
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id='d1000000-0000-4000-8000-000000000001'
  ),
  (select audit_count from phase6d_update_baseline),
  'same-value payloads write no audit event'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',
  true
);
select lives_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    (select updated_at from phase6d_update_baseline),
    '{
      "title":"Phase 6D Alpha updated",
      "responsible_project_company_id":"80000000-0000-4000-8000-000000000002",
      "due_date":"2026-10-01"
    }'::jsonb,
    'phase-6d-mixed-update'
  )$$,
  'an authorized mixed payload updates all permitted field groups'
);
select is(
  (select title from public.project_requirements where id='d1000000-0000-4000-8000-000000000001'),
  'Phase 6D Alpha updated',
  'the general-field change is stored'
);
select ok(
  (
    select responsible_project_company_id='80000000-0000-4000-8000-000000000002'
      and due_date='2026-10-01'
    from public.project_requirements
    where id='d1000000-0000-4000-8000-000000000001'
  ),
  'the responsibility and date changes are stored'
);
reset role;
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id='d1000000-0000-4000-8000-000000000001'
  ),
  3::bigint,
  'one mixed mutation writes exactly its three granular audit events'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.update_project_requirement(
    'd1000000-0000-4000-8000-000000000001',
    '2000-01-01T00:00:00Z'::timestamptz,
    '{"title":"Stale overwrite"}'::jsonb
  )$$,
  'P0001',
  'requirement was updated by another user',
  'actual updates continue to enforce optimistic concurrency'
);

-- Accessible single-step ordering ------------------------------------------------
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000009","email":"reviewer@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.move_project_requirement(
    'd1000000-0000-4000-8000-000000000002',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000002'),
    'up'
  )$$,
  '42501',
  'permission denied',
  'a read-only reviewer cannot reorder requirements'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',
  true
);
create temporary table phase6d_move_baseline as
select updated_at
from public.project_requirements
where id='d1000000-0000-4000-8000-000000000002';
grant select on phase6d_move_baseline to authenticated;
select lives_ok(
  $$select public.move_project_requirement(
    'd1000000-0000-4000-8000-000000000002',
    (select updated_at from phase6d_move_baseline),
    'up',
    'phase-6d-move'
  )$$,
  'a coordinator can move a requirement one position'
);
select ok(
  (
    select beta.sort_order < alpha.sort_order
    from public.project_requirements beta
    cross join public.project_requirements alpha
    where beta.id='d1000000-0000-4000-8000-000000000002'
      and alpha.id='d1000000-0000-4000-8000-000000000001'
  ),
  'moving up changes the deterministic category order'
);
reset role;
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id='d1000000-0000-4000-8000-000000000002'
      and action='requirement.reordered'
  ),
  1::bigint,
  'a successful move writes exactly one blocking audit event'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.move_project_requirement(
    'd1000000-0000-4000-8000-000000000002',
    '2000-01-01T00:00:00Z'::timestamptz,
    'down'
  )$$,
  'P0001',
  'requirement was updated by another user',
  'requirement ordering rejects a stale concurrency token'
);
select is(
  public.move_project_requirement(
    'd1000000-0000-4000-8000-000000000002',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000002'),
    'up'
  ),
  (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000002'),
  'moving beyond the top category boundary is a no-op'
);
reset role;
select is(
  (
    select count(*)
    from audit.audit_events
    where target_id='d1000000-0000-4000-8000-000000000002'
      and action='requirement.reordered'
  ),
  1::bigint,
  'a boundary no-op writes no extra audit event'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"20000000-0000-4000-8000-000000000005","email":"owner-b@example.com","aal":"aal2"}',
  true
);
select throws_ok(
  $$select public.move_project_requirement(
    'd1000000-0000-4000-8000-000000000002',
    (select updated_at from public.project_requirements where id='d1000000-0000-4000-8000-000000000002'),
    'down'
  )$$,
  '42501',
  'permission denied',
  'a cross-tenant caller cannot reorder a foreign requirement'
);

select * from finish();
rollback;

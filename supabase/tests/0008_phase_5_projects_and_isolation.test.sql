begin;

select plan(56);

select has_table('public','projects','projects table exists');
select has_table('public','companies','companies table exists');
select has_table('public','contacts','contacts table exists');
select has_table('public','company_contacts','company_contacts table exists');
select has_table('public','project_companies','project_companies table exists');
select has_table('public','project_contacts','project_contacts table exists');
select has_table('public','project_members','project_members table exists');

select ok((select relforcerowsecurity from pg_class where oid='public.projects'::regclass),'projects forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.companies'::regclass),'companies forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.contacts'::regclass),'contacts forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.company_contacts'::regclass),'company_contacts forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.project_companies'::regclass),'project_companies forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.project_contacts'::regclass),'project_contacts forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.project_members'::regclass),'project_members forces RLS');

select ok(not exists(select 1 from (values('projects'),('companies'),('contacts'),('company_contacts'),('project_companies'),('project_contacts'),('project_members')) t(name) where has_table_privilege('anon','public.'||name,'select')),'anon has no Phase 5 table grants');
select ok(not exists(select 1 from (values('projects'),('companies'),('contacts'),('company_contacts'),('project_companies'),('project_contacts'),('project_members')) t(name) where not has_table_privilege('authenticated','public.'||name,'select')),'authenticated has RLS-gated SELECT on every Phase 5 table');
select ok(not exists(select 1 from (values('projects'),('companies'),('contacts'),('company_contacts'),('project_companies'),('project_contacts'),('project_members')) t(name) where has_table_privilege('authenticated','public.'||name,'insert') or has_table_privilege('authenticated','public.'||name,'update') or has_table_privilege('authenticated','public.'||name,'delete')),'authenticated has no direct Phase 5 mutation grants');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select is((select count(*) from public.projects where organization_id='30000000-0000-4000-8000-000000000001'),3::bigint,'owner sees every organization project');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","email":"viewer@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects),0::bigint,'unassigned viewer sees no projects');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000007","email":"pm@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects),1::bigint,'assigned project manager sees only the assigned project');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects),1::bigint,'assigned coordinator sees only the assigned project');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000009","email":"reviewer@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects),1::bigint,'assigned reviewer sees only the assigned project');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000004","email":"suspended@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects),0::bigint,'suspended organization member sees no projects even with a retained assignment');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000005","email":"owner-b@example.com","aal":"aal2"}',true);
select is((select count(*) from public.projects),1::bigint,'tenant B owner sees only tenant B project');
select is((select count(*) from public.companies where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A companies');
select is((select count(*) from public.contacts where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A contacts');
select is((select count(*) from public.company_contacts where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A affiliations');
select is((select count(*) from public.project_companies where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A project companies');
select is((select count(*) from public.project_contacts where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A project contacts');
select is((select count(*) from public.project_members where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A project members');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
create temporary table phase5_new_project as
select public.create_project('30000000-0000-4000-8000-000000000001','Phase Five Test Project','P5-TEST','office') as id;
select is((select count(*) from public.projects where id=(select id from phase5_new_project)),1::bigint,'create_project creates the project');
select is((select count(*) from public.project_members where project_id=(select id from phase5_new_project) and membership_id='40000000-0000-4000-8000-000000000001' and project_role='project_administrator'),1::bigint,'create_project atomically assigns the creator');

reset role;
select is((select count(*) from audit.audit_events where project_id=(select id from phase5_new_project) and action='project.created'),1::bigint,'create_project atomically writes its audit event');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select throws_ok($$select public.set_project_status((select id from phase5_new_project),'published')$$,'22023','invalid project status transition','draft to published is prohibited');
select lives_ok($$select public.set_project_status((select id from phase5_new_project),'active')$$,'draft to active is allowed');
select lives_ok($$select public.update_project((select id from phase5_new_project),(select updated_at from public.projects where id=(select id from phase5_new_project)),'{"city":"Charlotte"}'::jsonb)$$,'an authorized active project update succeeds');
select lives_ok($$select public.archive_project((select id from phase5_new_project),'Fixture archive')$$,'project administrator can archive');
select throws_ok($$select public.update_project((select id from phase5_new_project),(select updated_at from public.projects where id=(select id from phase5_new_project)),'{"city":"Durham"}'::jsonb)$$,'22023','archived projects are read only','archived project mutation is blocked');
select lives_ok($$select public.restore_project((select id from phase5_new_project))$$,'project administrator can restore');

select lives_ok($$select public.create_company('30000000-0000-4000-8000-000000000001','{"display_name":"Duplicate Friendly Co","website":"https://duplicate.example"}'::jsonb)$$,'first company create succeeds');
select lives_ok($$select public.create_company('30000000-0000-4000-8000-000000000001','{"display_name":"Duplicate Friendly Co","website":"https://duplicate.example"}'::jsonb)$$,'duplicate company is warned by readers but not blocked or auto-merged');
select is((select count(*) from public.companies where normalized_name='duplicate friendly co'),2::bigint,'company duplicates remain distinct records');
select lives_ok($$select public.create_contact('30000000-0000-4000-8000-000000000001','{"first_name":"Avery","last_name":"One","email":"shared@example.com"}'::jsonb)$$,'first contact create succeeds');
select lives_ok($$select public.create_contact('30000000-0000-4000-8000-000000000001','{"first_name":"Avery","last_name":"Two","email":"shared@example.com"}'::jsonb)$$,'duplicate contact email is advisory and not blocked');
select is((select count(*) from public.contacts where normalized_email='shared@example.com'),2::bigint,'contact duplicates remain distinct records');

select lives_ok($$select public.assign_project_company((select id from phase5_new_project),'60000000-0000-4000-8000-000000000002','{"role":"subcontractor","trade_scope":"HVAC"}'::jsonb)$$,'an existing directory company can be assigned');
select lives_ok($$select public.assign_project_company((select id from phase5_new_project),'60000000-0000-4000-8000-000000000002','{"role":"general_contractor"}'::jsonb)$$,'reassignment updates the one project-company relationship');
select is((select count(*) from public.project_companies where project_id=(select id from phase5_new_project) and company_id='60000000-0000-4000-8000-000000000002'),1::bigint,'project company uniqueness prevents duplicate assignments');
select throws_ok($$select public.assign_project_contact((select id from phase5_new_project),'70000000-0000-4000-8000-000000000001',jsonb_build_object('project_company_id',(select id from public.project_companies where project_id=(select id from phase5_new_project) and company_id='60000000-0000-4000-8000-000000000002')))$$,'23514','contact must have an active affiliation with the selected project company','project contact company-consistency guard blocks a mismatch');

select lives_ok($$select public.assign_project_member((select id from phase5_new_project),'40000000-0000-4000-8000-000000000003','viewer')$$,'project administrator can assign an active organization member');
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","email":"viewer@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects where id=(select id from phase5_new_project)),1::bigint,'project assignment grants viewer access');
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select lives_ok($$select public.remove_project_member((select id from public.project_members where project_id=(select id from phase5_new_project) and membership_id='40000000-0000-4000-8000-000000000003'))$$,'project member removal is soft and audited');
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","email":"viewer@example.com","aal":"aal1"}',true);
select is((select count(*) from public.projects where id=(select id from phase5_new_project)),0::bigint,'removed assignment revokes access immediately');

reset role;
select is((select count(*) from audit.audit_events where project_id=(select id from phase5_new_project) and (metadata::text ilike '%shared@example.com%' or metadata::text ilike '%phone%')),0::bigint,'Phase 5 audit metadata contains no contact email or phone values');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select ok((select count(*)>0 from public.get_project_activity((select id from phase5_new_project))),'authorized activity is derived from project audit events');
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","email":"viewer@example.com","aal":"aal1"}',true);
select throws_ok($$select * from public.get_project_activity((select id from phase5_new_project))$$,'42501','project not found','removed viewer cannot read project activity');

select * from finish();
rollback;

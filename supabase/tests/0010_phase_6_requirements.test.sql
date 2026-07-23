begin;

select plan(76);

-- Schema, forced RLS, and grants -------------------------------------------------
select has_table('public','requirement_categories','requirement_categories table exists');
select has_table('public','requirement_templates','requirement_templates table exists');
select has_table('public','requirement_template_items','requirement_template_items table exists');
select has_table('public','project_requirements','project_requirements table exists');

select ok((select relforcerowsecurity from pg_class where oid='public.requirement_categories'::regclass),'requirement_categories forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.requirement_templates'::regclass),'requirement_templates forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.requirement_template_items'::regclass),'requirement_template_items forces RLS');
select ok((select relforcerowsecurity from pg_class where oid='public.project_requirements'::regclass),'project_requirements forces RLS');

select ok(not exists(select 1 from (values('requirement_categories'),('requirement_templates'),('requirement_template_items'),('project_requirements')) t(name) where has_table_privilege('anon','public.'||name,'select')),'anon has no Phase 6 table grants');
select ok(not exists(select 1 from (values('requirement_categories'),('requirement_templates'),('requirement_template_items'),('project_requirements')) t(name) where not has_table_privilege('authenticated','public.'||name,'select')),'authenticated has RLS-gated SELECT on every Phase 6 table');
select ok(not exists(select 1 from (values('requirement_categories'),('requirement_templates'),('requirement_template_items'),('project_requirements')) t(name) where has_table_privilege('authenticated','public.'||name,'insert') or has_table_privilege('authenticated','public.'||name,'update') or has_table_privilege('authenticated','public.'||name,'delete')),'authenticated has no direct Phase 6 mutation grants');

-- Stored lifecycle guardrails (service-role level) --------------------------------
select throws_ok($$insert into public.project_requirements(organization_id,project_id,title,category_id,status,na_reason,sort_order,normalized_title,created_by) values('30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Forged status','a0000000-0000-4000-8000-000000000009','requested',null,10,'forged status','20000000-0000-4000-8000-000000000001')$$,'23514',null,'reserved lifecycle values are rejected by the check constraint');
select throws_ok($$insert into public.project_requirements(organization_id,project_id,title,category_id,status,na_reason,sort_order,normalized_title,created_by) values('30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','N/A without reason','a0000000-0000-4000-8000-000000000009','not_applicable_approved',null,10,'n a without reason','20000000-0000-4000-8000-000000000001')$$,'23514',null,'not applicable requires a stored reason');
select throws_ok($$insert into public.project_requirements(organization_id,project_id,title,category_id,sort_order,normalized_title,created_by,responsible_project_company_id) values('30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Wrong project company','a0000000-0000-4000-8000-000000000009',10,'wrong project company','20000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000004')$$,'22023','responsible company must belong to this project','cross-project responsibility references are rejected structurally');

-- Tenant isolation ---------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000005","email":"owner-b@example.com","aal":"aal2"}',true);
select is((select count(*) from public.requirement_categories where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A categories');
select is((select count(*) from public.requirement_templates where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A templates');
select is((select count(*) from public.requirement_template_items where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A template items');
select is((select count(*) from public.project_requirements where organization_id='30000000-0000-4000-8000-000000000001'),0::bigint,'tenant B cannot read tenant A requirements');
select throws_ok($$select public.apply_requirement_template('50000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000001')$$,'42501','permission denied','a foreign template id is denied without existence leakage');
select throws_ok($$select * from public.get_template_preview('b0000000-0000-4000-8000-000000000001')$$,'42501','permission denied','a foreign template preview is denied');

-- Project-access gating ----------------------------------------------------------
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","email":"viewer@example.com","aal":"aal1"}',true);
select is((select count(*) from public.project_requirements),0::bigint,'unassigned organization member sees no project requirements');
select is((select count(*) from public.requirement_templates where organization_id='30000000-0000-4000-8000-000000000001'),2::bigint,'unassigned member still reads the organization template library');
select throws_ok($$select public.get_requirement_summary('50000000-0000-4000-8000-000000000001')$$,'42501','permission denied','unassigned member cannot read the register summary');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000007","email":"pm@example.com","aal":"aal1"}',true);
select is((select count(distinct project_id) from public.project_requirements),1::bigint,'assigned project manager sees only the assigned project register');
select is((select count(*) from public.project_requirements where project_id='50000000-0000-4000-8000-000000000001'),6::bigint,'assigned project manager sees the full seeded register');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000004","email":"suspended@example.com","aal":"aal1"}',true);
select is((select count(*) from public.project_requirements),0::bigint,'suspended member sees no requirements even with a retained assignment');
select is((select count(*) from public.requirement_templates),0::bigint,'suspended member sees no templates');

-- Derived indicators and the register reader --------------------------------------
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select is((select count(*) from public.search_project_requirements('50000000-0000-4000-8000-000000000001')),5::bigint,'register reader returns active plus not-applicable rows and hides archived by default');
select is((select count(*) from public.search_project_requirements('50000000-0000-4000-8000-000000000001',null,'{"include_archived":"true"}'::jsonb)),6::bigint,'archived rows appear when explicitly included');
select is((select count(*) from public.search_project_requirements('50000000-0000-4000-8000-000000000001',null,'{"needs_attention":"true"}'::jsonb)),3::bigint,'needs-attention derives unassigned, stale, and undated rows');
select ok((select responsible_company_stale from public.search_project_requirements('50000000-0000-4000-8000-000000000001') where id='d0000000-0000-4000-8000-000000000002'),'a removed project company surfaces as a stale reference');
select is((select count(*) from public.search_project_requirements('50000000-0000-4000-8000-000000000001','roofing')),1::bigint,'title search matches normalized text');
select is((select summary->>'total' from (select public.get_requirement_summary('50000000-0000-4000-8000-000000000001') summary) s),'4','summary counts active requirements only');
select is((select summary->>'needs_attention' from (select public.get_requirement_summary('50000000-0000-4000-8000-000000000001') summary) s),'3','summary needs-attention matches the derived filter');

-- Assignment never transitions lifecycle ------------------------------------------
select lives_ok($$select public.update_project_requirement('d0000000-0000-4000-8000-000000000003',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000003'),'{"responsible_project_company_id":"80000000-0000-4000-8000-000000000002"}'::jsonb)$$,'assigning a responsible company succeeds');
select is((select status from public.project_requirements where id='d0000000-0000-4000-8000-000000000003'),'active','assigning responsibility does not change the stored lifecycle');
select lives_ok($$select public.update_project_requirement('d0000000-0000-4000-8000-000000000003',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000003'),'{"responsible_project_company_id":null}'::jsonb)$$,'clearing responsibility succeeds');
select is((select status from public.project_requirements where id='d0000000-0000-4000-8000-000000000003'),'active','clearing responsibility does not change the stored lifecycle');
select throws_ok($$select public.update_project_requirement('d0000000-0000-4000-8000-000000000003',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000003'),'{"responsible_project_company_id":"80000000-0000-4000-8000-000000000006"}'::jsonb)$$,'22023','responsible company must be active on this project','newly assigning a removed company relationship is rejected');
select throws_ok($$select public.update_project_requirement('d0000000-0000-4000-8000-000000000003','2000-01-01T00:00:00Z'::timestamptz,'{"title":"Stale write"}'::jsonb)$$,'P0001','requirement was updated by another user','stale optimistic-concurrency tokens are rejected');

reset role;
select is((select count(*) from audit.audit_events where target_id='d0000000-0000-4000-8000-000000000003' and action='requirement.responsibility_changed'),2::bigint,'responsibility changes write their audit events');
select is((select count(*) from audit.audit_events where action like 'requirement.%' and (metadata::text like '%@example.com%' or metadata::text like '%phone%')),0::bigint,'requirement audit metadata contains no email or phone values');

-- Lifecycle: N/A permission, reason, reversal -------------------------------------
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000009","email":"reviewer@example.com","aal":"aal1"}',true);
select throws_ok($$select public.mark_requirement_not_applicable('d0000000-0000-4000-8000-000000000006',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),'Reviewer attempt')$$,'42501','permission denied','internal reviewer cannot mark not applicable');

select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000008","email":"coordinator@example.com","aal":"aal1"}',true);
select throws_ok($$select public.mark_requirement_not_applicable('d0000000-0000-4000-8000-000000000006',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),'')$$,'22023','a reason between 3 and 200 characters is required','a reason is required to mark not applicable');
select lives_ok($$select public.mark_requirement_not_applicable('d0000000-0000-4000-8000-000000000006',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),'Owner declined the optional video')$$,'coordinator can mark not applicable with a reason');
select is((select status from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),'not_applicable_approved','not applicable is stored with its reason');
select lives_ok($$select public.reverse_requirement_not_applicable('d0000000-0000-4000-8000-000000000006',(select updated_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'))$$,'coordinator can reverse not applicable');
select is((select status from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),'active','reversal returns the requirement to active');
select is((select na_reason from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),null,'reversal clears the stored reason');

-- Archive independence ------------------------------------------------------------
select lives_ok($$select public.archive_project_requirement('d0000000-0000-4000-8000-000000000006','No longer tracked')$$,'coordinator can archive a requirement');
select is((select status from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),'active','archiving leaves the stored lifecycle untouched');
select lives_ok($$select public.restore_project_requirement('d0000000-0000-4000-8000-000000000006')$$,'coordinator can restore a requirement');
select is((select archived_at from public.project_requirements where id='d0000000-0000-4000-8000-000000000006'),null,'restore clears the archival timestamp only');

-- Template immutability and versioning --------------------------------------------
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select throws_ok($$select public.save_template_items('b0000000-0000-4000-8000-000000000001',(select updated_at from public.requirement_templates where id='b0000000-0000-4000-8000-000000000001'),'[]'::jsonb)$$,'22023','published template versions cannot be edited','published template items are immutable');
select throws_ok($$select public.create_template_version('b0000000-0000-4000-8000-000000000001')$$,'22023','a draft version of this template already exists','a second concurrent draft version is rejected');
select lives_ok($$select public.publish_requirement_template('b0000000-0000-4000-8000-000000000002',(select updated_at from public.requirement_templates where id='b0000000-0000-4000-8000-000000000002'))$$,'the draft v2 can be published');
create temporary table phase6_v3 as select public.create_template_version('b0000000-0000-4000-8000-000000000002') as id;
select is((select version from public.requirement_templates where id=(select id from phase6_v3)),3,'editing a published template creates the next draft version');
select is((select count(*) from public.requirement_template_items where template_id=(select id from phase6_v3) and item_key='hvac-om-manual-seed01'),1::bigint,'new versions keep family-stable item keys');
create temporary table phase6_clone as select public.clone_requirement_template('b0000000-0000-4000-8000-000000000001','Cloned Medical Standard') as id;
select is((select family_id from public.requirement_templates where id=(select id from phase6_clone)),(select id from phase6_clone),'clones start a new template family');
select is((select count(*) from public.requirement_template_items where template_id=(select id from phase6_clone) and item_key in (select item_key from public.requirement_template_items where template_id='b0000000-0000-4000-8000-000000000001')),0::bigint,'clones regenerate item keys');

-- Template application: atomicity and idempotency ----------------------------------
create temporary table phase6_apply as
select public.apply_requirement_template('50000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','{"role_assignments":{"subcontractor":"80000000-0000-4000-8000-000000000002"}}'::jsonb) as result;
select is((select result->>'added_count' from phase6_apply),'2','apply adds only items whose keys are not active in the project');
select is((select result->>'skipped_count' from phase6_apply),'4','apply reports skipped duplicates honestly');
create temporary table phase6_reapply as
select public.apply_requirement_template('50000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001') as result;
select is((select result->>'added_count' from phase6_reapply),'0','re-applying the same template adds nothing');
select is((select result->>'skipped_count' from phase6_reapply),'6','re-apply reports every existing item as skipped');
reset role;
select is((select count(*) from audit.audit_events where action='template.applied' and project_id='50000000-0000-4000-8000-000000000001' and request_id<>'phase-6-seed-apply'),2::bigint,'each apply writes exactly one audit event');

-- Bulk operations -----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select is(public.bulk_update_project_requirements('50000000-0000-4000-8000-000000000001',array['d0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003']::uuid[],'set_due_date','{"due_date":"2026-09-20"}'::jsonb),2,'bulk due-date update succeeds atomically');
select is((select count(*) from public.project_requirements where due_date='2026-09-20' and project_id='50000000-0000-4000-8000-000000000001'),2::bigint,'bulk due-date update applied to every selected row');
select throws_ok($$select public.bulk_update_project_requirements('50000000-0000-4000-8000-000000000001',array['d0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000021']::uuid[],'set_priority','{"priority":"high"}'::jsonb)$$,'22023','invalid requirement selection','bulk calls cannot mix projects or tenants');
select throws_ok($$select public.bulk_update_project_requirements('50000000-0000-4000-8000-000000000001',(select array_agg(gen_random_uuid()) from generate_series(1,201)),'set_priority','{"priority":"high"}'::jsonb)$$,'22023','select between 1 and 200 requirements','bulk selection is capped at 200');
reset role;
select is((select count(*) from audit.audit_events where action='requirement.bulk_updated' and project_id='50000000-0000-4000-8000-000000000001'),1::bigint,'a bulk action writes one audit event');

-- Starter defaults seeding (fresh organization) -------------------------------------
insert into public.organizations (id, display_name, slug) values ('30000000-0000-4000-8000-000000000003','Fresh Start Builders','fresh-start-builders');
insert into public.organization_memberships (id, organization_id, user_id, role, status, joined_at)
values ('40000000-0000-4000-8000-000000000031','30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','owner','active',now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","email":"owner@example.com","aal":"aal2"}',true);
select lives_ok($$select public.ensure_requirement_defaults('30000000-0000-4000-8000-000000000003')$$,'defaults seed for a fresh organization');
select is((select count(*) from public.requirement_categories where organization_id='30000000-0000-4000-8000-000000000003'),9::bigint,'nine default categories are seeded');
select is((select count(*) from public.requirement_templates where organization_id='30000000-0000-4000-8000-000000000003' and is_starter and status='published'),1::bigint,'one published starter template is seeded');
select ok((select count(*) >= 30 from public.requirement_template_items where organization_id='30000000-0000-4000-8000-000000000003'),'the starter template carries a full requirement set');
select lives_ok($$select public.ensure_requirement_defaults('30000000-0000-4000-8000-000000000003')$$,'re-running defaults is an idempotent no-op');
select is((select count(*) from public.requirement_templates where organization_id='30000000-0000-4000-8000-000000000003'),1::bigint,'idempotent defaults never duplicate the starter');

select * from finish();
rollback;

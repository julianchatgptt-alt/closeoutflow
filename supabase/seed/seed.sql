-- Deterministic, clearly fake local Phase 4 identities.
-- Password for every seeded account: Closeout-Test-2026!
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'owner@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Olivia Owner"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'admin@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Amir Admin"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated', 'viewer@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Vera Viewer"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000004',
    'authenticated', 'authenticated', 'suspended@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Sam Suspended"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000005',
    'authenticated', 'authenticated', 'owner-b@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Blair Builder"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000006',
    'authenticated', 'authenticated', 'platform@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Pat Platform"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000007',
    'authenticated', 'authenticated', 'pm@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Parker Manager"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000008',
    'authenticated', 'authenticated', 'coordinator@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Casey Coordinator"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-4000-8000-000000000009',
    'authenticated', 'authenticated', 'reviewer@example.com',
    extensions.crypt('Closeout-Test-2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Riley Reviewer"}',
    now(), now(), '', '', '', ''
  );

insert into auth.identities (
  provider_id, user_id, identity_data, provider, created_at, updated_at
)
select
  user_record.id::text,
  user_record.id,
  jsonb_build_object(
    'sub', user_record.id::text,
    'email', user_record.email,
    'email_verified', true
  ),
  'email',
  now(),
  now()
from auth.users user_record
where user_record.id::text like '20000000-0000-4000-8000-%';

insert into public.organizations (id, display_name, slug)
values
  ('30000000-0000-4000-8000-000000000001', 'Sample Construction Co.', 'sample-construction-co'),
  ('30000000-0000-4000-8000-000000000002', 'Riverside Builders', 'riverside-builders');

insert into public.organization_memberships (
  id, organization_id, user_id, role, status, joined_at, suspended_at
) values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'owner', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'administrator', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'viewer', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000004',
    'internal_reviewer', 'suspended', now(), now()
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000005',
    'owner', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'project_manager', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000007',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000007',
    'project_manager', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000008',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000008',
    'closeout_coordinator', 'active', now(), null
  ),
  (
    '40000000-0000-4000-8000-000000000009',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000009',
    'internal_reviewer', 'active', now(), null
  );

insert into public.platform_roles (user_id, role)
values ('20000000-0000-4000-8000-000000000006', 'platform_admin');

update public.user_profiles
set onboarding_status = 'complete'
where id in (
  select user_id from public.organization_memberships where status = 'active'
);

insert into public.projects (
  id,organization_id,name,project_number,status,project_type,delivery_method,
  city,region,country,planned_start_date,substantial_completion_date,
  closeout_target_date,created_by,archived_by,archived_at,archive_reason
) values
  ('50000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Riverside Medical Office','2026-014','active','medical','design_build','Riverside','NC','US','2026-01-12','2026-09-01','2026-09-15','20000000-0000-4000-8000-000000000001',null,null,null),
  ('50000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Eastgate Retail Buildout','2026-021','draft','retail','design_bid_build','Charlotte','NC','US','2026-03-02','2026-10-15','2026-11-01','20000000-0000-4000-8000-000000000001',null,null,null),
  ('50000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','Grace Community Church','2025-033','archived','church','cm_at_risk','Concord','NC','US','2025-01-10','2026-02-15','2026-03-01','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',now(),'Closeout record retained'),
  ('50000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','Riverside Builders Warehouse','RB-101','active','warehouse','design_build','Durham','NC','US','2026-02-01','2026-12-01','2026-12-15','20000000-0000-4000-8000-000000000005',null,null,null);

insert into public.project_members(id,organization_id,project_id,membership_id,project_role,status,assigned_by) values
  ('51000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','project_administrator','active','20000000-0000-4000-8000-000000000001'),
  ('51000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000007','project_manager','active','20000000-0000-4000-8000-000000000001'),
  ('51000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000008','closeout_coordinator','active','20000000-0000-4000-8000-000000000001'),
  ('51000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000009','internal_reviewer','active','20000000-0000-4000-8000-000000000001'),
  ('51000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000004','internal_reviewer','active','20000000-0000-4000-8000-000000000001'),
  ('51000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000005','project_administrator','active','20000000-0000-4000-8000-000000000005');

insert into public.companies(id,organization_id,display_name,website,website_domain,classifications,trade,status,normalized_name,created_by) values
  ('60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Riverside Health Partners','https://riverside-health.example','riverside-health.example',array['owner'],'Healthcare owner','active','riverside health partners','20000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Ace Mechanical','https://ace-mechanical.example','ace-mechanical.example',array['subcontractor'],'HVAC','active','ace mechanical','20000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','Northline Architects',null,null,array['architect'],'Architecture','active','northline architects','20000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','Triangle Steelworks',null,null,array['subcontractor'],'Structural steel','active','triangle steelworks','20000000-0000-4000-8000-000000000005');

insert into public.contacts(id,organization_id,first_name,last_name,email,normalized_email,job_title,status,created_by) values
  ('70000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Jordan','Lee','jordan.lee@example.com','jordan.lee@example.com','Facilities Director','active','20000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Sam','Rivera','sam.rivera@example.com','sam.rivera@example.com','Project Executive','active','20000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','Morgan','Chen','morgan.chen@example.com','morgan.chen@example.com','Mechanical PM','active','20000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','Taylor','Brooks','taylor.brooks@example.com','taylor.brooks@example.com','Fabrication Manager','active','20000000-0000-4000-8000-000000000005');

insert into public.company_contacts(id,organization_id,company_id,contact_id,job_title,is_primary_contact,status,started_on) values
  ('71000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','Facilities Director',true,'active','2024-01-01'),
  ('71000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000002','Project Executive',true,'active','2023-06-01'),
  ('71000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000003','Mechanical PM',true,'active','2025-01-01'),
  ('71000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000004','Fabrication Manager',true,'active','2025-02-01');

insert into public.project_companies(id,organization_id,project_id,company_id,role,trade_scope,status,added_by) values
  ('80000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','owner',null,'active','20000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','subcontractor','HVAC','active','20000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000003','architect',null,'active','20000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','general_contractor','Tenant HVAC coordination','active','20000000-0000-4000-8000-000000000001'),
  ('80000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000004','subcontractor','Structural steel','active','20000000-0000-4000-8000-000000000005');

insert into public.project_contacts(id,organization_id,project_id,contact_id,project_company_id,project_title,is_primary_contact,is_closeout_contact,status,added_by) values
  ('90000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','Owner representative',true,true,'active','20000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000003','80000000-0000-4000-8000-000000000002','Mechanical closeout lead',false,true,'active','20000000-0000-4000-8000-000000000001'),
  ('90000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000004','80000000-0000-4000-8000-000000000005','Steel coordinator',true,false,'active','20000000-0000-4000-8000-000000000005');

-- Phase 6 fixtures: a removed company relationship for stale-reference coverage.
insert into public.companies(id,organization_id,display_name,classifications,trade,status,normalized_name,created_by) values
  ('60000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','Gone Interiors',array['subcontractor'],'Interiors','active','gone interiors','20000000-0000-4000-8000-000000000001');
insert into public.project_companies(id,organization_id,project_id,company_id,role,trade_scope,status,removed_at,added_by) values
  ('80000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000005','subcontractor','Interiors','removed',now(),'20000000-0000-4000-8000-000000000001');

-- Phase 6 requirement categories (Sample Construction Co. defaults + one for Riverside Builders).
insert into public.requirement_categories(id,organization_id,name,sort_order,is_system,created_by) values
  ('a0000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','O&M Manuals',10,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Warranties',20,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','As-Built Drawings',30,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','Permits & Inspections',40,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','Test & Commissioning Reports',50,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','Training & Demonstrations',60,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','Attic Stock & Spare Parts',70,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000008','30000000-0000-4000-8000-000000000001','Lien Waivers & Financial',80,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000009','30000000-0000-4000-8000-000000000001','General',90,true,'20000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000002','General',10,true,'20000000-0000-4000-8000-000000000005');

-- Phase 6 requirement templates: family v1 published + v2 draft, plus a tenant-B template.
insert into public.requirement_templates(id,organization_id,family_id,version,name,description,status,published_at,published_by,created_by,updated_by) values
  ('b0000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',1,'Medical Office Closeout','Sample reusable standard for medical office projects.','published',now(),'20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001',2,'Medical Office Closeout','Sample reusable standard for medical office projects.','draft',null,null,'20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000009','30000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000009',1,'Warehouse Closeout','Riverside Builders warehouse standard.','published',now(),'20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000005');

insert into public.requirement_template_items(id,organization_id,template_id,item_key,title,category_id,trade,priority,is_optional,default_responsible_role,default_due_anchor,default_due_offset_days,sort_order) values
  ('c0000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','hvac-om-manual-seed01','HVAC O&M Manual','a0000000-0000-4000-8000-000000000001','23 - HVAC','normal',false,'subcontractor','closeout_target',-14,10),
  ('c0000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','roofing-warranty-seed02','Roofing Warranty','a0000000-0000-4000-8000-000000000002','07 - Thermal & Moisture','normal',false,'subcontractor',null,null,20),
  ('c0000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','architectural-as-builts-seed03','Architectural As-Built Drawings','a0000000-0000-4000-8000-000000000003',null,'normal',false,'general_contractor',null,null,30),
  ('c0000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','certificate-of-occupancy-seed04','Certificate of Occupancy','a0000000-0000-4000-8000-000000000004',null,'high',false,'general_contractor',null,null,40),
  ('c0000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','test-balance-report-seed05','Test & Balance Report','a0000000-0000-4000-8000-000000000005','23 - HVAC','normal',false,'testing_agency',null,null,50),
  ('c0000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','attic-stock-paint-seed06','Attic Stock - Paint','a0000000-0000-4000-8000-000000000007','09 - Finishes','low',true,'subcontractor',null,null,60),
  ('c0000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','hvac-om-manual-seed01','HVAC O&M Manual','a0000000-0000-4000-8000-000000000001','23 - HVAC','normal',false,'subcontractor','closeout_target',-14,10),
  ('c0000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','roofing-warranty-seed02','Roofing Warranty','a0000000-0000-4000-8000-000000000002','07 - Thermal & Moisture','normal',false,'subcontractor',null,null,20),
  ('c0000000-0000-4000-8000-000000000013','30000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000009','warehouse-cert-seed21','Warehouse Certificate of Occupancy','a0000000-0000-4000-8000-000000000021',null,'high',false,'general_contractor',null,null,10);

-- Phase 6 project requirements on Riverside Medical Office: applied + custom rows across
-- assigned, unassigned, undated, past-planned-date, stale-reference, N/A, and archived states.
insert into public.project_requirements(id,organization_id,project_id,title,category_id,trade,priority,is_required,status,na_reason,responsible_project_company_id,responsible_project_contact_id,internal_owner_member_id,due_date,source_template_id,source_item_key,sort_order,normalized_title,created_by,archived_at,archived_by) values
  ('d0000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','HVAC O&M Manual','a0000000-0000-4000-8000-000000000001','23 - HVAC','normal',true,'active',null,'80000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000002','51000000-0000-4000-8000-000000000003','2026-09-01','b0000000-0000-4000-8000-000000000001','hvac-om-manual-seed01',10,'hvac o m manual','20000000-0000-4000-8000-000000000001',null,null),
  ('d0000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Roofing Warranty','a0000000-0000-4000-8000-000000000002','07 - Thermal & Moisture','normal',true,'active',null,'80000000-0000-4000-8000-000000000006',null,null,null,'b0000000-0000-4000-8000-000000000001','roofing-warranty-seed02',10,'roofing warranty','20000000-0000-4000-8000-000000000001',null,null),
  ('d0000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Architectural As-Built Drawings','a0000000-0000-4000-8000-000000000003',null,'normal',true,'active',null,null,null,null,'2026-07-01','b0000000-0000-4000-8000-000000000001','architectural-as-builts-seed03',10,'architectural as built drawings','20000000-0000-4000-8000-000000000001',null,null),
  ('d0000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Certificate of Occupancy','a0000000-0000-4000-8000-000000000004',null,'high',true,'not_applicable_approved','Existing shell certificate covers this tenant space.',null,null,null,null,'b0000000-0000-4000-8000-000000000001','certificate-of-occupancy-seed04',10,'certificate of occupancy','20000000-0000-4000-8000-000000000001',null,null),
  ('d0000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Test & Balance Report','a0000000-0000-4000-8000-000000000005','23 - HVAC','normal',true,'active',null,null,null,null,null,'b0000000-0000-4000-8000-000000000001','test-balance-report-seed05',10,'test balance report','20000000-0000-4000-8000-000000000001',now(),'20000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Owner Training Video','a0000000-0000-4000-8000-000000000006',null,'normal',false,'active',null,null,'90000000-0000-4000-8000-000000000002','51000000-0000-4000-8000-000000000002',null,null,null,20,'owner training video','20000000-0000-4000-8000-000000000001',null,null),
  ('d0000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000004','Warehouse Certificate of Occupancy','a0000000-0000-4000-8000-000000000021',null,'high',true,'active',null,null,null,null,'2026-12-01','b0000000-0000-4000-8000-000000000009','warehouse-cert-seed21',10,'warehouse certificate of occupancy','20000000-0000-4000-8000-000000000005',null,null);

insert into audit.audit_events(organization_id,actor_type,actor_id,project_id,target_type,target_id,action,request_id,source,metadata) values
  ('30000000-0000-4000-8000-000000000001','internal_user','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','project','50000000-0000-4000-8000-000000000001','project.created','phase-5-seed-riverside','web','{"name":"Riverside Medical Office"}'),
  ('30000000-0000-4000-8000-000000000001','internal_user','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','project_company','80000000-0000-4000-8000-000000000002','project.company_added','phase-5-seed-ace','web','{"company_id":"60000000-0000-4000-8000-000000000002","role":"subcontractor"}'),
  ('30000000-0000-4000-8000-000000000001','internal_user','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','project','b0000000-0000-4000-8000-000000000001','template.applied','phase-6-seed-apply','web','{"template_id":"b0000000-0000-4000-8000-000000000001","template_name":"Medical Office Closeout","version":1,"added_count":5,"skipped_count":0,"unassigned_count":3}');

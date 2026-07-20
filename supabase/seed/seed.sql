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
  );

insert into public.platform_roles (user_id, role)
values ('20000000-0000-4000-8000-000000000006', 'platform_admin');

update public.user_profiles
set onboarding_status = 'complete'
where id in (
  select user_id from public.organization_memberships where status = 'active'
);

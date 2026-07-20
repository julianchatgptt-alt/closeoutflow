begin;

select plan(26);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'owner-a@example.com', now(), '{"display_name":"Owner A"}'),
  ('10000000-0000-0000-0000-000000000002', 'member-a@example.com', now(), '{"display_name":"Member A"}'),
  ('10000000-0000-0000-0000-000000000003', 'tenant-b-test@example.com', now(), '{"display_name":"Owner B"}');

select is(
  (
    select count(*) from public.user_profiles
    where id::text like '10000000-0000-0000-0000-%'
  ),
  3::bigint,
  'profile trigger creates one profile per auth user'
);
select is(
  (
    select count(*) from public.user_preferences
    where user_id::text like '10000000-0000-0000-0000-%'
  ),
  3::bigint,
  'profile trigger creates one preference row per auth user'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","aal":"aal2"}',
  true
);
select lives_ok(
  $$select public.ensure_profile()$$,
  'profile fallback is idempotent'
);
select lives_ok(
  $$select public.create_organization_with_owner('Organization A')$$,
  'organization and owner membership are created atomically'
);
select is(
  (select count(*) from public.organizations where display_name = 'Organization A'),
  1::bigint,
  'organization creation inserts one organization'
);
select is(
  (
    select count(*) from public.organization_memberships membership
    join public.organizations organization on organization.id = membership.organization_id
    where organization.display_name = 'Organization A'
      and membership.role = 'owner' and membership.status = 'active'
  ),
  1::bigint,
  'organization creation inserts exactly one active owner'
);

create temporary table phase4_invitation_token as
select *
from public.create_invitation(
  (select id from public.organizations where display_name = 'Organization A'),
  'member-a@example.com',
  'viewer'
);

reset role;
select isnt(
  (select token_hash from public.organization_invitations limit 1),
  (select token from phase4_invitation_token limit 1),
  'the raw invitation token is never stored'
);
select ok(
  length((select token_hash from public.organization_invitations limit 1)) = 64,
  'the stored invitation token is a SHA-256 hex digest'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"member-a@example.com","aal":"aal2"}',
  true
);
select lives_ok(
  $$select public.accept_invitation((select token from phase4_invitation_token limit 1))$$,
  'a matching verified identity can accept the invitation'
);
select lives_ok(
  $$select public.accept_invitation((select token from phase4_invitation_token limit 1))$$,
  'repeated invitation acceptance is idempotent'
);
select is(
  (
    select count(*) from public.organization_memberships membership
    where membership.user_id = '10000000-0000-0000-0000-000000000002'
  ),
  1::bigint,
  'idempotent acceptance creates one membership'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","email":"tenant-b-test@example.com","aal":"aal2"}',
  true
);
select lives_ok(
  $$select public.create_organization_with_owner('Organization B')$$,
  'a second tenant can be created'
);
select is(
  (select count(*) from public.organizations),
  1::bigint,
  'RLS exposes only the current user organization'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.organizations),
  1::bigint,
  'organization A owner cannot read organization B'
);
select is(
  (
    select count(*) from public.organization_memberships
    where organization_id = (
      select id from public.organizations where display_name = 'Organization A'
    )
  ),
  2::bigint,
  'active members can view only their organization member list'
);
select throws_ok(
  $$
    select public.suspend_member(
      (
        select membership.id
        from public.organization_memberships membership
        where membership.user_id = '10000000-0000-0000-0000-000000000001'
      )
    )
  $$,
  '23514',
  'the organization owner cannot be suspended',
  'last-owner suspension is blocked'
);
select throws_ok(
  $$
    select public.leave_organization(
      (select id from public.organizations where display_name = 'Organization A')
    )
  $$,
  '23514',
  'transfer ownership before leaving',
  'the sole owner cannot leave'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select public.initiate_ownership_transfer(
      (select id from public.organizations where display_name = 'Organization A'),
      '10000000-0000-0000-0000-000000000002'
    )
  $$,
  '42501',
  'ownership transfer requires owner access, recent reauthentication, and AAL2',
  'AAL1 cannot initiate ownership transfer'
);

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '10000000-0000-0000-0000-000000000001',
    'email', 'owner-a@example.com',
    'aal', 'aal2',
    'auth_time', extract(epoch from now())::bigint
  )::text,
  true
);
create temporary table phase4_transfer as
select public.initiate_ownership_transfer(
  (select id from public.organizations where display_name = 'Organization A'),
  '10000000-0000-0000-0000-000000000002'
) as id;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"member-a@example.com","aal":"aal2"}',
  true
);
select lives_ok(
  $$select public.complete_ownership_transfer((select id from phase4_transfer))$$,
  'the target accepts ownership at AAL2'
);
select is(
  (
    select role from public.organization_memberships
    where user_id = '10000000-0000-0000-0000-000000000002'
  ),
  'owner',
  'ownership transfers atomically to the target'
);
select is(
  (
    select role from public.organization_memberships
    where user_id = '10000000-0000-0000-0000-000000000001'
  ),
  'administrator',
  'former owner becomes an administrator'
);
select is(
  (
    select count(*) from public.organization_memberships
    where role = 'owner' and status = 'active'
  ),
  1::bigint,
  'the organization retains exactly one active owner'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","email":"member-a@example.com","aal":"aal2"}',
  true
);
select lives_ok(
  $$
    select public.suspend_member(
      (
        select id from public.organization_memberships
        where user_id = '10000000-0000-0000-0000-000000000001'
      )
    )
  $$,
  'new owner can suspend a non-owner member'
);
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","email":"owner-a@example.com","aal":"aal2"}',
  true
);
select is(
  (select count(*) from public.organizations),
  0::bigint,
  'a suspended membership loses organization access immediately'
);
select is(
  (
    select count(*) from public.get_organization_invitations(
      (
        select organization_id from public.organization_memberships
        where user_id = '10000000-0000-0000-0000-000000000001'
        limit 1
      )
    )
  ),
  0::bigint,
  'a suspended member receives no rows from the invitation administration RPC'
);

reset role;
select is(
  (
    select count(*) from audit.audit_events
    where action in (
      'organization.created', 'membership.activated', 'invitation.created',
      'invitation.accepted', 'ownership_transfer.initiated',
      'ownership_transfer.completed', 'membership.suspended'
    )
  ),
  10::bigint,
  'sensitive workflows create immutable audit events'
);

select * from finish();
rollback;

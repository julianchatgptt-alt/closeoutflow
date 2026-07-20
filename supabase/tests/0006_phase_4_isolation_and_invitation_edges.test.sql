begin;

select plan(20);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('21000000-0000-4000-8000-000000000001', 'edge-owner-a@example.com', now(), '{"display_name":"Edge Owner A"}'),
  ('21000000-0000-4000-8000-000000000002', 'edge-member-a@example.com', now(), '{"display_name":"Edge Member A"}'),
  ('21000000-0000-4000-8000-000000000003', 'edge-wrong@example.com', now(), '{"display_name":"Wrong Invitee"}'),
  ('21000000-0000-4000-8000-000000000004', 'edge-owner-b@example.com', now(), '{"display_name":"Edge Owner B"}'),
  ('21000000-0000-4000-8000-000000000005', 'edge-revoked@example.com', now(), '{"display_name":"Revoked Invitee"}'),
  ('21000000-0000-4000-8000-000000000006', 'edge-expired@example.com', now(), '{"display_name":"Expired Invitee"}');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '21000000-0000-4000-8000-000000000001',
    'email', 'edge-owner-a@example.com',
    'aal', 'aal2',
    'auth_time', extract(epoch from now())::bigint
  )::text,
  true
);
create temporary table phase4_edge_org_a as
select public.create_organization_with_owner('Edge Organization A') as id;
select is(
  (select count(*) from phase4_edge_org_a),
  1::bigint,
  'tenant A organization is created'
);

create temporary table phase4_edge_active_invitation as
select * from public.create_invitation(
  (select id from phase4_edge_org_a),
  'edge-member-a@example.com',
  'viewer'
);
create temporary table phase4_edge_revoked_invitation as
select * from public.create_invitation(
  (select id from phase4_edge_org_a),
  'edge-revoked@example.com',
  'viewer'
);
select public.revoke_invitation(
  (select invitation_id from phase4_edge_revoked_invitation)
);
create temporary table phase4_edge_expired_invitation as
select * from public.create_invitation(
  (select id from phase4_edge_org_a),
  'edge-expired@example.com',
  'viewer'
);
create temporary table phase4_edge_duplicate_invitation as
select * from public.create_invitation(
  (select id from phase4_edge_org_a),
  'edge-duplicate@example.com',
  'viewer'
);

select throws_ok(
  $$
    select public.create_invitation(
      (select id from phase4_edge_org_a),
      'edge-duplicate@example.com',
      'viewer'
    )
  $$,
  '23505',
  null,
  'a second pending invitation for the same organization and email is rejected'
);

create temporary table phase4_edge_rotated_invitation as
select
  (select token from phase4_edge_duplicate_invitation) as old_token,
  public.resend_invitation(
    (select invitation_id from phase4_edge_duplicate_invitation)
  ) as new_token;
select is(
  (
    select count(*)
    from public.get_invitation_preview(
      (select old_token from phase4_edge_rotated_invitation)
    )
  ),
  0::bigint,
  'resending rotates and invalidates the prior invitation token'
);
select is(
  (
    select invitation_state
    from public.get_invitation_preview(
      (select new_token from phase4_edge_rotated_invitation)
    )
  ),
  'pending',
  'the rotated invitation token is pending'
);

reset role;
update public.organization_invitations
set expires_at = now() - interval '1 minute'
where id = (select invitation_id from phase4_edge_expired_invitation);
insert into public.organization_memberships (
  organization_id, user_id, role, status, joined_at
) values (
  (select id from phase4_edge_org_a),
  '21000000-0000-4000-8000-000000000002',
  'viewer',
  'active',
  now()
);
insert into public.organization_ownership_transfers (
  organization_id, from_user, to_user
) values (
  (select id from phase4_edge_org_a),
  '21000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000002'
);
insert into public.platform_roles (user_id, role)
values ('21000000-0000-4000-8000-000000000001', 'platform_admin');
insert into public.user_security_events (user_id, event_type)
values
  ('21000000-0000-4000-8000-000000000001', 'sign_in'),
  ('21000000-0000-4000-8000-000000000004', 'sign_in');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"21000000-0000-4000-8000-000000000004","email":"edge-owner-b@example.com","aal":"aal2"}',
  true
);
create temporary table phase4_edge_org_b as
select public.create_organization_with_owner('Edge Organization B') as id;
select is(
  (select count(*) from phase4_edge_org_b),
  1::bigint,
  'tenant B organization is created'
);
create temporary table phase4_edge_b_invitation as
select * from public.create_invitation(
  (select id from phase4_edge_org_b),
  'edge-b-invite@example.com',
  'viewer'
);

select is(
  (
    select count(*) from public.user_profiles
    where id in (
      '21000000-0000-4000-8000-000000000001',
      '21000000-0000-4000-8000-000000000002'
    )
  ),
  0::bigint,
  'tenant B cannot read tenant A profiles'
);
select is(
  (
    select count(*) from public.user_preferences
    where user_id = '21000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'tenant B cannot read tenant A preferences'
);
select is(
  (
    select count(*) from public.organizations
    where id = (select id from phase4_edge_org_a)
  ),
  0::bigint,
  'tenant B cannot read tenant A organization'
);
select is(
  (
    select count(*) from public.organization_memberships
    where organization_id = (select id from phase4_edge_org_a)
  ),
  0::bigint,
  'tenant B cannot read tenant A memberships'
);
select is(
  (
    select count(*) from public.organization_invitations
    where organization_id = (select id from phase4_edge_org_a)
  ),
  0::bigint,
  'tenant B cannot read tenant A invitations'
);
select is(
  (
    select count(*) from public.organization_ownership_transfers
    where organization_id = (select id from phase4_edge_org_a)
  ),
  0::bigint,
  'tenant B cannot read tenant A ownership transfers'
);
select is(
  (
    select count(*) from public.platform_roles
    where user_id = '21000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'a user cannot read another user platform role'
);
select is(
  (
    select count(*) from public.user_security_events
    where user_id = '21000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'a user cannot read another user security events'
);
select is(
  public.is_platform_admin(),
  false,
  'an organization owner does not gain a platform role'
);
select throws_ok(
  $$
    select public.create_invitation(
      (select id from phase4_edge_org_a),
      'cross-tenant@example.com',
      'viewer'
    )
  $$,
  '42501',
  'permission denied',
  'tenant B cannot create an invitation in tenant A'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"21000000-0000-4000-8000-000000000003","email":"edge-wrong@example.com","aal":"aal2"}',
  true
);
select throws_ok(
  $$select public.accept_invitation(
    (select token from phase4_edge_active_invitation)
  )$$,
  '22023',
  'invitation is no longer valid',
  'an invitation cannot be accepted by a different verified email'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"21000000-0000-4000-8000-000000000005","email":"edge-revoked@example.com","aal":"aal2"}',
  true
);
select throws_ok(
  $$select public.accept_invitation(
    (select token from phase4_edge_revoked_invitation)
  )$$,
  '22023',
  'invitation is no longer valid',
  'a revoked invitation cannot be accepted'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"21000000-0000-4000-8000-000000000006","email":"edge-expired@example.com","aal":"aal2"}',
  true
);
select throws_ok(
  $$select public.accept_invitation(
    (select token from phase4_edge_expired_invitation)
  )$$,
  '22023',
  'invitation is no longer valid',
  'an expired invitation cannot be accepted'
);

reset role;
update public.organizations
set status = 'suspended', suspended_at = now()
where id = (select id from phase4_edge_org_a);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"21000000-0000-4000-8000-000000000002","email":"edge-member-a@example.com","aal":"aal2"}',
  true
);
select throws_ok(
  $$select public.accept_invitation(
    (select token from phase4_edge_active_invitation)
  )$$,
  '22023',
  'invitation is no longer valid',
  'a suspended organization blocks invitation acceptance'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"21000000-0000-4000-8000-000000000001","email":"edge-owner-a@example.com","aal":"aal2"}',
  true
);
select throws_ok(
  $$
    select public.create_invitation(
      (select id from phase4_edge_org_a),
      'suspended-org@example.com',
      'viewer'
    )
  $$,
  '42501',
  'permission denied',
  'a suspended organization blocks invitation creation'
);

select * from finish();
rollback;

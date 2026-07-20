begin;

select plan(23);

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
values
  ('22000000-0000-4000-8000-000000000001', 'remediation-owner@example.com', now(), '{"display_name":"Owner"}'),
  ('22000000-0000-4000-8000-000000000002', 'remediation-admin@example.com', now(), '{"display_name":"Admin"}'),
  ('22000000-0000-4000-8000-000000000003', 'remediation-viewer@example.com', now(), '{"display_name":"Viewer"}'),
  ('22000000-0000-4000-8000-000000000004', 'remediation-invitee@example.com', now(), '{"display_name":"Invitee"}');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '22000000-0000-4000-8000-000000000001',
    'email', 'remediation-owner@example.com',
    'aal', 'aal2',
    'auth_time', extract(epoch from now())::bigint
  )::text,
  true
);

create temporary table phase4d_org as
select public.create_organization_with_owner('Remediation Organization') as id;

reset role;
insert into public.organization_memberships (
  organization_id, user_id, role, status, joined_at
)
values
  ((select id from phase4d_org), '22000000-0000-4000-8000-000000000002', 'administrator', 'active', now()),
  ((select id from phase4d_org), '22000000-0000-4000-8000-000000000003', 'viewer', 'active', now());

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22000000-0000-4000-8000-000000000001","email":"remediation-owner@example.com","aal":"aal2"}',
  true
);
create temporary table phase4d_pending as
select * from public.create_invitation(
  (select id from phase4d_org), 'remediation-invitee@example.com', 'viewer'
);
create temporary table phase4d_revoked as
select * from public.create_invitation(
  (select id from phase4d_org), 'revoked@example.com', 'viewer'
);
select public.revoke_invitation((select invitation_id from phase4d_revoked));
create temporary table phase4d_expired as
select * from public.create_invitation(
  (select id from phase4d_org), 'expired@example.com', 'viewer'
);
grant select on phase4d_org, phase4d_pending, phase4d_revoked, phase4d_expired
to anon, authenticated;

reset role;
update public.organization_invitations
set expires_at = now() - interval '1 minute'
where id = (select invitation_id from phase4d_expired);

select ok(
  not has_table_privilege('authenticated', 'public.organization_invitations', 'select'),
  'authenticated has no direct invitation SELECT grant'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.get_organization_invitations(uuid)',
    'execute'
  ),
  'anon cannot execute the invitation administration RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22000000-0000-4000-8000-000000000003","email":"remediation-viewer@example.com","aal":"aal1"}',
  true
);
select throws_ok(
  $$select count(*) from public.organization_invitations$$,
  '42501',
  null,
  'a non-admin active member cannot directly select invitation rows'
);
select is(
  (
    select count(*) from public.get_organization_invitations(
      (select id from phase4d_org)
    )
  ),
  0::bigint,
  'a non-admin active member receives zero rows from the invitation RPC'
);
select ok(
  public.has_org_permission((select id from phase4d_org), 'organization.view'),
  'an active viewer receives its mapped read permission'
);
select ok(
  not public.has_org_permission((select id from phase4d_org), 'membership.invite'),
  'an active viewer does not receive an admin permission'
);
select ok(
  not public.has_org_permission((select id from phase4d_org), 'unknown.permission'),
  'unknown SQL permissions fail closed'
);
select ok(
  not public.has_org_permission(
    '22000000-0000-4000-8000-000000000099',
    'organization.view'
  ),
  'a permission check for another organization fails closed'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22000000-0000-4000-8000-000000000002","email":"remediation-admin@example.com","aal":"aal1"}',
  true
);
select is(
  (
    select count(*) from public.get_organization_invitations(
      (select id from phase4d_org)
    )
  ),
  1::bigint,
  'an authorized administrator can list pending invitations'
);
select is(
  (
    select email from public.get_organization_invitations(
      (select id from phase4d_org)
    )
  ),
  'remediation-invitee@example.com',
  'the authorized administration RPC can return the full delivery address'
);

set local role anon;
select isnt(
  (
    select invitation_email from public.get_invitation_preview(
      (select token from phase4d_pending)
    )
  ),
  'remediation-invitee@example.com',
  'the public preview never returns the full invitation email'
);
select ok(
  (
    select invitation_email from public.get_invitation_preview(
      (select token from phase4d_pending)
    )
  ) like 'r%@example.com',
  'the public preview returns only a masked delivery hint'
);
select is(
  (select count(*) from public.get_invitation_preview(repeat('x', 48))),
  0::bigint,
  'an invalid token has the same unavailable zero-row shape'
);
select is(
  (
    select count(*) from public.get_invitation_preview(
      (select token from phase4d_revoked)
    )
  ),
  0::bigint,
  'a revoked token has the generic unavailable shape'
);
select is(
  (
    select count(*) from public.get_invitation_preview(
      (select token from phase4d_expired)
    )
  ),
  0::bigint,
  'an expired token has the generic unavailable shape'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '22000000-0000-4000-8000-000000000004',
    'email', 'remediation-invitee@example.com',
    'aal', 'aal1',
    'auth_time', extract(epoch from now())::bigint
  )::text,
  true
);
select is(
  (
    select count(*) from public.accept_invitation(
      (select token from phase4d_pending)
    )
  ),
  1::bigint,
  'exact email matching remains enforced inside invitation acceptance'
);
set local role anon;
select is(
  (
    select count(*) from public.get_invitation_preview(
      (select token from phase4d_pending)
    )
  ),
  0::bigint,
  'an accepted token has the generic unavailable shape'
);

reset role;
select set_config(
  'request.headers',
  '{"x-closeout-request-id":"123e4567-e89b-42d3-a456-426614174000"}',
  true
);
select public.write_audit_event(
  'system', 'phase4d_probe', 'phase4d.request_correlated',
  'caller-value', 'web'
);
select is(
  (
    select request_id from audit.audit_events
    where action = 'phase4d.request_correlated'
    order by occurred_at desc limit 1
  ),
  '123e4567-e89b-42d3-a456-426614174000',
  'audit events reuse the validated application-boundary request ID'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '22000000-0000-4000-8000-000000000004',
    'email', 'remediation-invitee@example.com',
    'aal', 'aal2',
    'auth_time', extract(epoch from now())::bigint
  )::text,
  true
);
create temporary table phase4d_fresh_event as
select public.record_identity_event(
  'auth.mfa_removed',
  '{"actor":{"reauthenticated":false}}'::jsonb
) as id;
reset role;
select is(
  (
    select metadata #>> '{actor,reauthenticated}'
    from audit.audit_events
    where id = (select id from phase4d_fresh_event)
  ),
  'true',
  'fresh verified auth_time overwrites a client actor flag in audit metadata'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '22000000-0000-4000-8000-000000000004',
    'email', 'remediation-invitee@example.com',
    'aal', 'aal2',
    'auth_time', extract(epoch from now() - interval '1 hour')::bigint
  )::text,
  true
);
create temporary table phase4d_stale_event as
select public.record_identity_event(
  'auth.mfa_removed',
  '{"actor":{"reauthenticated":true}}'::jsonb
) as id;
reset role;
select is(
  (
    select metadata #>> '{actor,reauthenticated}'
    from audit.audit_events
    where id = (select id from phase4d_stale_event)
  ),
  'false',
  'stale verified auth_time cannot be upgraded by client audit metadata'
);

reset role;
insert into public.organization_ownership_transfers (
  organization_id, from_user, to_user
)
values (
  (select id from phase4d_org),
  '22000000-0000-4000-8000-000000000001',
  '22000000-0000-4000-8000-000000000004'
);
select throws_ok(
  $$
    insert into public.organization_ownership_transfers (
      organization_id, from_user, to_user
    )
    values (
      (select id from phase4d_org),
      '22000000-0000-4000-8000-000000000001',
      '22000000-0000-4000-8000-000000000003'
    )
  $$,
  '23505',
  null,
  'a competing pending ownership transfer is rejected by the database'
);

update public.organization_memberships
set status = 'suspended', suspended_at = now()
where organization_id = (select id from phase4d_org)
  and user_id = '22000000-0000-4000-8000-000000000003';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"22000000-0000-4000-8000-000000000003","email":"remediation-viewer@example.com","aal":"aal1"}',
  true
);
select ok(
  not public.has_org_permission((select id from phase4d_org), 'organization.view'),
  'a suspended membership receives no SQL permissions'
);

reset role;
insert into public.organization_invitations (
  organization_id, email, role, token_hash, invited_by, expires_at
)
values (
  (select id from phase4d_org),
  'suspended-preview@example.com',
  'viewer',
  pg_catalog.encode(extensions.digest(repeat('s', 48), 'sha256'), 'hex'),
  '22000000-0000-4000-8000-000000000001',
  now() + interval '1 day'
);
update public.organizations
set status = 'suspended', suspended_at = now()
where id = (select id from phase4d_org);
set local role anon;
select is(
  (
    select count(*) from public.get_invitation_preview(
      repeat('s', 48)
    )
  ),
  0::bigint,
  'a suspended organization never exposes invitation preview state'
);

select * from finish();
rollback;

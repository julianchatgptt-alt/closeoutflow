begin;

select plan(10);

insert into auth.users (id, email, email_confirmed_at)
values ('10000000-0000-0000-0000-000000000010', 'security-test@example.com', now());

set local role authenticated;
select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', '10000000-0000-0000-0000-000000000010',
    'email', 'security-test@example.com',
    'aal', 'aal2',
    'auth_time', extract(epoch from now())::bigint
  )::text,
  true
);

select lives_ok(
  $$
    select public.replace_recovery_code_hashes(
      array[
        '0123456789abcdef0123456789abcdef:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'fedcba9876543210fedcba9876543210:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
      ]
    )
  $$,
  'AAL2 can rotate recovery-code hashes'
);
select is(
  (select cardinality(recovery_codes_hash) from public.user_profiles
    where id = '10000000-0000-0000-0000-000000000010'),
  2,
  'only recovery hashes are persisted'
);
select ok(
  (select recovery_codes_hash::text not like '%COF-%' from public.user_profiles
    where id = '10000000-0000-0000-0000-000000000010'),
  'raw recovery codes are absent from storage'
);
select is(
  public.consume_recovery_code_hash(
    '0123456789abcdef0123456789abcdef:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  true,
  'a matching recovery hash is consumed once'
);
select is(
  public.consume_recovery_code_hash(
    '0123456789abcdef0123456789abcdef:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  false,
  'a consumed recovery hash cannot be reused'
);
select is(
  (select count(*) from public.user_security_events where event_type = 'recovery_used'),
  1::bigint,
  'recovery use creates a distinct user security event'
);
select throws_ok(
  $$select public.record_identity_event(
    'auth.mfa_enrolled', '{"nested":{"recovery_code":"never"}}'::jsonb
  )$$,
  '22023',
  'unsafe identity event metadata',
  'identity audit metadata rejects secrets recursively'
);
select lives_ok(
  $$select public.record_identity_event(
    'auth.mfa_enrolled', '{"factor_type":"totp"}'::jsonb
  )$$,
  'safe MFA audit metadata is accepted'
);
select lives_ok(
  $$select public.request_account_deletion('DELETE')$$,
  'a recently verified non-owner can request account deletion'
);
select is(
  (select account_status from public.user_profiles
    where id = '10000000-0000-0000-0000-000000000010'),
  'deleted',
  'account deletion request anonymizes and blocks the profile'
);

select * from finish();
rollback;

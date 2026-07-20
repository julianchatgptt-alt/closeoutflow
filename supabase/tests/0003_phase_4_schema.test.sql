begin;

select plan(52);

select has_extension('citext', 'citext supports case-insensitive invitation email');
select has_table('public', 'user_profiles', 'profiles table exists');
select has_table('public', 'user_preferences', 'preferences table exists');
select has_table('public', 'organizations', 'organizations table exists');
select has_table('public', 'organization_memberships', 'memberships table exists');
select has_table('public', 'organization_invitations', 'invitations table exists');
select has_table(
  'public', 'organization_ownership_transfers', 'ownership transfers table exists'
);
select has_table('public', 'platform_roles', 'platform roles table exists');
select has_table('public', 'user_security_events', 'security events table exists');

select has_function('public', 'ensure_profile', array[]::name[], 'ensure profile exists');
select has_function(
  'public', 'create_organization_with_owner', array['text']::name[],
  'atomic organization creation exists'
);
select has_function(
  'public', 'accept_invitation', array['text']::name[],
  'transactional invitation acceptance exists'
);
select has_function(
  'public', 'complete_ownership_transfer', array['uuid']::name[],
  'atomic ownership acceptance exists'
);
select has_function(
  'public', 'has_org_permission', array['uuid','text']::name[],
  'database permission evaluator exists'
);
select has_function(
  'public', 'get_organization_members', array['uuid']::name[],
  'authorized organization member directory exists'
);
select has_function(
  'public', 'get_invitation_preview', array['text']::name[],
  'non-enumerable invitation preview exists'
);
select has_function(
  'public', 'update_organization_identity', array['uuid','text','text','text']::name[],
  'audited organization settings workflow exists'
);
select has_function(
  'public', 'archive_organization', array['uuid']::name[],
  'organization archive workflow exists'
);
select has_function(
  'public', 'request_organization_deletion', array['uuid','text']::name[],
  'organization deletion request workflow exists'
);
select has_function(
  'public', 'cancel_organization_deletion', array['uuid']::name[],
  'organization deletion cancellation workflow exists'
);
select has_function(
  'public', 'record_identity_event', array['text','jsonb']::name[],
  'identity audit and security event workflow exists'
);
select has_function(
  'public', 'replace_recovery_code_hashes', array['text[]']::name[],
  'AAL2 recovery-code rotation workflow exists'
);
select has_function(
  'public', 'consume_recovery_code_hash', array['text']::name[],
  'one-time recovery-code consumption workflow exists'
);
select has_function(
  'public', 'platform_get_security_events', array['text','integer']::name[],
  'audited platform security event viewer exists'
);
select has_function(
  'public', 'request_account_deletion', array['text']::name[],
  'owner-safe account deletion request exists'
);
select has_trigger(
  'auth', 'users', 'on_auth_user_created', 'auth user creation provisions a profile'
);

select is(
  (
    select count(*)
    from pg_class table_definition
    join pg_namespace schema_definition on schema_definition.oid = table_definition.relnamespace
    where schema_definition.nspname = 'public'
      and table_definition.relname in (
        'user_profiles', 'user_preferences', 'organizations',
        'organization_memberships', 'organization_invitations',
        'organization_ownership_transfers', 'platform_roles', 'user_security_events'
      )
      and table_definition.relrowsecurity
      and table_definition.relforcerowsecurity
  ),
  8::bigint,
  'every Phase 4 table enables and forces RLS'
);

select ok(
  not has_function_privilege('anon', 'public.ensure_profile()', 'EXECUTE'),
  'anonymous users cannot ensure a profile'
);
select ok(
  has_function_privilege('authenticated', 'public.ensure_profile()', 'EXECUTE'),
  'authenticated users can invoke the profile fallback'
);
select ok(
  not has_function_privilege(
    'anon', 'public.create_organization_with_owner(text)', 'EXECUTE'
  ),
  'anonymous users cannot create organizations'
);
select ok(
  not has_function_privilege('anon', 'public.accept_invitation(text)', 'EXECUTE'),
  'anonymous users cannot accept invitations'
);
select ok(
  not has_function_privilege(
    'authenticated', 'public.record_user_security_event(uuid,text,inet,text,jsonb)', 'EXECUTE'
  ),
  'normal users cannot forge security events'
);

select is(
  (
    select count(*)
    from pg_proc function_definition
    join pg_namespace schema_definition on schema_definition.oid = function_definition.pronamespace
    where schema_definition.nspname = 'public'
      and function_definition.proname in (
        'handle_new_user', 'ensure_profile', 'is_org_member', 'has_org_role',
        'has_org_permission', 'get_organization_members',
        'create_invitation', 'accept_invitation', 'get_invitation_preview',
        'revoke_invitation', 'resend_invitation', 'create_organization_with_owner',
        'change_member_role', 'suspend_member', 'reactivate_member', 'remove_member',
        'leave_organization', 'initiate_ownership_transfer',
        'complete_ownership_transfer', 'cancel_ownership_transfer',
        'update_organization_identity', 'archive_organization',
        'request_organization_deletion', 'cancel_organization_deletion',
        'is_platform_admin', 'is_platform_support', 'record_user_security_event',
        'record_identity_event', 'replace_recovery_code_hashes',
        'consume_recovery_code_hash', 'request_account_deletion',
        'get_organization_audit', 'platform_suspend_organization',
        'platform_suspend_user', 'platform_get_security_events'
      )
      and function_definition.prosecdef
      and array_to_string(function_definition.proconfig, ',') = 'search_path=""'
  ),
  35::bigint,
  'every Phase 4 definer function has an empty fixed search path'
);

select col_is_unique(
  'public', 'organization_memberships', array['organization_id','user_id'],
  'one membership exists per user and organization'
);
select col_is_unique(
  'public', 'organization_invitations', 'token_hash',
  'invitation token hashes are unique'
);
select col_is_unique(
  'public', 'organizations', 'slug', 'organization slugs are unique'
);
select fk_ok(
  'public', 'organization_memberships', 'organization_id',
  'public', 'organizations', 'id',
  'membership belongs to an organization'
);
select fk_ok(
  'public', 'organization_memberships', 'user_id',
  'auth', 'users', 'id',
  'membership belongs to an auth user'
);

select table_privs_are(
  'public', 'organization_invitations', 'anon', array[]::text[],
  'anonymous users cannot enumerate invitations'
);
select table_privs_are(
  'public', 'organization_ownership_transfers', 'anon', array[]::text[],
  'anonymous users cannot enumerate ownership transfers'
);
select table_privs_are(
  'public', 'platform_roles', 'anon', array[]::text[],
  'anonymous users cannot enumerate platform roles'
);
select table_privs_are(
  'public', 'user_security_events', 'anon', array[]::text[],
  'anonymous users cannot enumerate security events'
);

select is(
  public.has_org_permission(gen_random_uuid(), 'unknown.permission'),
  false,
  'database authorization denies unknown permissions'
);
select is(
  public.slugify('  Riverside Medical Office  '),
  'riverside-medical-office',
  'organization slug generation is deterministic'
);
select is(
  public.slugify('***'),
  '',
  'invalid slug input fails closed to an empty value'
);

select ok(
  has_column_privilege('authenticated', 'public.user_profiles', 'display_name', 'UPDATE'),
  'authenticated users may update their own profile identity columns'
);
select ok(
  not has_column_privilege(
    'authenticated', 'public.user_profiles', 'recovery_codes_hash', 'UPDATE'
  ),
  'authenticated users cannot directly replace recovery-code hashes'
);
select ok(
  not has_column_privilege(
    'authenticated', 'public.user_profiles', 'account_status', 'UPDATE'
  ),
  'authenticated users cannot directly change account status'
);
select ok(
  has_column_privilege(
    'authenticated', 'public.organization_memberships', 'job_title', 'UPDATE'
  ),
  'authenticated users may update their own membership job title'
);
select ok(
  not has_column_privilege(
    'authenticated', 'public.organization_memberships', 'role', 'UPDATE'
  ),
  'authenticated users cannot directly change membership roles'
);
select ok(
  not has_table_privilege('authenticated', 'public.organizations', 'UPDATE'),
  'organization changes must use audited workflow functions'
);
select is(
  (
    select count(*)
    from information_schema.role_table_grants
    where grantee = 'authenticated'
      and table_schema = 'public'
      and table_name in (
        'user_profiles', 'user_preferences', 'organizations',
        'organization_memberships', 'organization_invitations',
        'organization_ownership_transfers', 'platform_roles', 'user_security_events'
      )
      and privilege_type in ('INSERT', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  ),
  0::bigint,
  'authenticated users have no broad write or destructive grants on Phase 4 tables'
);

select * from finish();
rollback;

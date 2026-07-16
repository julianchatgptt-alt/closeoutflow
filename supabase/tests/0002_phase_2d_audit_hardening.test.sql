begin;

select plan(12);

select has_trigger(
  'audit',
  'audit_events',
  'audit_events_immutable_truncate',
  'audit table has a truncate guard'
);

select throws_ok(
  $$truncate audit.audit_events$$,
  'P0001',
  'audit events are immutable',
  'audit rows cannot be truncated'
);

select table_privs_are(
  'audit',
  'audit_events',
  'anon',
  array[]::text[],
  'anonymous users have no direct audit table privileges'
);

select table_privs_are(
  'audit',
  'audit_events',
  'authenticated',
  array[]::text[],
  'authenticated users have no direct audit table privileges'
);

select ok(
  has_function_privilege('service_role', 'public.database_health_check()', 'EXECUTE'),
  'service role can execute the database health probe'
);

select ok(
  not has_function_privilege('anon', 'public.database_health_check()', 'EXECUTE'),
  'anonymous users cannot execute the database health probe'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.write_audit_event(text,text,text,text,text,uuid,uuid,uuid,uuid,jsonb,jsonb,text,inet,text,jsonb)',
    'EXECUTE'
  ),
  'anonymous users cannot execute the audit writer'
);

select lives_ok(
  $$
    set local role service_role;
    select public.write_audit_event(
      'system',
      'system',
      'system.foundation_verified',
      'pgtap-audit-rpc',
      'api',
      p_metadata => '{}'::jsonb
    );
    reset role;
  $$,
  'service role can write through the public audit RPC'
);

select is(
  (
    select count(*)
    from audit.audit_events
    where request_id = 'pgtap-audit-rpc'
  ),
  1::bigint,
  'audit RPC appends exactly one immutable event'
);

insert into audit.audit_events (
  actor_type,
  target_type,
  action,
  request_id,
  source
) values (
  'system',
  'system',
  'system.foundation_verified',
  'pgtap-health-isolation',
  'api'
);

select is(
  public.database_health_check(),
  true,
  'database health probe reports reachability'
);

select is(
  public.database_health_check(),
  true,
  'repeated database health probe reports reachability'
);

select is(
  (
    select count(*)
    from audit.audit_events
    where request_id = 'pgtap-health-isolation'
  ),
  1::bigint,
  'repeated health probes do not append audit events'
);

select * from finish();
rollback;

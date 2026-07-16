begin;

select plan(4);

select has_schema('audit', 'audit schema exists');
select has_function('public', 'set_updated_at', array[]::name[], 'updated-at helper exists');
select has_table('audit', 'audit_events', 'audit event table exists');
select table_privs_are(
  'audit',
  'audit_events',
  'authenticated',
  array[]::text[],
  'authenticated users have no direct audit table privileges'
);

select * from finish();
rollback;

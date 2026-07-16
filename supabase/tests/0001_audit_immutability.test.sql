begin;

select plan(2);

insert into audit.audit_events (
  actor_type,
  target_type,
  action,
  request_id,
  source
) values (
  'system',
  'system',
  'system.health_checked',
  'pgtap',
  'api'
);

select throws_ok(
  $$update audit.audit_events set action = 'tampered' where request_id = 'pgtap'$$,
  'P0001',
  'audit events are immutable',
  'audit rows cannot be updated'
);

select throws_ok(
  $$delete from audit.audit_events where request_id = 'pgtap'$$,
  'P0001',
  'audit events are immutable',
  'audit rows cannot be deleted'
);

select * from finish();
rollback;

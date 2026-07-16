-- Infrastructure-only immutable audit seam. This is not a business-feature table.
create table audit.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  organization_id uuid,
  actor_type text not null check (
    actor_type in ('internal_user', 'external_grant', 'platform_admin', 'system')
  ),
  actor_id uuid,
  project_id uuid,
  target_type text not null,
  target_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  request_id text not null,
  session_id text,
  ip inet,
  user_agent text,
  source text not null check (source in ('web', 'worker', 'api')),
  metadata jsonb not null default '{}'::jsonb
);

alter table audit.audit_events enable row level security;
alter table audit.audit_events force row level security;

revoke all on audit.audit_events from public, anon, authenticated;
grant insert, select on audit.audit_events to service_role;

create or replace function audit.reject_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'audit events are immutable' using errcode = 'P0001';
end;
$$;

create trigger audit_events_immutable
before update or delete on audit.audit_events
for each row execute function audit.reject_audit_mutation();

comment on table audit.audit_events is
  'Append-only legal/compliance events. Separate from application logs and analytics.';

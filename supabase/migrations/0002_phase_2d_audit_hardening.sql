-- Phase 2D audit remediation. Keep the legal audit store immutable and off PostgREST.
create trigger audit_events_immutable_truncate
before truncate on audit.audit_events
for each statement execute function audit.reject_audit_mutation();

create or replace function public.write_audit_event(
  p_actor_type text,
  p_target_type text,
  p_action text,
  p_request_id text,
  p_source text,
  p_organization_id uuid default null,
  p_actor_id uuid default null,
  p_project_id uuid default null,
  p_target_id uuid default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_session_id text default null,
  p_ip inet default null,
  p_user_agent text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
begin
  insert into audit.audit_events (
    organization_id,
    actor_type,
    actor_id,
    project_id,
    target_type,
    target_id,
    action,
    before,
    after,
    request_id,
    session_id,
    ip,
    user_agent,
    source,
    metadata
  ) values (
    p_organization_id,
    p_actor_type,
    p_actor_id,
    p_project_id,
    p_target_type,
    p_target_id,
    p_action,
    p_before,
    p_after,
    p_request_id,
    p_session_id,
    p_ip,
    p_user_agent,
    p_source,
    p_metadata
  )
  returning id into event_id;

  return event_id;
end;
$$;

revoke all on function public.write_audit_event(
  text, text, text, text, text, uuid, uuid, uuid, uuid, jsonb, jsonb, text, inet, text, jsonb
) from public, anon, authenticated;
grant execute on function public.write_audit_event(
  text, text, text, text, text, uuid, uuid, uuid, uuid, jsonb, jsonb, text, inet, text, jsonb
) to service_role;

comment on function public.write_audit_event(
  text, text, text, text, text, uuid, uuid, uuid, uuid, jsonb, jsonb, text, inet, text, jsonb
) is 'Service-role-only RPC for append-only audit writes without exposing the audit schema through PostgREST.';

create or replace function public.database_health_check()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select true;
$$;

revoke all on function public.database_health_check() from public, anon, authenticated;
grant execute on function public.database_health_check() to service_role;

comment on function public.database_health_check() is
  'Service-role-only, read-only reachability probe. It must never write audit or operational records.';

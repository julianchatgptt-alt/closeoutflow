-- Phase 4D authentication and tenant-security remediation.
--
-- Invitation rows are no longer directly readable through PostgREST. Privileged
-- reads go through a narrow SECURITY DEFINER function, while the public preview
-- discloses only a masked delivery hint for a currently usable invitation.

revoke select on public.organization_invitations from authenticated;

create or replace function public.get_organization_invitations(
  target_organization_id uuid
)
returns table (
  id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    invitation.id,
    invitation.email::text,
    invitation.role,
    invitation.status,
    invitation.expires_at,
    invitation.created_at
  from public.organization_invitations invitation
  join public.organizations organization
    on organization.id = invitation.organization_id
  where invitation.organization_id = target_organization_id
    and invitation.status = 'pending'
    and invitation.expires_at > now()
    and organization.status = 'active'
    and public.has_org_permission(
      invitation.organization_id,
      'membership.invite'
    )
  order by invitation.created_at desc;
$$;

revoke all on function public.get_organization_invitations(uuid)
from public, anon;
grant execute on function public.get_organization_invitations(uuid)
to authenticated;

comment on function public.get_organization_invitations(uuid) is
  'Returns pending invitations only to active members with membership.invite; invitation table SELECT remains unavailable to authenticated.';

create or replace function public.get_invitation_preview(raw_token text)
returns table (
  organization_name text,
  invitation_email text,
  invitation_role text,
  invitation_state text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    organization.display_name,
    case
      when pg_catalog.strpos(invitation.email::text, '@') > 2 then
        pg_catalog.left(
          pg_catalog.split_part(invitation.email::text, '@', 1),
          1
        )
        || repeat(
          '*',
          least(
            greatest(
              length(pg_catalog.split_part(invitation.email::text, '@', 1)) - 1,
              3
            ),
            8
          )
        )
        || '@'
        || pg_catalog.split_part(invitation.email::text, '@', 2)
      else
        '***@' || pg_catalog.split_part(invitation.email::text, '@', 2)
    end,
    invitation.role,
    'pending'::text
  from public.organization_invitations invitation
  join public.organizations organization
    on organization.id = invitation.organization_id
  where length(coalesce(raw_token, '')) >= 32
    and invitation.token_hash = pg_catalog.encode(
      extensions.digest(raw_token, 'sha256'),
      'hex'
    )
    and invitation.status = 'pending'
    and invitation.expires_at > now()
    and organization.status = 'active'
  limit 1;
$$;

revoke all on function public.get_invitation_preview(text) from public;
grant execute on function public.get_invitation_preview(text)
to anon, authenticated;

comment on function public.get_invitation_preview(text) is
  'Non-enumerable public invitation preview. Returns only active pending invitations and masks the destination email; exact email matching remains inside accept_invitation.';

-- Correlate database audit writes with the request ID generated and overwritten
-- at the application boundary. A direct caller-supplied ID remains a fallback
-- only and is never used for authentication or authorization.
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
  request_headers jsonb := '{}'::jsonb;
  boundary_request_id text;
  effective_request_id text;
begin
  begin
    request_headers := coalesce(
      nullif(current_setting('request.headers', true), '')::jsonb,
      '{}'::jsonb
    );
  exception
    when others then
      request_headers := '{}'::jsonb;
  end;

  boundary_request_id := request_headers ->> 'x-closeout-request-id';

  if boundary_request_id ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    effective_request_id := boundary_request_id;
  elsif p_request_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$' then
    effective_request_id := p_request_id;
  else
    effective_request_id := gen_random_uuid()::text;
  end if;

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
    effective_request_id,
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
) is
  'Service-role-only append-only audit writer. Prefers the validated request ID overwritten by the application boundary and never uses correlation data for authorization.';

-- Recovery hashes are versioned so existing v1 hashes remain consumable while
-- every newly issued code uses the application-side purpose-specific HMAC.
create or replace function public.replace_recovery_code_hashes(target_hashes text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null
    or coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    or cardinality(target_hashes) not between 1 and 10
    or exists (
      select 1 from unnest(target_hashes) hash
      where hash !~ '^v2:[a-f0-9]{32}:[a-f0-9]{64}$'
    )
  then
    raise exception 'AAL2 and valid versioned recovery hashes are required'
      using errcode = '42501';
  end if;
  update public.user_profiles
  set recovery_codes_hash = target_hashes
  where id = auth.uid();
end;
$$;

create or replace function public.consume_recovery_code_hash(target_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed boolean;
begin
  if auth.uid() is null
    or target_hash !~ '^(v2:)?[a-f0-9]{32}:[a-f0-9]{64}$'
  then
    return false;
  end if;
  update public.user_profiles
  set recovery_codes_hash = array_remove(recovery_codes_hash, target_hash)
  where id = auth.uid() and target_hash = any(recovery_codes_hash);
  consumed := found;
  if consumed then
    insert into public.user_security_events (user_id, event_type)
    values (auth.uid(), 'recovery_used');
    perform public.write_audit_event(
      'internal_user', 'user', 'auth.recovery_code_used',
      gen_random_uuid()::text, 'web', null, auth.uid(), null, auth.uid()
    );
  end if;
  return consumed;
end;
$$;

revoke all on function public.replace_recovery_code_hashes(text[])
from public, anon;
revoke all on function public.consume_recovery_code_hash(text)
from public, anon;
grant execute on function public.replace_recovery_code_hashes(text[])
to authenticated;
grant execute on function public.consume_recovery_code_hash(text)
to authenticated;

-- The database derives and overwrites actor.reauthenticated from verified JWT
-- claims for every identity event. Client metadata cannot claim freshness.
create or replace function public.record_identity_event(
  target_action text,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  event_id uuid;
  security_type text;
  authenticated_at bigint :=
    coalesce((auth.jwt() ->> 'auth_time')::bigint, 0);
  verified_metadata jsonb;
begin
  if actor_id is null or target_action not in (
    'auth.registered', 'auth.email_verified', 'auth.signed_in',
    'auth.signed_out', 'auth.password_reset_requested', 'auth.password_changed',
    'auth.email_changed', 'auth.mfa_enrolled', 'auth.mfa_removed',
    'auth.session_revoked', 'profile.updated'
  ) then
    raise exception 'identity event is not permitted' using errcode = '42501';
  end if;
  if length(target_metadata::text) > 4096
    or target_metadata::text ~*
      '"[^"]*(password|token|secret|recovery.?code|session)[^"]*"'
  then
    raise exception 'unsafe identity event metadata' using errcode = '22023';
  end if;

  verified_metadata := target_metadata
    || jsonb_build_object(
      'actor',
      jsonb_build_object(
        'reauthenticated',
        authenticated_at >=
          extract(epoch from now() - interval '15 minutes')::bigint
      )
    );

  event_id := public.write_audit_event(
    'internal_user',
    case when target_action = 'profile.updated' then 'user_profile' else 'user' end,
    target_action,
    gen_random_uuid()::text,
    'web',
    null,
    actor_id,
    null,
    actor_id,
    null,
    null,
    null,
    null,
    null,
    verified_metadata
  );

  security_type := case target_action
    when 'auth.signed_in' then 'sign_in'
    when 'auth.password_changed' then 'password_changed'
    when 'auth.email_changed' then 'email_changed'
    when 'auth.mfa_enrolled' then 'mfa_enrolled'
    when 'auth.mfa_removed' then 'mfa_removed'
    when 'auth.session_revoked' then 'session_revoked'
    else null
  end;
  if security_type is not null then
    insert into public.user_security_events (user_id, event_type, metadata)
    values (actor_id, security_type, verified_metadata);
  end if;
  return event_id;
end;
$$;

revoke all on function public.record_identity_event(text, jsonb)
from public, anon;
grant execute on function public.record_identity_event(text, jsonb)
to authenticated;

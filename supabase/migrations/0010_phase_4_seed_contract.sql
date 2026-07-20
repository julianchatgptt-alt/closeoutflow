-- Phase 4 seed contract.
-- Deterministic local identities are created by supabase/seed/seed.sql so this
-- append-only migration remains safe in every environment.

comment on table public.organization_memberships is
  'Authoritative organization access. One retained lifecycle row per user and organization.';
comment on table public.organization_invitations is
  'Hashed, expiring, revocable, single-use organization invitations.';
comment on table public.user_security_events is
  'User-facing security activity; distinct from immutable audit events and operational logs.';

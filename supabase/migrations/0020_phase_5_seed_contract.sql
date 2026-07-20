-- Phase 5 deterministic local seed contract.
-- Fake project/directory fixtures remain in supabase/seed/seed.sql so this
-- append-only migration is safe in staging and production.
comment on table public.projects is
  'Construction project container. Phase 5 stores identity, lifecycle, setup relationships, and no requirement/document data.';
comment on table public.companies is
  'Reusable organization-scoped external company directory.';
comment on table public.contacts is
  'Reusable external contact records; these are never authentication users in Phase 5.';
comment on table public.project_companies is
  'Project-specific company role; company classifications are directory hints only.';
comment on table public.project_contacts is
  'External contact participation. Reserved future responsibility flags do not grant portal access.';

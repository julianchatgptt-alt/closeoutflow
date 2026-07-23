-- Phase 6 deterministic local seed contract.
-- Fake requirement/template fixtures live in supabase/seed/seed.sql so this
-- append-only migration is safe in staging and production.
comment on column public.project_requirements.status is
  'Phase 6 stored lifecycle: active or not_applicable_approved only. Assignment completeness, missing dates, planned-date-passed, and stale references are derived, never stored. Later phases append operational statuses from active without renames.';
comment on column public.project_requirements.archived_at is
  'Independent soft archival; archiving and restoring never change the stored lifecycle status.';
comment on column public.project_requirements.record_type is
  'Reserved for Phase 12 specialized records; always null and never surfaced in Phase 6.';
comment on column public.requirement_templates.family_id is
  'Template family identifier: all versions of one template share it; the highest published version is the current version.';
comment on column public.requirement_template_items.item_key is
  'Family-stable key powering idempotent template application and additive newer-version merges.';

-- Contract self-check: the apply-idempotency partial unique index must exist.
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'project_requirements_source_key_unique'
  ) then
    raise exception 'phase 6 seed contract: apply idempotency index is missing';
  end if;
end $$;

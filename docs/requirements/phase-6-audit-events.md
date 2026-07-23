# FILE: /docs/requirements/phase-6-audit-events.md

> **Document status:** Phase 6A specification — Phase 6 audit catalog. **Specification only.**
> **Grounding:** events written via the service-role-only `write_audit_event` into immutable `audit.audit_events` (Phase 2/4/5 pattern). All Phase 6 events are **blocking** (in-transaction; failure rolls back), actor `internal_user`, `source='web'`, severity `notice`/`info`, standard long-term retention, real observability `request_id`. Project-scoped events set `project_id` and therefore flow into the existing `get_project_activity` view automatically — **no new event system**.
> **Metadata safety (inherited):** ids + short labels + changed-field keys only; `before`/`after` for low-sensitivity enums (status, priority, category label, dates); **never** full descriptions/notes bodies, contact email/phone values, or free-text N-A reasons beyond a truncated label (≤ 80 chars). A per-event redaction whitelist is enforced function-side and tested.

---

## 1. Template & category events (org-scoped; `project_id` null)

| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `template.created` | create_requirement_template | template | `name`,`family_id`,`version` | description body | "{actor} created template {name}" |
| `template.updated` | update_requirement_template / save_template_items | template | `changed_fields[]` or `items_changed{added,updated,removed,reordered}` counts | item description bodies | "{actor} updated template {name}" |
| `template.published` | publish_requirement_template | template | `version`,`item_count` | — | "{actor} published {name} v{version}" |
| `template.version_created` | create_template_version | template (new row) | `from_version`,`to_version` | — | "{actor} started v{version} of {name}" |
| `template.cloned` | clone_requirement_template | template (new family) | `source_template_id`,`name` | — | "{actor} duplicated {source} as {name}" |
| `template.archived` / `template.restored` | archive/restore | template family | `family_id` | — | "{actor} archived/restored {name}" |
| `requirement_category.created` | create_requirement_category | category | `name` | — | "{actor} added category {name}" |
| `requirement_category.updated` | update/reorder | category | `changed_fields[]` (`renamed_from` when renaming) | — | "{actor} updated category {name}" |
| `requirement_category.archived` / `.restored` | archive/restore | category | `name` | — | "{actor} archived/restored category {name}" |

Template events do **not** appear in project activity (org-level); a later org-audit surface can render them. `ensure_requirement_defaults` writes `template.created`/`requirement_category.created` once on first seeding (attributed to the invoking user), and nothing on idempotent no-ops.

## 2. Template application (project-scoped)

| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `template.applied` | apply_requirement_template | project | `template_id`,`template_name`,`version`,`added_count`,`skipped_count`,`unassigned_count` | full item list bodies | "{actor} applied {template} v{n} — {added} requirements added" |

One event per apply, not per row (the created rows are traceable via provenance columns; per-row `requirement.created` events are **suppressed** during apply to avoid drowning the activity feed).

## 3. Requirement events (project-scoped; all set `project_id`)

| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `requirement.created` | create_project_requirement | requirement | `title` (≤80) | description/notes | "{actor} added requirement {title}" |
| `requirement.updated` | update_project_requirement (non-special fields) | requirement | `changed_fields[]` | field values for free text | "{actor} updated {title}" |
| `requirement.responsibility_changed` | update (responsibility fields) | requirement | changed slot(s): `company{from,to}`/`contact{from,to}`/`owner{from,to}` as ids + display labels | contact email/phone | "{actor} assigned {title} to {company}" / "…changed the internal owner" |
| `requirement.due_date_changed` | update (due_date) | requirement | `from`,`to` (dates or null) | — | "{actor} set the due date for {title} to {date}" |
| `requirement.marked_not_applicable` | mark_requirement_not_applicable | requirement | `reason_label` (≤80, truncated) | full reason text beyond label | "{actor} marked {title} not applicable" |
| `requirement.not_applicable_reversed` | reverse_requirement_not_applicable | requirement | — | — | "{actor} reopened {title}" |
| `requirement.archived` / `requirement.restored` | archive/restore | requirement | `reason?` | — | "{actor} removed/restored {title}" |
| `requirement.reordered` | `move_project_requirement` | requirement | `moved_count=1`,`category_id`,`direction`; low-sensitivity sort-order before/after | per-row content detail | "{actor} reordered requirements" |
| `requirement.bulk_updated` | bulk_update_project_requirements | project | `action`,`count`,`requirement_ids[]` (capped at 50 + `truncated` flag),`value_label?` (e.g., company name, date) | free-text values | "{actor} updated {count} requirements ({action label})" |

Bulk N-A/archive use `requirement.bulk_updated` (with action) — no per-row event storm; single-row actions use their specific events.

**Lifecycle note:** `requirement.responsibility_changed` and `requirement.due_date_changed` are pure configuration events — they accompany **no** status transition (assignment completeness is derived, never stored). The only status-changing events are `requirement.marked_not_applicable` (`active` → `not_applicable_approved`, permission-gated by `requirement.set_not_applicable`) and `requirement.not_applicable_reversed` (returns to `active`). `requirement.archived`/`requirement.restored` record the independent `archived_at` state and leave `status` untouched.

## 4. Transactional behavior & feed suitability

Every event above is written inside its mutation's transaction (audit failure ⇒ rollback). Activity-feed suitability: all §2/§3 events render in project activity with the wording shown (actor resolved to display name, fallback "A teammate"); `requirement.reordered` and `requirement.updated` are **low-priority** (rendered but eligible for the feed's existing category filtering); org-scoped §1 events are excluded from project feeds. Phase 10+ notification triggers may later subscribe to these same events — names chosen to remain stable.

## 5. Explicitly not audited

Read/search/pagination activity (never audit reads); draft-builder keystrokes (batched into one `template.updated` per save); idempotent no-ops (re-apply that adds 0 still writes `template.applied` with `added_count:0` — an intentional exception because the user took a meaningful action); category collapse/UI preference changes.

---

*Continue to [phase-6-testing.md](./phase-6-testing.md).*

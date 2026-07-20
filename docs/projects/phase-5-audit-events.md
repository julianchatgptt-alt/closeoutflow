# FILE: /docs/projects/phase-5-audit-events.md

> **Document status:** Phase 5A specification — Phase 5 audit catalog + activity presentation. **Specification only.**
> **Grounding:** events written via the service-role-only `public.write_audit_event(...)` RPC into immutable `audit.audit_events` (append-only; update/delete/truncate denied; off PostgREST). Fields: `organization_id`, `actor_type`, `actor_id`, `project_id`, `target_type`, `target_id`, `action`, `before`/`after` jsonb, `request_id`, `session_id`, `ip`, `user_agent`, `source`, `metadata`. **Phase 5 uses the `project_id` column** (null in Phase 4 events).
> **Related:** [phase-5-data-model.md](./phase-5-data-model.md), [routes-and-workflows.md §activity](./routes-and-workflows.md).

---

## 1. Principles (unchanged)

Audit ≠ logs ≠ analytics ≠ `user_security_events`. Events written **inside** the SECURITY DEFINER transaction for sensitive mutations → **audit failure rolls back** the action (blocking). Redaction: `before`/`after`/`metadata` carry only what's needed for traceability — **never** raw PII dumps, no secrets, no full note bodies (store field-change keys / short labels). Actor = `internal_user` (`auth.uid()`). `source='web'`. Retention: standard long-term legal retention; Phase 5 events are `notice`/`info` severity (no `critical` — those are Phase 4 ownership/platform). `request_id` should carry the real observability correlation id (improving on the Phase 4 pattern that used random UUIDs — see Phase 4C P4C-L2).

**Blocking policy:** all Phase 5 events are **blocking** (in-transaction) for their mutation — these are business-record changes worth guaranteeing, and none are high-frequency (unlike sign-in). No best-effort events in Phase 5.

## 2. Catalog

Columns: **Event** · Trigger · Target · Required metadata · Prohibited metadata · User-facing activity wording · Retention.

### Projects
| Event | Trigger | Target | Required meta | Prohibited | Activity wording | Retention |
|-------|---------|--------|---------------|------------|------------------|-----------|
| `project.created` | create_project | project | `name` | notes body | "{actor} created the project" | standard |
| `project.updated` | update_project | project | `changed_fields[]` | full note text, PII | "{actor} updated project details" | standard |
| `project.status_changed` | set_project_status | project | `from`,`to` | — | "{actor} changed status from {from} to {to}" | standard |
| `project.archived` | archive_project | project | `reason?` | — | "{actor} archived the project" | standard |
| `project.restored` | restore_project | project | — | — | "{actor} restored the project" | standard |

### Internal team
| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `project.member_assigned` | assign_project_member | project_member | `member_user_id`,`project_role` | — | "{actor} assigned {member} as {role}" |
| `project.member_role_changed` | change_project_member_role | project_member | `from_role`,`to_role`,`member_user_id` | — | "{actor} changed {member}'s responsibility to {role}" |
| `project.member_removed` | remove_project_member | project_member | `member_user_id` | — | "{actor} removed {member} from the project" |

### Companies (directory)
| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `company.created` | create_company | company | `display_name` | notes | "{actor} added {company} to the directory" |
| `company.updated` | update_company | company | `changed_fields[]` | notes body | "{actor} updated {company}" |
| `company.archived` | archive_company | company | — | — | "{actor} archived {company}" |
| `company.restored` | restore_company | company | — | — | "{actor} restored {company}" |

### Contacts (directory)
| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `contact.created` | create_contact | contact | `contact_name` | email? (store name only; email is PII — omit or hash) | "{actor} added {contact} to the directory" |
| `contact.updated` | update_contact | contact | `changed_fields[]` | email/phone values | "{actor} updated {contact}" |
| `contact.archived` | archive_contact | contact | — | — | "{actor} archived {contact}" |
| `contact.restored` | restore_contact | contact | — | — | "{actor} restored {contact}" |

### Project ↔ company/contact
| Event | Trigger | Target | Required meta | Prohibited | Activity wording |
|-------|---------|--------|---------------|------------|------------------|
| `project.company_added` | assign_project_company | project_company | `company_id`,`role` | — | "{actor} added {company} as {role}" |
| `project.company_role_changed` | update_project_company | project_company | `from_role`,`to_role`,`company_id` | — | "{actor} changed {company}'s role to {role}" |
| `project.company_removed` | remove_project_company | project_company | `company_id` | — | "{actor} removed {company} from the project" |
| `project.contact_added` | assign_project_contact | project_contact | `contact_id`,`project_title?` | contact email | "{actor} added {contact} to the project" |
| `project.contact_responsibility_changed` | update_project_contact | project_contact | `changed_fields[]`,`contact_id` | — | "{actor} updated {contact}'s project role" |
| `project.contact_removed` | remove_project_contact | project_contact | `contact_id` | — | "{actor} removed {contact} from the project" |

> **Company↔contact directory affiliation** changes (`company_contacts` link/end) are **low-severity**; record as `company.updated`/`contact.updated` with a `metadata.affiliation_change` note rather than distinct events, to avoid catalog bloat. (Founder OD if distinct events are wanted.)

## 3. Metadata safety

- Store **ids + short labels + changed-field keys**, never full note/description bodies, never contact email/phone **values** (names are acceptable identifiers; email is PII → omit from audit or store a hash if correlation is needed). `changed_fields` is a list of column names, not their values, unless the value is a low-sensitivity enum (status/role) where before/after is useful.
- `before`/`after` used for status/role changes (enum values) only; not for free text.
- A redaction whitelist per event (function-side) prevents accidental PII/secret inclusion; a test asserts no email/phone value appears in any Phase 5 event.

## 4. Activity presentation (§19 requirement)

**Do not build a parallel event system.** Project activity is a **read-only derived view over `audit.audit_events`**, exposed by a SECURITY DEFINER `get_project_activity(project_id, cursor, limit)` that:
- Requires `can_access_project(project_id)` (authorization) → returns only that project's events, only to authorized users → **cross-tenant/cross-project isolation** by construction.
- Returns human-readable rows: actor display name (resolved via `get_organization_members`-style join, falling back to "A teammate"), the wording from §2, relative + absolute timestamp (tabular), and a target link where safe.
- **Redacts** sensitive metadata (never surfaces raw changed values beyond status/role labels).
- **Which events appear to users:** the project-scoped events above (created/updated/status/archived/restored, team/company/contact assignments). Org-level and Phase 4 identity events do **not** appear in project activity.
- **Pagination:** cursor (`occurred_at desc, id`), default 20, max 50.
- **Filtering:** by event category (project / team / companies / contacts) — optional in 5B.
- **Empty state:** "No activity yet — changes to this project will appear here."
- **Mobile:** compact timeline (icon-dot + sentence + time), matching the Phase 3E dashboard activity styling.
- **Future compatibility:** Phase 6+ requirement/document events (with `project_id`) automatically flow into the same view — no rework.

## 5. Retention & compliance
All Phase 5 audit events retained long-term (business/legal record); partition-by-month applies with the rest of `audit.audit_events`. `user_security_events` is unaffected (Phase 5 has no security-alert events). No new retention category needed.

---

*Continue to [phase-5-testing.md](./phase-5-testing.md).*

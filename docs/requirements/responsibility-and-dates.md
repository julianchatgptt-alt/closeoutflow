# FILE: /docs/requirements/responsibility-and-dates.md

> **Document status:** Phase 6A specification — responsibility assignment and due-date model for project requirements. **Specification only.**
> **Grounding:** reuses the Phase 5 relationship model exactly — `project_companies`, `project_contacts`, `project_members` ([phase-5-data-model.md](../projects/phase-5-data-model.md)). No new people/company structures.
> **Related:** [requirements-and-lifecycle.md](./requirements-and-lifecycle.md), [phase-6-data-model.md](./phase-6-data-model.md).

---

## 1. Responsibility model — three distinct, optional slots

| Slot | Column | Points at | Meaning | Never confused with |
|------|--------|-----------|---------|---------------------|
| **Responsible company** | `responsible_project_company_id` | `project_companies` (active row on this project) | The external company expected to furnish the deliverable (usually a sub). | Organization role, portal identity. |
| **Responsible contact** | `responsible_project_contact_id` | `project_contacts` (active row on this project) | The specific person at/for that company (optional refinement). | An auth user — contacts are directory records, never users. |
| **Internal owner** | `internal_owner_member_id` | `project_members` (active row) | The internal teammate who chases/coordinates this item. | Company responsibility; org role (project responsibility never elevates org role). |

Rules:
- All three are nullable — **unassigned is a first-class, visible state** (derived "Unassigned" indicator), not an error.
- If both company and contact are set, the contact should belong to that company's project relationship (`project_contacts.project_company_id` matches) — enforced as a **soft rule**: the picker filters to the company's contacts, allows "other project contact" deliberately, and mismatches are permitted but visually noted (real projects have consultants who submit on behalf of a sub).
- **Role-based instance assignment is rejected**: template items carry a `default_responsible_role` *hint* for apply-time resolution, but a live requirement always resolves to a concrete project company/contact/member. Assigning "whoever is the mechanical sub" as a live pointer would create ambiguity the moment two subs share a role.
- Assignment in Phase 6 is pure configuration — it does **not** send anything, grant access, or change `status` (the §B `assign + invite → requested` transition belongs to Phase 7). The UI copy makes this honest: "Requests are sent when the subcontractor portal arrives."

## 2. Assignment workflows

- Pickers reuse Phase 5 search patterns: company picker = active `project_companies` (grouped by role); contact picker = active `project_contacts` (filtered by chosen company first); owner picker = active `project_members`. Each offers a link-out to add the missing company/contact/member to the project (Phase 5 surfaces), then returns.
- Single-row assignment: inline from the register row (popover on desktop, sheet on mobile) or the requirement detail.
- Bulk assignment: [requirements-and-lifecycle.md §7](./requirements-and-lifecycle.md).
- Reassignment simply updates the pointer; audit records from→to (`requirement.responsibility_changed`); no history table (audit is the history).
- Permission: `requirement.assign`.

## 3. Validation at assignment time (server + RLS-scoped)

Rejected with friendly messages: relationship row not on **this** project; relationship row `status <> 'active'` (removed company/contact, removed member); archived directory company/contact behind the relationship; suspended/removed membership behind the member; cross-tenant ids (generic denial). All checks re-run inside the SECURITY DEFINER function — client state is never trusted.

## 4. When Phase 5 records change under existing assignments

Principle: **preserve history, surface staleness, never silently null or reassign.** Requirement pointers are FKs with `on delete restrict`; since Phase 5 removal is soft (`status='removed'`/archive), rows persist and pointers stay intact.

| Event | Behavior |
|-------|----------|
| Company removed from project (`project_companies.status='removed'`) | Assigned requirements keep the pointer; register shows a **"Responsible company removed from project"** attention chip; filter "Needs attention" catches them; remove/reassign flows offer "12 requirements are assigned to Ace Mechanical — reassign or leave flagged?" (informational preflight in the Phase 5 remove dialog, added in 6B without changing Phase 5 semantics). |
| Contact affiliation ends / contact removed from project | Same pattern at the contact slot; company slot unaffected. |
| Project member removed / loses access / membership suspended or removed | Internal-owner slot flagged "Owner no longer on project"; their register access is already revoked by Phase 5 RLS. |
| Directory company/contact archived | Relationship rows persist; assigned requirements show the archived hint; new assignments to them are blocked (§3). |
| Requirement reassigned | Plain update + audit; prior assignee retained only in audit. |
| Project archived | Whole register read-only (Phase 5 archived-project write block extends to all requirement mutations). |
| Requirement archived | Pointers retained; excluded from attention counts. |

No cascading auto-unassignment in Phase 6 — a wrong-but-visible pointer is safer and more honest than silent data loss, and Phase 7 invitations will re-validate assignment liveness before any request is sent.

## 5. Due-date model

- **`due_date date`** — date-only, no time component, interpreted in the **project timezone** for "today"/past-date derivations; rendered with the Phase 5D friendly, shift-free date formatting. Optional always.
- **Absolute dates** are the stored truth. **Relative defaults** exist only on template items (`default_due_anchor` + `default_due_offset_days`) and resolve to absolute dates **once, at apply time** (or stay empty if the anchor date is missing). The instance stores no formula.
- **Manual override:** any date edit is just an edit; there is no "linked to template rule" state to break.
- **Project schedule changes** (substantial completion / closeout target moved): requirement due dates are **not silently recalculated**. The register supports bulk date set/shift ("Set due date" / "Shift selected by n days" — the shift variant included only if cheap; otherwise set-date covers it, ROD-5-adjacent minor call left to 6B) so a coordinator adjusts deliberately. A passive info note on the project settings date section ("n requirements have due dates — review them after schedule changes") keeps it discoverable without a scheduling engine.
- **Milestone-relative deadlines** beyond the two anchors, recurring dates, working-day math, and reminder schedules are **out of scope** (reminders are Phase 10; their compatibility needs only a concrete `due_date`, which this model provides).
- **"Overdue" before submissions exist:** presented strictly as **"Planned date passed"** (derived, neutral) — never "overdue submission", "late", or a red alarm implying an unmet request. It becomes true overdue semantics in Phase 7+ when `requested` exists.
- **Bulk date changes:** atomic, audited (`requirement.bulk_updated{action:'set_due_date'}`), confirmation shows count + date.
- **Audit:** per-row date changes emit `requirement.due_date_changed{from,to}` (dates are low-sensitivity enums-of-fact, safe for before/after).
- **Timezone edge:** the project timezone (Phase 5 field) governs derivations; user timezone never shifts displayed date-only values (Phase 5D rule).

---

*Continue to [phase-6-permissions-and-rls.md](./phase-6-permissions-and-rls.md).*

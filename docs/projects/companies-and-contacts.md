# FILE: /docs/projects/companies-and-contacts.md

> **Document status:** Phase 5A specification — company directory, contact directory, relationships, dedupe, import readiness. **Specification only.**
> **Related:** [phase-5-data-model.md](./phase-5-data-model.md), [project-participants-and-access.md](./project-participants-and-access.md), [routes-and-workflows.md](./routes-and-workflows.md).
> **Core principle:** companies and contacts are **reusable, org-scoped directory records**. A subcontractor is entered **once** and reused across every project — never re-typed per project.

---

## 1. Company model

Org-scoped directory of every external (and the customer's own) construction organization.

| Field | Type | Req? | Notes |
|-------|------|:----:|-------|
| `id` | uuid | — | PK. |
| `organization_id` | uuid | ✅ | tenant owner. |
| `display_name` | text | ✅ | the name users see/search (e.g., "Ace Mechanical"). |
| `legal_name` | text | ➖ | formal legal entity name. |
| `dba` | text | ➖ | "doing business as". |
| `website` | text | ➖ | normalized to a domain for dedupe (§dedupe). |
| `email` | text | ➖ | general company email. |
| `phone` | text | ➖ | general phone (stored normalized digits + display). |
| `address_line1/line2/city/region/postal_code/country` | text | ➖ | office address. |
| `classifications` | text[] | ➖ | **global** lightweight tags: general_contractor, subcontractor, owner, architect, engineer, consultant, supplier, manufacturer, testing_agency, commissioning_agent, other. **Not authoritative per project** (see §3). |
| `trade` | text | ➖ | primary specialty (HVAC, Electrical, Roofing…) — a hint, not a constraint. |
| `license_number` | text | ➖ | contractor license (non-sensitive). |
| `vendor_number` | text | ➖ | customer's internal AP vendor ref. |
| `status` | text | ✅ | `active` / `archived` (default active). |
| `notes` | text | ➖ | internal. |
| `tags` | text[] | ➖ | freeform user tags. |
| `normalized_name` | text | ✅ (derived) | lowercased/trimmed/punct-stripped `display_name` for dedupe + search. |
| `website_domain` | text | ➖ (derived) | host of `website` for dedupe. |
| `created_by`/`created_at`/`updated_at`/`archived_at` | — | | lifecycle. |

**Prohibited in Phase 5:** tax identifiers (EIN/SSN), banking, insurance certificates, or any sensitive financial/PII data — **do not store**. (Deferred to a later, access-controlled phase if ever needed.)

## 2. Contact model

Org-scoped directory of individual people (external participants + directory people). **Contacts are never authentication users** (see §external-readiness).

| Field | Type | Req? | Notes |
|-------|------|:----:|-------|
| `id` | uuid | — | PK. |
| `organization_id` | uuid | ✅ | tenant owner. |
| `first_name` | text | ✅ | |
| `last_name` | text | ✅ | |
| `preferred_name` | text | ➖ | |
| `email` | citext | ➖ | case-insensitive; dedupe key (§dedupe). |
| `phone` | text | ➖ | office. |
| `mobile_phone` | text | ➖ | |
| `job_title` | text | ➖ | **default/global** title; project- and company-specific titles live on the relationships (§4, [participants doc](./project-participants-and-access.md)). |
| `department` | text | ➖ | |
| `timezone` | text | ➖ | |
| `locale` | text | ➖ | |
| `status` | text | ✅ | `active`/`archived`. |
| `notes` | text | ➖ | |
| `normalized_email` | citext (derived) | ➖ | dedupe. |
| `created_by`/`created_at`/`updated_at`/`archived_at` | — | | lifecycle. |

**Decisions:**
- **Contacts CAN exist without a company** (an owner's rep, an independent consultant). Company is optional.
- **A contact may belong to multiple companies over time** → handled via `company_contacts` relationship rows (§4), not a single FK. The contact's *current* primary company is the active relationship.
- **Duplicate emails:** a **warning**, not a hard block (two people can legitimately share a shared inbox; or the same person re-entered) — see §dedupe.
- **Internal users vs external contacts stay separate:** internal team = `auth.users` via `organization_memberships` + `project_members`; contacts are directory records. A contact is **never** promoted into an auth user in Phase 5; Phase 7 subcontractor invitations will *link* a contact to a future secure-link/account identity — the schema reserves a nullable `linked_user_id`/`portal_status` for that (not populated now).

## 3. Company classification: relationship-specific, not global (decision)

Construction companies play different roles on different projects (a firm is the GC on one job, a sub on another). Therefore:
- The company's **global `classifications[]`** are *hints/tags* for directory filtering only (e.g., "we generally know them as a subcontractor").
- The **authoritative role is per project**, stored as `project_companies.role` ([project-participants-and-access.md §project-company](./project-participants-and-access.md)).

This prevents encoding project roles into the global record and is the model that makes reuse work. Reconsideration: none anticipated — this is the correct construction-domain model.

## 4. Company↔contact relationship (`company_contacts`)

Supports real-world employment/affiliation without over-engineering.

| Field | Notes |
|-------|-------|
| `company_id`, `contact_id`, `organization_id` | the link (all same org — enforced). |
| `job_title`, `department` | title **at this company** (may differ from the contact's global default). |
| `is_primary_contact` | this contact is the company's primary point of contact (≤1 primary per company enforced by partial unique). |
| `preferred_email`/`preferred_phone` | contact-at-company overrides. |
| `status` | `active`/`ended`. |
| `started_on`/`ended_on` | effective dates → **historical employment** preserved (contact changed employers → end the old relationship, start a new one; never delete). |

- **Multiple company relationships:** allowed (a consultant affiliated with two firms). The contact detail shows current + past affiliations.
- Removing an affiliation = set `status='ended'` + `ended_on` (soft), preserving history.

## 5. Deduplication (implemented now vs deferred)

**Implemented in Phase 5 (create-time warnings, never auto-merge):**
- **Companies:** on create, query same-org active companies where `normalized_name` matches (exact, after lower/trim/strip-punctuation) **or** `website_domain` matches **or** normalized `phone` matches → show a **duplicate-warning** panel listing candidates with "Use this company instead" / "Create anyway". Exact `normalized_name` + same region is a strong signal; different region is a weak signal (surface, don't warn hard — same-name companies in different regions are common).
- **Contacts:** on create, match same-org active contacts where `normalized_email` equals → warning with "Use this contact" / "Create anyway". Name-only matches are **not** warned (too noisy).
- A **soft unique index**: none that blocks (no hard unique on name/email — real data has legitimate collisions). Dedupe is advisory.

**Merge-readiness (schema now, engine deferred):** IDs are stable UUIDs; relationships (`company_contacts`, `project_companies`, `project_contacts`) reference companies/contacts by id, so a future **merge** operation can repoint relationships and archive the losing record. Phase 5 does **not** implement merge (deferred), but the schema and audit make it safe to add. **No automatic merging on weak similarity — ever.**

**Deferred:** fuzzy/trigram matching (pg_trgm), cross-org global directory, external enrichment. (pg_trgm indexes *may* be added for search in §6 without enabling auto-merge.)

## 6. Search (foundations) — see [routes-and-workflows.md §search](./routes-and-workflows.md)

- **Method:** PostgreSQL, no external service. Prefix + contains search over `normalized_name`/`display_name` (companies), `first_name`/`last_name`/`normalized_email` (contacts), `name`/`project_number` (projects).
- **Indexing:** `citext`/normalized columns + **trigram GIN** (`pg_trgm`) for `ILIKE '%q%'` at scale; a `tsvector` column is **not** needed for Phase 5 (directory search is name-centric). Accent handling via `unaccent` on the normalized column. Case-insensitive by construction.
- **Isolation:** all search runs under RLS (org-scoped) → results never cross tenants.
- **Rate limits:** search server actions use the existing Upstash limiter (per-user) to prevent scraping.
- **Future full-search compatibility:** the normalized columns feed a later cross-entity search without reshaping.

## 7. Archive & restore

- Company/contact **archive** (`company.archive`/`contact.archive` — Owner/Admin, or the manage permission): `status='archived'`, `archived_at`; drops from default directory lists (visible via Archived filter); **existing project relationships are preserved** (an archived company still shows on projects it's assigned to, marked archived). Restore reverses it. Audit `company.archived`/`restored`, `contact.archived`/`restored`.
- **Cannot archive** a company/contact? Archiving is always allowed (soft); it does not remove project links (history), it just hides the record from active directory selection. New project assignments can't select archived records (filtered out of pickers).
- **No hard delete** of companies/contacts in Phase 5 (relationships would lose meaning); org-deletion cascade only.

## 8. External-contact & portal readiness

- Contacts carry a **reserved nullable `linked_user_id`** and **`portal_status`** (`none` default) — **not used in Phase 5**. Phase 7 will invite a contact to a secure-link/account and set these. The UI **must not** label a contact as a "user" or imply login access. Visual distinction (external record vs internal member) is specified in [routes-and-workflows.md §external-participant UX](./routes-and-workflows.md).

## 9. Import readiness (schema-only; no engine now)

Commercial contractors arrive with spreadsheets. Phase 5 **does not build an import engine**, but ensures the schema won't fight a future CSV import:
- All directory fields are nullable except names; no hard uniqueness that would reject messy real data; `normalized_name`/`normalized_email`/`website_domain` exist for **duplicate review** during import; stable UUIDs + relationship join tables mean import → dedupe-review → link is straightforward later.
- A future importer maps CSV columns → company/contact fields, runs the same dedupe warnings in bulk, and lets the user resolve. Reserved but unbuilt. (Founder OD: whether a minimal company CSV import lands in Phase 5 — **default: defer to Phase 5C/6**.)

## 10. Validation (directory)

Server-side: company `display_name` required (2–160); website normalized to a valid host or rejected; email format; phone normalized (store digits + original); country/region codes valid; contact `first_name`/`last_name` required; `email` valid citext when present. Duplicate warnings are advisory (§5). Archived related records can't be newly assigned. Full matrix in [routes-and-workflows.md §validation](./routes-and-workflows.md). Technical DB constraint errors are mapped to friendly messages — never shown raw.

---

*Continue to [project-participants-and-access.md](./project-participants-and-access.md).*

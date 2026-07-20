# Phase 5B implementation progress

> Status: complete and ready for independent Phase 5C audit. Updated 2026-07-20.

Phase 5B implements the project, company, contact, relationship, and internal project-team foundation described by the approved Phase 5A specifications. It stops before requirements, documents, reviews, portals, billing, integrations, and AI.

## Task record

| Task | Result | Primary evidence |
| --- | --- | --- |
| 0 | Complete | `codex/phase-5b-projects`; baseline images under `phase-5b/before` |
| 1 | Complete | Project/company/contact permissions, project-aware actors, authorization parity tests |
| 2 | Complete | Migration validator permits only the seven approved Phase 5 tables and keeps later-domain tables forbidden |
| 3 | Complete | `0012` helpers and `0013` projects/project-members foundation with lifecycle RPCs |
| 4 | Complete | `0014` company directory, normalization, search, archive/restore |
| 5 | Complete | `0015` contacts and historical company affiliations |
| 6 | Complete | `0016` project-company assignments with per-project roles |
| 7 | Complete | `0017` project-contact assignments and company-consistency guards |
| 8 | Complete | `0018` project-member assignment hardening and recursion-safe access |
| 9 | Complete | `0019` readers, searches, overview/activity RPCs, grants, forced RLS, parity |
| 10 | Complete | Blocking Phase 5 audit events with project correlation and redacted metadata |
| 11 | Complete | `0020` seed contract and real generated Supabase types |
| 12 | Complete | Validated/rate-limited server actions using active organization and project context |
| 13 | Complete | Name-only project creation and `/projects/new` fallback |
| 14 | Complete | Searchable/filterable/cursor-paginated project list with mobile cards |
| 15 | Complete | Real-data project overview and setup guidance |
| 16 | Complete | Concurrency-aware settings plus confirmed lifecycle actions |
| 17 | Complete | Searchable company directory and responsive presentation |
| 18 | Complete | Company detail, relationships, lifecycle, and warn-not-block duplicate preflight |
| 19 | Complete | Searchable contact directory and responsive presentation |
| 20 | Complete | Contact detail, affiliations, lifecycle, and duplicate-email preflight |
| 21 | Complete | Project company/contact assignment workspaces |
| 22 | Complete | Internal project-team assignment workspace distinct from organization membership |
| 23 | Complete | Derived five-step setup checklist with progress and next actions |
| 24 | Complete | Project activity rendered only from authorized audit events |
| 25 | Complete | Light/dark, desktop/mobile, empty/loading/error/denied states, axe fixes, honest future previews |
| 26 | Complete | Full repository, database, cross-browser, accessibility, security, and production probes green |
| 27 | Complete | This progress record and the Phase 5B exit review |

## Delivered data model

Exactly seven Phase 5 tenant tables were added:

- `projects`
- `companies`
- `contacts`
- `company_contacts`
- `project_companies`
- `project_contacts`
- `project_members`

All seven contain `organization_id`, have RLS enabled and forced, and use organization/project-aware policies. Tenant mutations go through audited security-definer RPCs after application authorization. No hard-delete workflow is exposed.

## Delivered routes

- `/projects`, `/projects/new`, `/projects/[projectId]`
- `/projects/[projectId]/settings`, `/team`, `/companies`, `/contacts`, `/activity`
- `/companies`, `/companies/new`, `/companies/[companyId]`
- `/contacts`, `/contacts/new`, `/contacts/[contactId]`

Requirement/document/review/equipment/warranty and later routes remain visibly labeled previews; no later-domain data was introduced.

## Problems found and resolved

- Generated-type and migration validation needed the Phase 5 allowlist without opening Phase 6 table names.
- Project-member RLS needed recursion-safe helpers and explicit suspended/unassigned denial.
- Team rendering initially depended on a brittle nested join; it now consumes the authorized overview RPC payload.
- Duplicate warnings existed only as query-driven states; company/contact creation now has visible preflight inputs.
- Destructive actions lacked a confirmation boundary; archive and cancel now use the shared accessible `AlertDialog`.
- Mixed-theme primary actions failed serious axe contrast; the shared primary contrast treatment was corrected.
- Phase 3 browser assertions still expected mock project rows and preview markers; they now assert the real Phase 5 semantics while future routes retain preview coverage.
- The server-only probe deleted normal Next output and failed on Windows/OneDrive locks; it now builds in an isolated disposable directory.
- Playwright output could collide with production/dev Next artifacts; browser runs now use `.next-playwright`.
- The initial loading state was too visually quiet; it now has a visible status and structured skeleton cards.

## Validation snapshot

- Vitest: 37 files, 156 tests passed.
- pgTAP: 9 files, 205 assertions passed.
- Playwright full matrix: 172 passed, 59 intentional project-specific skips.
- Dedicated accessibility matrix: 76 passed.
- Database migrations: `0000` through `0020` reset cleanly.
- Generated database type SHA-256 was identical before and after regeneration.
- Live security probe blocked audit UPDATE, DELETE, and TRUNCATE and confirmed the audit schema is unavailable through PostgREST.
- Production-like probe confirmed unique nonce CSP, security headers, safe redirects, local-only `/design`, and zero health-request audit writes.

See [phase-5-exit-review.md](./phase-5-exit-review.md) for complete validation, visual, risk, and boundary evidence.

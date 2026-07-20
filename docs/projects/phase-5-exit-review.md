# Phase 5B exit review

> Decision: Phase 5B is complete enough for independent Phase 5C audit. Date: 2026-07-20.

## Implementation result

Closeout now provides organization-isolated project setup, reusable company/contact directories, project participants, internal project-team assignments, safe lifecycle controls, setup guidance, and audit-backed activity. The implementation uses the existing Phase 3E shell/design system and Phase 4 identity/tenant context rather than creating parallel foundations.

## Security review

- RLS is enabled and forced on every Phase 5 table; default access remains deny-first.
- Owners/admins can see organization projects; non-admin discovery is gated by active `project_members` assignment.
- Cross-tenant, forged organization/project identifiers, unassigned membership, removed assignment, and suspended membership are covered by constrained-role pgTAP assertions.
- Application permissions and SQL helpers are checked by the authz/RLS parity suite.
- Anon table grants remain zero; authenticated mutations are RPC-mediated.
- Service-role imports remain server-only and are verified by two failing-client-build probes.
- Sensitive mutations write blocking immutable audit events; audit remains separate from logs and analytics.
- Live audit UPDATE, DELETE, and TRUNCATE attempts fail, and PostgREST does not expose the audit schema.
- Generated types are real local Supabase output and deterministic.

## Commercial journey review

### First project

The primary path is Projects → Create project → enter one required name → Create. The automated Chromium journey landed on the overview and setup checklist; measured test execution was 8.1 seconds including page navigation and assertions, comfortably below the one-minute product goal. The empty state explains the value and required-field count. The overview leads to team, company, and contact setup without pretending requirements exist.

### Reuse across projects

Directory and project relationship screens were exercised with real seed relationships. `Ace Mechanical` is reused by Riverside as `subcontractor` and Eastgate as `general_contractor`, demonstrating one organization directory record with project-specific roles. Company/contact search, duplicate-warning preflight, detail backlinks, and relationship consistency were reviewed in desktop/mobile UI and enforced by pgTAP.

### Assigned access

The owner view, assigned project-member view, unassigned denial, removal revocation, suspended-member denial, and cross-tenant denial are covered at the authoritative authz/RLS layer. The live browser review confirmed a foreign project is returned as an intentionally non-disclosing 404.

### Friction fixed

- Added explicit create CTAs and a one-field first-project path.
- Kept duplicate detection warn-not-block and reuse-first.
- Separated organization Team from internal project Team copy and routes.
- Added visible loading, error, no-results, empty, and permission-denied feedback.
- Added confirmation before destructive lifecycle changes.
- Replaced desktop tables with intentional cards on mobile.
- Corrected primary-action contrast and verified serious/critical axe results are empty.

No fake statistics were added. The overview uses setup completion, dates, assigned participants, relationships, and audit activity only.

## Visual evidence

All files are under `C:\Users\julia\.codex\visualizations\2026\07\20\phase-5b\final`.

| Task/state | Route | Viewport | Theme | File | Review result |
| --- | --- | --- | --- | --- | --- |
| Projects | `/projects` | 1440×900 | light | `projects-desktop-light.png` | Clear primary action and operational hierarchy |
| Projects | `/projects` | 1440×900 | dark | `projects-desktop-dark.png` | Contrast corrected and verified |
| Projects | `/projects` | Pixel-class mobile | light | `projects-mobile.png` | Semantic card fallback |
| Create | `/projects/new` | 1440×900 | light | `project-create-desktop.png` | One required field is explicit |
| Create | `/projects/new` | iPhone-class mobile | light | `project-create-mobile.png` | Form and actions fit without horizontal overflow |
| First-project empty | `/projects` with disposable empty local dataset | 1440×900 | light | `projects-empty-first-project.png` | Value, required-field count, and CTA are clear |
| Overview | `/projects/500…001` | 1440×900 | light | `project-overview-desktop.png` | Useful without Phase 6 data |
| Overview | `/projects/500…001` | Pixel-class mobile | light | `project-overview-mobile.png` | Intentional stacked hierarchy |
| Settings | `/projects/500…001/settings` | 1440×900 | light | `project-settings.png` | Details and lifecycle separated |
| Setup checklist | `/projects/500…001` | 1440×900 | light | `project-setup-checklist.png` | Derived progress and next actions |
| Companies | `/companies` | 1440×900 | light | `companies-desktop.png` | Searchable reusable directory |
| Companies | `/companies` | Pixel-class mobile | light | `companies-mobile.png` | Long content remains readable |
| Company detail | `/companies/600…002` | 1440×900 | light | `company-detail.png` | Contacts and projects visible |
| Company duplicate | `/companies/new?name=Ace` | 1440×900 | light | `company-duplicate-warning.png` | Warn-not-block behavior is explicit |
| Contacts | `/contacts` | 1440×900 | light | `contacts-desktop.png` | Directory purpose is clear |
| Contacts | `/contacts` | Pixel-class mobile | light | `contacts-mobile.png` | Card layout fits long identity data |
| Contact detail | `/contacts/700…001` | 1440×900 | light | `contact-detail.png` | External contact framing and relationships are honest |
| Project companies | `/projects/500…001/companies` | 1440×900 | light | `project-companies.png` | Roles and reuse workflow visible |
| Project contacts | `/projects/500…001/contacts` | 1440×900 | light | `project-contacts.png` | Project title and company context visible |
| Internal team | `/projects/500…001/team` | 1440×900 | light | `project-team.png` | Seeded assignments render correctly |
| Archive confirmation | `/projects/500…001/settings` | 1440×1000 | dark | `archive-confirmation.png` | Focused modal explains retained history |
| Permission denied | foreign-tenant project URL | 1440×900 | light | `permission-denied.png` | Non-disclosing 404 |
| Loading | `/projects` under disposable local read lock | 1440×900 | light | `projects-loading-state.png` | Visible status plus structured skeletons |
| Error | `/projects` forced local query error | 1440×900 | light | `error-state.png` | Safe message; no raw sensitive details |
| No results | `/projects?q=missing` | 1440×900 | light | `projects-no-results.png` | Recovery path is clear |
| Activity | `/projects/500…001/activity` | 1440×900 | light | `project-activity.png` | Audit-backed human-readable timeline |

Baseline images are retained separately under the sibling `before` directory. The visual review found and fixed the team-data join, primary-action contrast, destructive confirmation, duplicate preflight, and loading visibility issues. No unresolved blocking desktop or mobile visual issue remains.

## Validation results

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, including import boundaries |
| `pnpm typecheck` | Passed, 15/15 packages |
| `pnpm test` | Passed, 37 files / 156 tests |
| `pnpm build` | Passed, 15/15 packages and all Phase 5 routes |
| `pnpm test:server-only` | Passed for DB and auth privileged imports; follow-up typecheck passed |
| `pnpm db:start` | Passed; local stack running |
| `pnpm db:reset` | Passed through migration `0020` plus deterministic seed |
| `pnpm db:types` | Passed; SHA-256 unchanged after regeneration |
| `pnpm db:lint` | Passed; no schema errors |
| `pnpm db:validate` | Passed; approved table allowlist and security invariants |
| `pnpm test:db` | Passed, 9 files / 205 assertions |
| `pnpm test:e2e` | Passed, 172 passed / 59 intentional skips across five projects |
| `pnpm test:a11y` | Passed, 76/76 |
| `pnpm test:live-security` | Passed |
| `pnpm test:production-probe` | Passed |

The browser matrix includes Chromium, Firefox, WebKit, Pixel 7/mobile Chrome, and iPhone 15/mobile Safari. CSP nonce tests, reduced-motion behavior, keyboard navigation, route branding, `/design` production gating, security headers, and zero health-request audit writes passed.

## Remaining risks and deferrals

- Performance was validated at deterministic local seed scale, not production-scale tenancy. Cursor pagination and indexed search are in place; load testing remains a later delivery concern.
- Automated axe coverage cannot replace founder/customer usability review or assistive-technology manual testing.
- Requirements, documents, reviews, approvals, files, portals, billing, integrations, and AI remain intentionally deferred. Phase 5 does not fabricate substitutes for them.
- Founder review is a soft product-quality gate, not a repository repair or security blocker.

## Boundary confirmation

- No requirement, submission, document, document-version, review, approval, package, warranty, equipment, inspection, training, lien-waiver, or drawing table was created.
- No external portal, secure external link, public bucket, billing, integration, OCR, or AI behavior was added.
- No RLS, CSP, audit immutability, tenant isolation, service-role boundary, or append-only migration rule was weakened.
- Audit remains separate from logs and analytics.
- Phase 3E design patterns remain the presentation foundation.
- Public branding remains **Closeout**.
- Phase 6 has not started.

## Founder action

No founder action is required to make the repository validation green. The remaining founder-owned action is the optional commercial/visual review before or during the independent Phase 5C audit.

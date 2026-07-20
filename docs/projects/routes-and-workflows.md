# FILE: /docs/projects/routes-and-workflows.md

> **Document status:** Phase 5A specification — routes, access matrix, workflows, states, responsive, a11y, placeholder conversion. **Reuse the Phase 3E design system; do not redesign.**
> **Related:** [projects-and-lifecycle.md](./projects-and-lifecycle.md), [companies-and-contacts.md](./companies-and-contacts.md), [project-participants-and-access.md](./project-participants-and-access.md), [commercial-readiness.md](./commercial-readiness.md); Phase 3E [phase-3e-component-polish.md](../design/phase-3e-component-polish.md), [phase-3e-dashboard-redesign.md](../design/phase-3e-dashboard-redesign.md).
> **Reuse (existing components):** `AppShell`, `PageHeader` + `PreviewPill`, `DataTable` (+ card fallback), `Card`, `Field`/`Input`/`Select`/`Combobox`/`Switch`, `Button` (+ locked variant), `Dialog`/`AlertDialog`/`Sheet`, `DropdownMenu`, `Toast`, `EmptyState`/`ErrorState`/`PermissionDenied`, `StatusBadge`, `RiskIndicator`, `Avatar`, `Progress`, `Skeleton`, `Breadcrumbs`, project sub-nav (`ProjectSubnav`). Forms use `react-hook-form` + `zod`.

---

## 1. Route map

| Route | Purpose |
|-------|---------|
| `/projects` | Project list (functional): search/filter/sort, quick-create. |
| `/projects/new` | Full-page create fallback (deep link / mobile); primary create is a dialog. |
| `/projects/[projectId]` → `/overview` | Project overview (functional). |
| `/projects/[projectId]/settings` | Edit identity/metadata; lifecycle actions (archive/restore/status/cancel). |
| `/projects/[projectId]/team` | Internal project team (functional). |
| `/projects/[projectId]/companies` | Project companies (functional). |
| `/projects/[projectId]/contacts` | Project contacts (functional). |
| `/projects/[projectId]/{requirements,documents,reviews,equipment,warranties,inspections,training,lien-waivers,drawings,package,activity}` | **Honest previews** (Phase 3E `PreviewPill`), except `activity` (functional — see §activity). |
| `/companies` | Company directory (functional; global sidebar item). |
| `/companies/new` | Create company (dialog primary + page fallback). |
| `/companies/[companyId]` → `/edit` | Company detail + edit. |
| `/contacts` | Contact directory (functional). **New global nav item** (OD — recommend adding "Contacts" to the sidebar; see §nav). |
| `/contacts/new`, `/contacts/[contactId]` → `/edit` | Create/detail/edit. |

**No route proliferation:** company/contact edit is a mode of the detail page (or a dialog), not a separate destination unless deep-linked. `/projects/[id]` redirects to `/overview` (the sub-nav's first tab).

## 2. Route-access matrix

Legend: **Auth** = verified user; **Org** = active org; **Perm** = required permission; server-enforced + RLS.

| Route | Auth | Org | Perm | No access → | Archived |
|-------|:---:|:---:|------|-------------|----------|
| `/projects` | ✔ | ✔ | (member) | — | archived shown via filter |
| `/projects/new` | ✔ | ✔ | `project.create` | `PermissionDenied` | — |
| `/projects/[id]/*` | ✔ | ✔ | `project.view` + `can_access_project` | not-found/denied (no existence leak) | read-only banner |
| project mutations | ✔ | ✔ | `project.update/archive/manage_*` | denied | write-blocked |
| `/companies`, `/contacts` | ✔ | ✔ | `company.view`/`contact.view` | denied | archived via filter |
| company/contact create/edit | ✔ | ✔ | `company.create/update`… | denied | can't edit archived except restore |

**Deny-by-default:** unknown role, missing/suspended/removed membership, archived org, cross-tenant id, unassigned non-admin → deny. A project a user can't access returns a **not-found-style** page (never confirming existence).

## 3. Project creation (commercial-polish)

- **Primary: a dialog** ("New project") from `/projects` header + command palette ("Create project"). Fields: **Name** (required) · Project number (optional) · Type (optional select). One primary action "Create project". `Enter` submits.
- **Behavior:** creates a `draft`/`active` project + auto-assigns the creator (`project_members`), closes the dialog, **navigates to the new overview** with the setup checklist expanded and a success toast ("Project created — let's set it up"). Total: ~1 field, ~2 clicks, <60s.
- **Duplicate name:** soft inline warning ("You already have 'Riverside Medical Office'") with a link; never blocks.
- **Cancel:** discards (unsaved-changes guard only if the user typed).
- **Mobile:** dialog → full-screen sheet; sticky "Create" bottom button.
- **Error recovery:** validation inline; server errors → friendly toast + retained input.
- **Permission:** `project.create` (Owner/Admin/PM/Coordinator); others don't see the button.
- **Audit:** `project.created`.

## 4. Project list (`/projects`)

- **Default view:** `DataTable` (comfortable density). **Columns (lean — avoid overload):** Name (+ project_number sub-line) · Type · Status (`StatusBadge`) · Closeout target (date) · Team (avatar stack) · Updated. Risk column is a **placeholder** (em-dash + "Phase 11") — honest.
- **Card view** toggle for browsing (optional; table default).
- **Toolbar:** search (name/number) · Filters (status, assigned-to-me, type, archived) · sort (updated/name/closeout-target) · **New project** primary.
- **Filters:** Status (multi) · **Assigned to me** (my `project_members`) · Type · **Archived** (off by default) · date range (closeout target).
- **Saved-view readiness:** filters serialize to URL query (shareable, resumable) — the seam for saved views later.
- **States:** empty (first-run) → premium empty state: "Create your first project" + one-line value copy + primary CTA; no-results → "No projects match" + clear-filters; loading → skeleton rows; error → inline retry.
- **Row actions:** Open · Edit · Archive (permission-gated, hover/focus-revealed). **Bulk actions deferred** (selection UI present, actions "later").
- **Mobile:** table → cards (name, status, closeout date, team count); quick-create FAB or header button.

## 5. Project overview (`/overview`)

Structure per [projects-and-lifecycle.md §8](./projects-and-lifecycle.md): identity header (name/number/status/meta + edit/status actions) → **setup checklist** (hero when under-populated) → key dates → internal team → companies (by role) → key contacts → recent activity → **honest closeout-readiness placeholder** → recommended next step. Real data only; **no fabricated requirement/document metrics**. Panels are Phase 3E paper cards with overline headers + per-panel CTAs. Empty panels show "Add …" CTAs, not blank boxes.

## 6. Project settings (`/settings`)

Sectioned form (Phase 3E `Field` + read-only rows): **Identity** (name, number, type, delivery, description) · **Dates** · **Location** · **Notes**. Per-section save; `project.update` gated (read-only view for non-editors with a banner). **Lifecycle actions** area: Change status (dropdown of valid transitions), Cancel project (gated dialog + reason), Archive (dialog + reason), Restore (if archived). Optimistic-concurrency guard (§11).

## 7. Company directory (`/companies`) — see [commercial-readiness §directory](./commercial-readiness.md)

`DataTable`: Name (display+legal sub-line) · Classifications (chips) · Trade · Projects count · Contacts count · Updated. Toolbar: search · filter (classification, archived) · **New company**. Detail page: company identity, associated contacts (`company_contacts`), associated projects (`project_companies` with roles), edit/archive. **Duplicate warning** on create (§8). Reuse-first: adding a company to a project searches this directory (§project companies). Empty state sells the reuse value.

## 8. Contact directory (`/contacts`)

`DataTable`: Name (preferred/full) · Email · Company (current primary affiliation) · Title · Projects count · Updated. Toolbar: search (name/email) · filter (company, archived) · **New contact**. Detail: identity, current + past company affiliations, project participations, edit/archive. **Duplicate-email warning** on create. Communication fields (email/phone/mobile) presented cleanly with copy affordances. External-record framing (§external UX). Empty state: "Build your contact directory once, reuse everywhere."

## 9. Internal team management (`/team` project tab)

Panel (`DataTable`/list): member (Avatar + name + email) · project responsibility (select) · assigned date · actions. **Add member** dialog: search **active org members** (from `organization_memberships`) → pick responsibility → assign. Change responsibility inline; remove (soft, confirm). **Distinct from org Team management** (`/settings/team`) — copy clarifies "assign existing organization members to this project." Empty: "Assign your project team." Permission: `project.manage_team`. Suspended/removed org members don't appear in the picker and lose access automatically.

## 10. External participant assignment (project companies/contacts)

- **Project companies** (`/companies` tab): list of assigned companies grouped by role (Owner, GC, Architect, Subs…). **Add company** dialog: **search the directory** (reuse) → if not found, "Create new company" inline (with dedupe warning) → choose **project role** + trade scope + contract number + primary contact. Change role / remove (soft). Company rows link to the directory detail.
- **Project contacts** (`/contacts` tab): assigned contacts with project title/responsibility flags (primary/closeout — closeout reserved). **Add contact** dialog: search directory → pick → set project title + primary + (reserved) closeout flag; optional link to a project company. 
- **External framing:** these sections are clearly labeled external directory records, visually distinct from the internal team (different section, "external company/contact" affordance, **never** "user"). See §external-participant UX below.

## 11. Concurrency & validation

- **Concurrency:** per-section optimistic update with `updated_at` precondition; on stale write, friendly "This project was updated by someone else — review and retry" (reload the section). Duplicate company/contact creation collisions are resolved by the dedupe warning (client) + advisory (no hard unique). Simultaneous relationship changes are last-write-wins on distinct rows; unique constraints prevent duplicate assignments.
- **Validation (server + client):** duplicate project number (org-unique → friendly "That project number is already used"), invalid/ordered dates (completion before start rejected), invalid timezone/country/region, invalid email/phone, missing company name, duplicate company/contact **warnings**, archived-related-record assignment blocked, cross-tenant id (denied, generic), removed-member assignment blocked, unauthorized mutation (`PermissionDenied`), stale form (§concurrency), slug/number collision, DB constraint failure → **mapped to friendly messages (never raw)**, rate limit ("Too many attempts"), network interruption (retry-safe, idempotent where possible).

## 12. Empty / loading / error / permission-denied / archived states
Standard Phase 3E patterns everywhere: premium `EmptyState` (icon + title + one-line + CTA), skeletons matching final layout (no shift), inline `ErrorState` + retry (per panel — one failing panel never blanks the page), `PermissionDenied` (calm, "ask an admin"), archived banner (read-only + Restore CTA). Not-found for inaccessible projects (no existence leak).

## 13. Responsive behavior
Per [commercial-readiness §mobile/responsive](./commercial-readiness.md): 1920/1440/laptop → full tables + multi-panel overview; tablet → 2-up panels, tables scroll in region; **mobile → tables become cards, dialogs become bottom sheets, project sub-nav scrolls / "Section ▾", long company names + emails truncate with tooltip/expand, action menus in overflow, sticky primary actions, 44px targets.** The team/companies/contacts relationship tables get first-class card fallbacks (label:value pairs).

## 14. Accessibility
WCAG 2.2 AA (Phase 3E foundation): labelled fields + `aria-describedby`/error association + focus-to-first-error; dialog/sheet focus trap + return; `DataTable` `aria-sort`/`scope`/caption + sr-only select labels; status via icon+label (never color-alone); duplicate warnings as `role="status"`/alert; reduced-motion; 44px targets; live-region announcements on assign/remove/status-change. Detailed in [phase-5-testing.md §a11y](./phase-5-testing.md).

## 15. Metadata & breadcrumbs
Titles via the root `%s · Closeout` template (page name only). Breadcrumbs: `Projects › {Project name} › {Tab}`; `Companies › {Company}`; `Contacts › {Contact}`. No "CloseoutFlow" in any visible string.

## 16. External-participant UX (§29 requirement)
Clear visual language:
- **Internal member:** Avatar + name + email + org-role/project-responsibility badge; "member" language; lives in the **Team** section.
- **External company:** building icon + company name + project **role** chip; links to directory; "company" language.
- **External contact:** person icon + name + title; **"external contact"** affordance; **never** labeled "user" or shown a login/access control.
- **Future portal user:** a reserved, greyed "Portal access — Phase 7" affordance on a contact detail (honest preview), not implying current access.

## 17. Existing placeholder conversion plan

| Route | Phase 5 action |
|-------|----------------|
| `/projects` | **Convert to real.** Remove `PreviewPill` + `phase-3.ts` mock; introduce real data (empty state first-run); enable New project. |
| `/projects/[id]` (overview) | **Convert to real.** Remove preview/mock; real overview; requirement/document panels replaced by setup checklist + honest closeout-readiness placeholder. |
| `/projects/[id]/{settings,team,companies,contacts}` | **Convert to real.** |
| `/projects/[id]/activity` | **Convert to real** (from audit). |
| `/projects/[id]/{requirements,documents,reviews,equipment,warranties,inspections,training,lien-waivers,drawings,package}` | **Keep as honest previews** (Phase 3E `PreviewPill`, "arrives in Phase N"). Do **not** enable. |
| `/companies` | **Convert to real** (was Phase 3 mock). |
| `/contacts` (currently a project sub-nav preview) | **Add global directory** (functional) + keep the **project** contacts tab functional. |
| `/dashboard` | Update mock → real project counts/activity **only if low-risk**; otherwise keep Phase 3E dashboard with real project data feeding the stat strip (recommended: wire "Active projects" + "Recent activity" to real projects; keep requirement/review metrics as honest placeholders). |

**Guardrail:** do **not** make requirements/documents/reviews appear functional. Every converted route drops its preview marker; every still-preview route keeps it. New brand/preview regression tests assert exactly this.

## 18. Navigation update
Global sidebar today: Dashboard · Projects · Companies · Reports(disabled) · Team · Settings. **Add "Contacts"** (OD — recommended) so the reusable directory is reachable org-wide, OR nest Contacts under Companies (two-tab directory). **Decision: add a Contacts sidebar item** (directory is a primary, frequently-used surface for coordinators). Reports stays disabled. Keeps the sidebar at 7 items — still lean.

---

*Continue to [commercial-readiness.md](./commercial-readiness.md).*

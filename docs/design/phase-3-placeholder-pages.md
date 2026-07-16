# FILE: /docs/design/phase-3-placeholder-pages.md

> **Document status:** Phase 3A design — exact definition of every visible Phase 3 page. **Specification only.**
> **Depends on:** [navigation-and-routes.md](./navigation-and-routes.md) (route map), [patterns.md](./patterns.md) (archetypes), [components.md](./components.md).
> **Honesty rule (applies to every page):** each page renders a subtle **"Preview — not yet functional"** marker (a small muted banner or chip in/under the PageHeader). Mock data is clearly fake (e.g., "Sample Construction Co.", "Riverside Medical Office"). **No page implies live analytics, real data, or a working feature.** No network calls, no business tables, no auth.

---

## Shared mock dataset (Phase 3, static, in-repo)

To make the shell reviewable, Phase 3B uses a small static mock module (`apps/web/src/mock/*`, dev-only data, clearly labeled — **not** a DB):
- 1 org: *Sample Construction Co.*
- 3 projects: *Riverside Medical Office* (Closeout In Progress), *Eastgate Retail Buildout* (Active), *Grace Community Church* (Owner Review).
- ~6 mock requirements, ~5 documents, ~3 reviews, ~4 companies, ~3 equipment, ~2 warranties — enough to populate tables/cards. All labeled mock.

---

## 1. Foundation Dashboard — `/dashboard`
- **Route:** `/` → `/dashboard`. **Archetype:** Dashboard. **Functional in:** Phase 11 (analytics/risk).
- **Header:** H1 "Dashboard"; scope control (Org ▾ mock); date-range (mock, labeled "Sample data"); "Preview — not yet functional" marker.
- **Mock content:** 4 MetricCards (*Active projects: 3*, *Requirements due this week: 7*, *Awaiting my review: 2*, *Overdue items: 1*); Attention panel (2 projects with RiskIndicator + driver text); Review queue (2 mock rows → link to a project's Reviews); Recent activity (4 mock provenance rows).
- **Components:** PageHeader, MetricCard, Card, RiskIndicator, StatusBadge, Avatar, Activity rows, Skeleton (loading demo), EmptyState (toggle demo).
- **Empty/loading/error:** Empty ("No projects yet"); Loading (skeleton cards+rows); Error (retry card).
- **Disabled controls:** date range is illustrative; "Customize" disabled.
- **Desktop:** metric row (4-up) → 2-col (attention/review) → activity full width. **Mobile:** stack per [patterns.md §2](./patterns.md).

## 2. Projects — `/projects`
- **Archetype:** List. **Functional in:** Phase 5.
- **Header:** H1 "Projects"; primary action "New project" (**disabled**, tooltip "Available in Phase 5"); Preview marker.
- **Mock content:** DataTable of 3 projects — columns: Name, Type, Status (StatusBadge), Target closeout (Date cell), Risk (RiskIndicator), PM (User cell), ⋯ actions (disabled). Toolbar: search + Filter (mock) + density + column selector.
- **Components:** DataTable, Table toolbar, StatusBadge, RiskIndicator, Pagination, EmptyState.
- **States:** Empty ("No projects yet — create one in Phase 5"); Loading (skeleton rows); Error (retry); No-results (clear filters).
- **Desktop:** full table. **Mobile:** project cards (name, status, due, risk).
- Clicking a row → **Project Overview** (§3) to demonstrate project context.

## 3. Project Overview — `/projects/[projectId]`
- **Archetype:** Detail + mini-dashboard. **Functional in:** Phase 5.
- **Header:** H1 = project name (e.g., "Riverside Medical Office") + project StatusBadge + meta (type, target closeout date); actions (disabled). **Reveals the project sub-nav** (Overview active).
- **Mock content:** summary KeyValue (Owner, Address, PM, Target closeout); completeness Progress bar ("18 of 25 requirements complete" — mock); small counts (missing/overdue/awaiting review); recent project activity (mock).
- **Components:** PageHeader, project sub-nav (Tabs), KeyValue list, Progress, MetricCard, StatusBadge, Activity rows.
- **States:** loading (skeleton), error (retry). Empty rarely (a project always has overview).
- **Desktop:** two-column (summary + activity). **Mobile:** stacked; sub-nav becomes scrollable tabs.

## 4. Requirements — `/projects/[projectId]/requirements`
- **Archetype:** List (project-scoped). **Functional in:** Phase 6.
- **Header:** within project; sub-nav "Requirements" active; "New requirement" (disabled); Preview marker.
- **Mock content:** DataTable — columns: Requirement, Trade, Assigned company (User/Company cell), Status (StatusBadge with the requirement lifecycle), Due (Date, overdue demo), Missing flag demo. Faceted filters (status/trade — mock).
- **Components:** DataTable, StatusBadge (requirement tones), overdue/missing inline flag, Filter, bulk-action bar (disabled).
- **States:** empty ("No requirements yet — added in Phase 6"), loading, error, no-results.
- **Mobile:** requirement cards.

## 5. Documents — `/projects/[projectId]/documents`
- **Archetype:** List. **Functional in:** Phase 8.
- **Header:** sub-nav "Documents"; "Upload" action shown as **disabled dropzone/button** ("Uploads arrive in Phase 8"); Preview marker.
- **Mock content:** DataTable — File cell (type icon + name + size mono), Requirement link, Version (mono), Status (document tones incl. Superseded/Quarantined demo), Uploaded by (User cell), Date.
- **Components:** DataTable, File cell, StatusBadge (document tones), disabled file-upload placeholder.
- **States:** empty ("No documents yet"), loading, error.
- **Mobile:** document cards.

## 6. Reviews — `/projects/[projectId]/reviews`
- **Archetype:** List. **Functional in:** Phase 9.
- **Header:** sub-nav "Reviews"; Preview marker.
- **Mock content:** DataTable of review items — Submission/Requirement, Stage, Reviewer (User cell), Status (review tones: In progress / Approved / Rejected), Updated. A mock "multi-stage" chip to hint sequential review.
- **Components:** DataTable, StatusBadge (review tones), Avatar.
- **States:** empty ("Nothing to review yet"), loading, error.
- **Mobile:** review cards.

## 7. Equipment — `/projects/[projectId]/equipment`
- **Archetype:** List. **Functional in:** Phase 12.
- **Header:** sub-nav "Equipment"; "Add equipment" (disabled); Preview marker.
- **Mock content:** DataTable — Equipment, Manufacturer, Model/Serial (mono), Location, Linked warranty (chip), Linked docs count.
- **Components:** DataTable, KeyValue, Badge.
- **States:** empty ("No equipment yet"), loading, error.
- **Mobile:** equipment cards.

## 8. Warranties — `/projects/[projectId]/warranties`
- **Archetype:** List. **Functional in:** Phase 12.
- **Header:** sub-nav "Warranties"; Preview marker.
- **Mock content:** DataTable — Warranty, Type (manufacturer/contractor Badge), Coverage, Start/End (Date cells), Responsible party, Linked equipment. A "legal accuracy — verify" note chip (honest caveat).
- **Components:** DataTable, StatusBadge/Badge, Date cell.
- **States:** empty, loading, error.
- **Mobile:** warranty cards.

## 9–15. Remaining project tabs (disabled placeholders)
Routes: `/inspections`, `/training`, `/lien-waivers`, `/drawings`, `/package`, `/contacts`, `/activity`.
- **Treatment:** the project sub-nav shows these tabs; each renders a **calm placeholder page**: PageHeader (tab name) + EmptyState with an honest line ("Inspections & Certificates arrive in Phase 12") + a muted illustration-free icon. No mock table.
- **Components:** PageHeader, EmptyState.
- **Mobile:** single column; tab reachable via scroll/"Section ▾".

## 16. Companies — `/companies`
- **Archetype:** List (org-wide). **Functional in:** Phase 5.
- **Header:** H1 "Companies"; "Add company" (disabled); Preview marker.
- **Mock content:** DataTable — Company, Trade(s), Contacts count, Projects count, Primary contact (User cell). This is the org-level subcontractor/contact directory.
- **Components:** DataTable, Avatar, Badge.
- **States:** empty ("No companies yet"), loading, error.
- **Mobile:** company cards.

## 17. Reports — `/reports` (disabled)
- **Archetype:** Placeholder. **Functional in:** Phase 11.
- **Treatment:** sidebar item is **disabled** with a "Later phase" chip; the route (if reached) shows PageHeader "Reports" + EmptyState ("Company-wide analytics and reports arrive in Phase 11") — **no fake charts**.
- **Components:** PageHeader, EmptyState.

## 18. Team — `/team`
- **Archetype:** List (org-wide). **Functional in:** Phase 4.
- **Header:** H1 "Team"; "Invite member" (disabled, "Available in Phase 4"); Preview marker.
- **Mock content:** DataTable — Member (Avatar+name), Email (masked/mock), Role (Badge: Owner/Admin/PM/Coordinator/Reviewer), Status (Active/Invited), Last active (mock). Demonstrates the role vocabulary from [user-roles.md](../product/user-roles.md).
- **Components:** DataTable, Avatar, Badge (roles).
- **States:** empty, loading, error.
- **Mobile:** member cards.

## 19. Settings — General — `/settings` → `/settings/general`
- **Archetype:** Form/Settings (two-pane). **Functional in:** Phase 4.
- **Header:** H1 "Settings"; settings nav (left) with General active; Preview marker.
- **Mock content:** General form — Organization name (mock, disabled), Time zone (Select, disabled), Branding placeholder (logo upload **disabled**), Default density/theme preference toggles (these **do** work as they're client UI prefs). Save button disabled.
- **Components:** Settings two-pane nav, Field, Input, Select, Switch, Theme/Density toggles, disabled file-upload placeholder.
- **States:** loading (skeleton form), read-only banner where applicable.
- **Mobile:** settings nav becomes "Settings section ▾"; form stacks.

## 20. Settings — Members — `/settings/members`
- **Functional in:** Phase 4. Mirrors `/team` inside Settings (or links to it): mock members table + disabled "Invite". (Decide single source: **Team** is the primary; Settings→Members can redirect/link to `/team` to avoid duplication — see [open-design-decisions.md](./open-design-decisions.md).)

## 21. Settings — Requirement Templates — `/settings/templates`
- **Functional in:** Phase 6. Mock list of starter templates (by project type) as a DataTable/cards; "New template" disabled; Preview marker.

## 22–26. Settings — disabled sub-pages
`/settings/trades`, `/settings/billing`, `/settings/integrations`, `/settings/api-keys`, `/settings/security`.
- **Treatment:** listed in settings nav, **disabled**; each renders PageHeader + EmptyState with the honest future-phase line (Trades→6, Billing→16, Integrations→15, API Keys→16, Security & Audit→16). No mock data, no fake controls.

## 27. Component Gallery — `/design` (dev-only)
- **Archetype:** Gallery. **Functional in:** n/a (dev tool).
- **Gating:** rendered **only when `APP_ENV ∈ {local, test}`**, **dynamically** (`export const dynamic = "force-dynamic"` or equivalent) so the gate is per-request; returns **404** in staging/production. **Not linked in any nav.** Addresses Phase 2C **P2C-006**.
- **Content:** every P3-Required component with its variants/states (buttons, inputs, selects, badges incl. **all status tones**, cards, dialogs, drawers, tabs, table, empty/loading/error states, toasts, tooltips), plus a **theme + density switcher** and a **contrast/readout** panel. This is the living design-system reference (chosen over Storybook — see [open-design-decisions.md](./open-design-decisions.md)).
- **States:** the gallery itself demonstrates empty/loading/error variants inline.
- **Mobile:** sections stack; used mainly on desktop.

---

## Page → components → future-phase summary

| Page | Archetype | Key components | Functional in |
|------|-----------|----------------|---------------|
| Dashboard | Dashboard | MetricCard, RiskIndicator, Activity | 11 |
| Projects | List | DataTable, StatusBadge, RiskIndicator | 5 |
| Project Overview | Detail | Sub-nav, KeyValue, Progress | 5 |
| Requirements | List | DataTable, StatusBadge, Missing flag | 6 |
| Documents | List | DataTable, File cell, upload placeholder | 8 |
| Reviews | List | DataTable, review StatusBadge | 9 |
| Equipment | List | DataTable | 12 |
| Warranties | List | DataTable, Date cells | 12 |
| Inspections/Training/Lien/Drawings/Package/Contacts/Activity | Placeholder tabs | PageHeader, EmptyState | 12–13 (10 for Activity, 5 for Contacts) |
| Companies | List | DataTable, Avatar | 5 |
| Reports | Placeholder | EmptyState | 11 |
| Team | List | DataTable, role Badge | 4 |
| Settings/* | Form/Settings | Two-pane nav, Field, disabled controls | 4/6/15/16 |
| Component Gallery | Gallery (dev) | all primitives | n/a |

**Every page above is mock/placeholder. None creates business data, calls an API, or implements a feature.**

---

*Continue to [phase-3-implementation-plan.md](./phase-3-implementation-plan.md).*

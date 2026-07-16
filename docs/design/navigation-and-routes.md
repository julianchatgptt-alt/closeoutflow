# FILE: /docs/design/navigation-and-routes.md

> **Document status:** Phase 3A design — navigation model & Phase 3 route map. **Specification only; no real routing behavior beyond placeholder pages.**
> **Depends on:** [product-requirements.md §F modules](../product/product-requirements.md), [user-roles.md](../product/user-roles.md), [application-shell.md](./application-shell.md), [statuses.md](../product/statuses.md).

---

## 1. Navigation philosophy

CloseoutFlow is **project-centric**. Almost all real work (requirements, documents, reviews, equipment, warranties, packages) happens **inside a project**. Therefore:

- **Global sidebar = org-wide entry points only** (a short list).
- **Project modules = a contextual sub-navigation inside a project**, not global sidebar items.
- **External portals (subcontractor, owner) are separate surfaces**, never mixed into the internal sidebar.

This split is the single most important navigation decision and directly prevents an overloaded sidebar.

---

## 2. Classifying every Phase 1 module

Reviewing [product-requirements.md §F](../product/product-requirements.md), each module is placed as **Global**, **Project-scoped**, **Settings**, **External**, or **Non-nav** (background/infra).

| Module | Placement | Rationale |
|--------|-----------|-----------|
| Dashboards (portfolio) | **Global** | Org-wide overview across projects. |
| Projects | **Global** | The list + entry to each project workspace. |
| Subcontractors / Contacts directory | **Global → "Companies"** | Org-level reusable directory (SUB-001); reused across projects. |
| Analytics / Reports | **Global (disabled in Phase 3)** | Org-wide; Expansion tier — show but disabled. |
| Teams & Permissions | **Global → "Team"** (or under Settings) | Org membership/roles. Placed as a top-level utility item. |
| Organizations / Billing / Integrations / API / Security-Audit / Templates / Rules / Trades | **Settings** | Org configuration, not day-to-day destinations. |
| Project Requirements | **Project-scoped** | Lives in a project. |
| Document Management | **Project-scoped** | Documents belong to a project's requirements/records. |
| Review Workflows / PDF Annotations | **Project-scoped** (+ cross-project review inbox via Dashboard/notifications) | Reviews are per submission; a reviewer's cross-project queue surfaces on the Dashboard, not as a sidebar module. |
| Equipment Registry | **Project-scoped** | Building assets of a project. |
| Warranties | **Project-scoped** | Tied to project/equipment. |
| Inspections & Certificates | **Project-scoped** | Per project (CO, etc.). |
| Training Records | **Project-scoped** | Per project. |
| Lien-Waiver Tracking | **Project-scoped** | Per project/sub. |
| As-Built Drawings | **Project-scoped** | Per project. |
| Package Builder / Digital O&M | **Project-scoped** | Per project deliverable. |
| Communication Center | **Project-scoped** (Activity) + requirement-level | Contextual to project/requirement. |
| Notifications | **Global header entry** (not a nav module) | In-app bell. |
| Search | **Global header/command palette** (not a nav module) | Cross-cutting. |
| Upload Portal | **External (subcontractor)** | Not in internal shell. |
| Owner Portal / long-term access | **External (owner)** | Not in internal shell. |
| Imports/Exports | **Settings / contextual actions** | Not a standalone destination. |
| Platform Administration | **Separate platform-admin surface** | CloseoutFlow staff only; out of tenant shell. |

**Result — Global sidebar (final):** Dashboard · Projects · Companies · Reports*(disabled)* · Team · Settings. **Six items.** Everything else is project-scoped, settings, external, or header-level.

---

## 3. Final navigation model

### 3.1 Global (org-wide) — sidebar
1. **Dashboard** — portfolio overview + (for reviewers) cross-project attention/review queue.
2. **Projects** — list of projects → each opens a **project workspace**.
3. **Companies** — subcontractor/contact directory (org-level).
4. **Reports** — *disabled in Phase 3* ("Available in a later phase"; Expansion tier).
5. **Team** — org members & roles (mock in Phase 3).
6. **Settings** — org configuration (see §3.3).

### 3.2 Project-scoped — project sub-nav (inside `/projects/[projectId]`)
`Overview · Requirements · Documents · Reviews · Equipment · Warranties · Inspections · Training · Lien Waivers · Drawings · Package · Contacts · Activity · Settings`

- **Phase 3 renders a representative subset as real placeholder tabs** (Overview, Requirements, Documents, Reviews, Equipment, Warranties) and the remainder as **disabled tabs** ("later phase") so the full shape is visible without over-building. See §5.

### 3.3 Settings navigation (sub-nav within `/settings`)
`General · Members (Team) · Requirement Templates · Trades & Divisions · Billing (disabled) · Integrations (disabled) · API Keys (disabled) · Security & Audit (disabled) · Notifications`

- Settings is a **two-pane** layout (left settings nav, right content) on desktop; stacked on mobile. Most sub-pages are placeholders in Phase 3; enterprise/expansion ones are visibly disabled.

### 3.4 Future external portals (NOT in the internal shell)
- **Subcontractor portal** — account-free, mobile-first, single-purpose; its own minimal shell (designed in Phase 7).
- **Owner portal** — long-term, branded, read/download; its own shell (Phase 14).
- These are **listed here only to reserve their route namespaces** and to state explicitly that they must never appear in the internal sidebar.

---

## 4. Route naming conventions

- **Lowercase, kebab-case** segments; plural collection nouns (`/projects`, `/companies`), singular for a specific entity via id (`/projects/[projectId]`).
- **Project workspace** nests modules: `/projects/[projectId]/requirements`.
- **Settings** nests: `/settings/members`.
- **External** namespaces reserved (not built in Phase 3): `/portal/*` (subcontractor), `/owner/*` (owner). Internal app lives under a route group `(app)`; external under `(portal)`/`(owner)` route groups per [repository-structure.md](../architecture/repository-structure.md).
- **Dev-only** component gallery: `/design` (route group `(dev)` or reuse existing `(marketing)/playground`), **runtime-gated to local/test** (see §7).

---

## 5. Complete Phase 3 placeholder route table

Legend — **Scope:** Org / Project / Settings / Dev. **Visible:** shown in Phase 3. **Mock:** uses mock content. **Disabled:** intentionally non-functional affordance. **Functional in:** the future phase that makes it real.

| # | Route path | Page name | Nav location | Scope | Visible P3 | Mock | Disabled | Functional in |
|---|-----------|-----------|--------------|-------|:----------:|:----:|:--------:|---------------|
| 1 | `/` → `/dashboard` | Dashboard | Sidebar | Org | ✅ | ✅ | — | 11 (analytics/risk) |
| 2 | `/projects` | Projects | Sidebar | Org | ✅ | ✅ | — | 5 |
| 3 | `/projects/[projectId]` | Project Overview | Project sub-nav | Project | ✅ | ✅ | — | 5 |
| 4 | `/projects/[projectId]/requirements` | Requirements | Project sub-nav | Project | ✅ | ✅ | — | 6 |
| 5 | `/projects/[projectId]/documents` | Documents | Project sub-nav | Project | ✅ | ✅ | — | 8 |
| 6 | `/projects/[projectId]/reviews` | Reviews | Project sub-nav | Project | ✅ | ✅ | — | 9 |
| 7 | `/projects/[projectId]/equipment` | Equipment | Project sub-nav | Project | ✅ | ✅ | — | 12 |
| 8 | `/projects/[projectId]/warranties` | Warranties | Project sub-nav | Project | ✅ | ✅ | — | 12 |
| 9 | `/projects/[projectId]/inspections` | Inspections & Certificates | Project sub-nav | Project | ✅ (tab) | — | ✅ | 12 |
| 10 | `/projects/[projectId]/training` | Training | Project sub-nav | Project | ✅ (tab) | — | ✅ | 12 |
| 11 | `/projects/[projectId]/lien-waivers` | Lien Waivers | Project sub-nav | Project | ✅ (tab) | — | ✅ | 12 |
| 12 | `/projects/[projectId]/drawings` | Drawings (As-builts) | Project sub-nav | Project | ✅ (tab) | — | ✅ | 12 |
| 13 | `/projects/[projectId]/package` | Package & O&M | Project sub-nav | Project | ✅ (tab) | — | ✅ | 13 |
| 14 | `/projects/[projectId]/contacts` | Project Contacts | Project sub-nav | Project | ✅ (tab) | — | ✅ | 5 |
| 15 | `/projects/[projectId]/activity` | Activity | Project sub-nav | Project | ✅ (tab) | — | ✅ | 10 |
| 16 | `/companies` | Companies | Sidebar | Org | ✅ | ✅ | — | 5 |
| 17 | `/reports` | Reports | Sidebar (disabled) | Org | ✅ (disabled) | — | ✅ | 11 |
| 18 | `/team` | Team | Sidebar | Org | ✅ | ✅ | — | 4 |
| 19 | `/settings` → `/settings/general` | Settings — General | Sidebar | Settings | ✅ | ✅ | — | 4 |
| 20 | `/settings/members` | Settings — Members | Settings nav | Settings | ✅ | ✅ | — | 4 |
| 21 | `/settings/templates` | Settings — Requirement Templates | Settings nav | Settings | ✅ | ✅ | — | 6 |
| 22 | `/settings/trades` | Settings — Trades & Divisions | Settings nav | Settings | ✅ (disabled) | — | ✅ | 6 |
| 23 | `/settings/billing` | Settings — Billing | Settings nav | Settings | ✅ (disabled) | — | ✅ | 16 |
| 24 | `/settings/integrations` | Settings — Integrations | Settings nav | Settings | ✅ (disabled) | — | ✅ | 15 |
| 25 | `/settings/api-keys` | Settings — API Keys | Settings nav | Settings | ✅ (disabled) | — | ✅ | 16 |
| 26 | `/settings/security` | Settings — Security & Audit | Settings nav | Settings | ✅ (disabled) | — | ✅ | 16 |
| 27 | `/design` | Component Gallery | Dev only | Dev | ✅ (local/test only) | ✅ | — | n/a (dev) |
| — | `/portal/*` | Subcontractor portal | External | — | ❌ reserved | — | — | 7 |
| — | `/owner/*` | Owner portal | External | — | ❌ reserved | — | — | 14 |

**Count:** **26 in-app placeholder routes** (1–26) + **1 dev-only gallery** (27) = **27 Phase 3 routes**; plus 2 reserved external namespaces not built in Phase 3.

> Routes 9–15 exist as **project sub-nav tabs** that render a small "This section arrives in Phase N" placeholder (disabled), so the full project workspace shape is visible without building business content. Routes marked *disabled* in the sidebar/settings render a non-interactive item + a short explanation page.

---

## 6. Visibility & disabled-feature treatment

- **Visible + mock:** looks real (shell, tables, cards, empty states) using clearly-labeled mock data; never claims live analytics.
- **Disabled (nav item):** rendered greyed with a small "Later phase" chip and a tooltip; clicking either does nothing or opens a short honest placeholder page ("Reports arrive in Phase 11").
- **Disabled (project tab):** the tab is present but non-selectable/greyed with the same affordance.
- **Never hide** the disabled items in Phase 3 — showing the product's full shape (honestly labeled) is a goal of the shell review. (In production later, items gate on role/plan/feature-flag.)
- **Honesty rule:** every mock/placeholder page carries a subtle **"Preview — not yet functional"** marker so no one mistakes it for a working feature ([phase-3-placeholder-pages.md](./phase-3-placeholder-pages.md)).

---

## 7. Component gallery route (dev-only, production-safe)

- Path `/design` (or keep existing `/playground`), **runtime-gated to `APP_ENV ∈ {local, test}`** and rendered **dynamically** so the gate resolves per request — directly addressing Phase 2C finding **P2C-006** (a static gate could leak in production).
- In staging/production it returns **404** (`notFound()`), and the nav never links to it. It is **not** in the sidebar. See [phase-3-implementation-plan.md](./phase-3-implementation-plan.md) and [open-design-decisions.md](./open-design-decisions.md).

---

## 8. Mobile navigation

- **Global nav:** off-canvas left drawer via header hamburger (the same 6 sidebar items). Full-height, focus-trapped, `Esc`/backdrop to dismiss.
- **Project sub-nav:** horizontally scrollable tab strip under the header; on the narrowest widths, collapses to a **"Section ▾" dropdown** listing the tabs (with disabled ones marked).
- **Settings nav:** the settings left-pane becomes a top **"Settings section ▾"** selector; content stacks below.
- **No bottom tab bar** in Phase 3 (the internal app has more than ~5 destinations and is desktop-primary); a bottom bar may be reconsidered for the external mobile portals in their phases.

---

## 9. Breadcrumb rules

- Pattern: `{Section} › {Entity} › {Sub-section}`. Examples:
  - `Projects › Riverside Medical Office › Requirements`
  - `Companies › Ace Mechanical`
  - `Settings › Members`
- First crumb links to the section list; middle crumbs link; **last crumb = current page (not a link)**.
- Long entity names truncate with ellipsis + accessible tooltip; mobile shows `‹ {parent}` + current title.
- Breadcrumbs are generated from the route, not hand-authored per page.

## 10. Page-title rules

- Page `<h1>` = the route's **Page name** (table §5). Document `<title>` = `{Page} · {Project?} · CloseoutFlow`.
- Disabled/placeholder pages still have a proper H1 + the "Preview — not yet functional" marker.
- One `<h1>` per page; sections use `<h2>`/`<h3>` per [accessibility-and-responsive.md](./accessibility-and-responsive.md).

---

## 11. Confirmations against the design-review checklist

- ✅ Sidebar limited to **6 org-wide items** (not overloaded).
- ✅ Global vs project-scoped navigation are **distinct** (sidebar vs project sub-nav).
- ✅ External portals (`/portal`, `/owner`) are **reserved, not in the internal shell**.
- ✅ Every placeholder route is **honestly labeled** as preview/disabled.
- ✅ Route map creates **no business behavior** (mock/placeholder only).

---

*Continue to [components.md](./components.md).*

# FILE: /docs/requirements/routes-and-workflows.md

> **Document status:** Phase 6A specification — routes, access matrix, register/library UX, apply flow, states, responsive, a11y, overview integration, placeholder conversion. **Reuse the Phase 3E design system; do not redesign.**
> **Reuse (existing components):** `AppShell`, `PageHeader` + `PreviewPill`, `DataTable` (+ card fallback), `Card`, `Field`/`Input`/`Select`/`Combobox`/`Switch`, `Button`, `Dialog`/`AlertDialog`/`Sheet`, `DropdownMenu`, `Toast`, `EmptyState`/`ErrorState`/`PermissionDenied`, `StatusBadge`, `Avatar`, `Skeleton`, `Breadcrumbs`, `ProjectSubnav`. Forms: `react-hook-form` + `zod`.
> **Related:** [requirement-templates.md](./requirement-templates.md), [requirements-and-lifecycle.md](./requirements-and-lifecycle.md), [commercial-readiness.md](./commercial-readiness.md).

---

## 1. Route map

| Route | Purpose |
|-------|---------|
| `/templates` | Template library (functional; **new sidebar item**, ROD-4). |
| `/templates/new` | Create template (dialog primary; page fallback for deep link/mobile). |
| `/templates/[templateId]` | Template detail/builder (draft editable; published read-only + actions; version switcher). |
| `/settings/templates` | **Redirects** to `/templates` (route preserved; settings nav item points at the library). |
| `/projects/[projectId]/requirements` | **Requirement register** (converted from preview — the major Phase 6 surface). |
| `/projects/[projectId]/requirements/apply` | Apply-template flow (sheet-first; route exists for deep-linking/mobile full-screen). |
| `/projects/[projectId]/requirements/[requirementId]` | Requirement detail (sheet on desktop from the register; full page on mobile/deep link). |

**No route proliferation:** create/edit requirement and assignment are dialogs/sheets on the register; category management is a sheet inside the template library (`/templates` toolbar), not a route. All Phase 6 routes are private, authenticated, and **noindex** (existing authenticated-workspace metadata conventions; no public SEO pages).

**Navigation:** sidebar gains **Templates** (Dashboard · Projects · Companies · Contacts · Templates · Reports · Team · Settings — 8 items, ROD-4). Project sub-nav's Requirements tab drops its preview marker; Documents/Reviews/Equipment/Warranties/Inspections/Training/Lien Waivers/Drawings/Package keep honest previews.

## 2. Route-access matrix

| Route | Auth | Org | Perm | No access → | Archived |
|-------|:---:|:---:|------|-------------|----------|
| `/templates`, `/templates/[id]` | ✔ | ✔ | `template.view` | `PermissionDenied` | archived via filter; read-only |
| template mutations | ✔ | ✔ | `template.manage/publish/archive` | denied | blocked |
| `/projects/[id]/requirements*` | ✔ | ✔ | `project.view` + `can_access_project` | non-enumerating not-found | read-only banner |
| requirement mutations | ✔ | ✔ | `requirement.*` per action | denied | write-blocked |

Deny-by-default: unknown role/permission, suspended/removed membership, removed assignment, archived org, cross-tenant id → deny with no existence leak.

## 3. Requirement register (`/projects/[projectId]/requirements`)

**An operational closeout register, not a spreadsheet clone.** Structure:

- **Header band:** title + real summary chips from `get_requirement_summary` — "42 requirements · 6 unassigned · 9 without due dates · 3 not applicable" — each chip is a filter shortcut. Primary actions: **Add requirement** · **Apply template** (both permission-gated; viewers see neither).
- **Category sections:** requirements grouped under category headers (org category order), each header showing a count and collapse control. Within a category, rows follow `sort_order`.
- **Row (desktop table):** Title (+ optional-flag tick and "From {Template} v{n}"/"Custom" source line) · Responsible company (or quiet "Unassigned" chip) · Internal owner (avatar) · Due date (+ "Planned date passed" tint when applicable) · Status (`StatusBadge`: "Planned" for `active`, "Not applicable" — assignment completeness is communicated by the responsibility columns and derived attention chips, never by the status value) · Priority (only when non-normal — avoid ink) · overflow menu (Edit, Assign, Set due date, Mark N/A, Archive). Row click opens the detail sheet.
- **Attention surfacing:** a "Needs attention" filter chip renders the derived **setup attention required** indicator — unassigned responsible company ∨ unassigned internal owner ∨ missing due date ∨ stale company/contact/member reference ([requirements-and-lifecycle §5](./requirements-and-lifecycle.md), [responsibility-and-dates §4](./responsibility-and-dates.md)) — the register's "next action" engine. Assigning or removing responsibility updates these chips immediately; no lifecycle transition is involved.
- **Toolbar:** search (title, trigram) · filters (category, responsible company, internal owner, status incl. N/A, due-date range, unassigned, no-due-date, optional-only, source template, archived off-by-default) · sort (register order default; due date; title) · bulk-select toggle. Filters serialize to URL (shareable, resumable).
- **Selection & bulk bar:** checkbox column (shift-range support); selected count + "across current filter" clarity; bulk bar (bottom-fixed) with Assign company · Assign owner · Set category · Set due date · Mark N/A · Archive · Restore · Move/reorder. Destructive/binding actions get typed-count `AlertDialog`s. Cap = one loaded page (≤200).
- **Reorder:** drag handle within a category (desktop) + keyboard/menu "Move up/down/to category…" alternative (a11y-mandatory); mobile uses the menu only.
- **Pagination:** cursor "Load more" per §performance; category headers repeat counts so partial loads stay honest ("Showing 100 of 480").
- **States:** first-run empty (§7 journey — value copy + Apply template + Add requirement + starter hint); no-results (clear filters); per-panel error + retry; skeleton rows matching layout; permission-denied; archived-project read-only banner; archived/N-A rows visually quieted (never hidden truth).
- **Long content:** names truncate with tooltip/accessible full text; no horizontal document scroll — the table region owns overflow.

## 4. Requirement detail (sheet/page)

Identity (title, category, source, required/optional, priority, trade) · Responsibility block (three slots with pickers, honest "Requests are sent when the subcontractor portal arrives" note) · Due date · Notes/description · N-A state + reason when applicable · Audit trail excerpt (this requirement's activity events, from the existing activity read path filtered by target) · actions per permission. Edit-in-place per section with `updated_at` concurrency guard and the Phase 5D stale-reconcile pattern.

## 5. Template library & builder (`/templates*`)

Per [requirement-templates §7](./requirement-templates.md):

- **List:** `DataTable` — Name (+ starter/description line) · Status+version chip ("v3 · Published", "v4 · Draft in progress") · Items · Categories · Updated (+by). Search, status/archived filters, **New template**, overflow (Clone, Archive/Restore, Preview). Card fallback on mobile. Empty state: value line + "Use the starter template" + "Start blank" + verification disclaimer.
- **Detail/builder:** header (name, status, version pills, actions); category-grouped item list. **Draft:** inline add/edit rows (title, category, optional toggle, role hint, due-rule, priority, trade), drag + keyboard reorder, batch-saved with dirty-state indicator; "Publish" (confirm dialog: "Publishing locks v{n}. Projects apply published versions."). **Published:** read-only + "Edit as new version", "Apply to project…" (project picker honoring project access → jumps into the apply flow), Clone, Archive. Version switcher lists the chain with published dates.
- **Category manager sheet:** rename/reorder/add/archive org categories with impact notes ("Used by 3 templates and 120 requirements — renames apply everywhere").

## 6. Apply-template flow

The 7-step workflow of [requirement-templates §6](./requirement-templates.md) rendered as a **two-screen sheet** (Select+Preview → Configure+Confirm), desktop right-sheet / mobile full-screen. Progress is visible, every step skippable except confirm; total interaction target ≤ 90 seconds for a default apply. Duplicate/skip counts always visible before confirm. On success: toast + register with new-row highlight + next-action banner. Failure: full rollback, retained selections, friendly retry.

## 7. Project overview integration

The overview's requirement panel (previously an honest placeholder) becomes real:

- **With requirements:** count + unassigned + missing-due-date + N/A counts; top categories with counts; next 3 upcoming due dates; a single "Setup progress" bar derived purely from configuration (assigned + dated share), labeled as setup; CTA → register (deep-filtered to "Needs attention").
- **Without requirements:** the setup checklist's "Add closeout requirements" step activates (Apply template / Add requirement CTAs) — replacing the Phase 5 "arrives in Phase 6" deferral.
- **Never shown:** submitted/approved/rejected counts, completion %, readiness scores, risk — those panels keep their honest deferral copy for Phases 8–11.

Dashboard: no new Phase 6 stat unless trivially real (org requirement counts are cross-project noise — skip; keep the Phase 5 dashboard unchanged).

## 8. Accessibility (WCAG 2.2 AA — Phase 3E foundation)

Labelled fields + error association + focus-to-first-error; dialog/sheet focus trap + focus return; `DataTable` `aria-sort`/`scope`/caption + sr-only selection labels ("Select HVAC O&M manual"); bulk bar as an `aria-live`-announced region with selection count; status chips icon+text (never color-alone); **reorder has full keyboard + menu alternative**; date inputs operable by keyboard with a plain text field + picker; N-A/archive confirmations are `AlertDialog`s with explicit labels; live-region announcements on assign/date/N-A/bulk completion ("6 requirements assigned to Ace Mechanical"); 44px touch targets; reduced-motion honored (no highlight animation); long-name truncation preserves accessible names; category collapse state announced.

## 9. Responsive behavior

| Viewport | Register | Library/Builder | Apply flow |
|----------|----------|-----------------|------------|
| 1920/1440 | full table, sticky header band + toolbar, sheet detail | two-pane comfortable | right sheet |
| Laptop | same, tighter columns (owner collapses into responsible column stack) | same | same |
| Tablet landscape | table retained; overflow scroll inside region | table | sheet |
| Tablet portrait | hybrid: condensed table (title/responsible/due/status) | cards | full-screen sheet |
| Pixel 7 / iPhone 15 | **cards**: title + source line; responsible + owner; due + status chips; tap → full-page detail; sticky bottom Add/Apply; bulk via select mode with bottom action bar; filters in a sheet | cards; builder editable but move-menus replace drag | full-screen stepper, sticky confirm, safe-area insets |

No horizontal document clipping anywhere; mobile keyboards never obscure the active field (scroll-into-view); long company/contact names truncate with expansion.

## 10. Placeholder conversion plan

| Route | Phase 6 action |
|-------|----------------|
| `/projects/[id]/requirements` | **Convert to real** (drop `PreviewPill`). |
| `/settings/templates` | **Redirect** to `/templates`; settings nav relabeled to link out. |
| `/templates` (new) | Build functional. |
| `/projects/[id]/{documents,reviews,equipment,warranties,inspections,training,lien-waivers,drawings,package}` | **Keep honest previews** — update requirement-adjacent copy where it referenced "Phase 6" to the correct future phase. |
| `/settings/trades` | remains disabled (rules/taxonomy phase). |
| Project overview | Requirement panel + setup-checklist step become real (§7). |

Brand/preview regression tests updated to assert exactly this conversion set.

---

*Continue to [commercial-readiness.md](./commercial-readiness.md).*

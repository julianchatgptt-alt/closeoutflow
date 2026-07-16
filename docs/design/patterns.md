# FILE: /docs/design/patterns.md

> **Document status:** Phase 3A design — reusable UI patterns. **Specification only.**
> **Depends on:** [statuses.md](../product/statuses.md) (authoritative status names), [workflows.md](../product/workflows.md), [design-tokens.md](./design-tokens.md), [components.md](./components.md), [accessibility-and-responsive.md](./accessibility-and-responsive.md).

---

## 1. Page archetypes

Five reusable page shapes. Every route in [navigation-and-routes.md](./navigation-and-routes.md) maps to one.

| Archetype | Used by | Structure | Max width |
|-----------|---------|-----------|-----------|
| **Dashboard** | `/dashboard`, project Overview | PageHeader + scope controls + metric cards + attention panel + queues + activity | 1440px |
| **List** | Projects, Companies, Requirements, Documents, Reviews, Equipment, Warranties | PageHeader + Table toolbar + DataTable + pagination | 1440px |
| **Detail** | a project, a company, (later) a requirement/document | PageHeader (with status) + summary meta + tabs/sections + related lists | 1120px |
| **Form / Settings** | Settings pages, create/edit (later) | PageHeader + sectioned form (single column) | 640px |
| **Placeholder** | disabled routes/tabs | PageHeader + honest "later phase" empty state | 640–1120px |

---

## 2. Dashboard pattern

- **PageHeader:** "Dashboard" + scope control (org / division ▾ — mock) + date range (mock, clearly non-live).
- **Metric cards row:** 3–5 `MetricCard`s (e.g., *Active projects*, *Requirements due this week*, *Awaiting my review*, *Overdue items*). Each: label, big tabular number, optional delta (mock, labeled), small icon. **No fabricated trend charts.**
- **Attention / risk panel:** list of at-risk projects with `RiskIndicator` + top driver text ("3 overdue, review backlog"). Explainable, never a bare score.
- **Review queue:** compact list "Awaiting my review" (mock) → links to project Reviews.
- **Recent activity:** short `Activity`-style list (mock, labeled) — provenance-forward (who/what/when).
- **States:** empty ("No projects yet — projects appear here once created in a later phase"), loading (skeleton cards + rows), error (inline error card + retry).
- **Mobile stacking order:** metric cards (2-up→1-up) → attention/risk → review queue → recent activity. Scope/date controls collapse into a "Filters ▾".

## 3. List page pattern

- **Table toolbar:** left = search field + Filter button (faceted, mock) + active-filter chips; right = density toggle + column selector + primary action ("New …", disabled where not yet functional).
- **DataTable** (see §5) with pagination; selection reveals the **bulk-action bar**.
- **States:** empty (icon + "No {items} yet" + primary action or "arrives in Phase N"), loading (skeleton rows), error (row-region error + retry), no-results-after-filter ("No matches — clear filters").

## 4. Detail page pattern

- **PageHeader:** entity name (H1) + `StatusBadge` + key meta (e.g., project type, target closeout date) + actions.
- **Summary strip:** `KeyValue`/metadata list (owner, address, PM, due date) with tabular values.
- **Body:** tabs or sections for related records; each related list is a compact DataTable or card list.
- **Provenance:** "Created by / Updated" line; version/history entry point where relevant.

## 5. Tables & data grids (the workhorse)

- **Density:** comfortable default (`--row-h` 44px), compact toggle (40px); header `--row-h-header` 44px, `--surface-sunken`, sticky on vertical scroll.
- **Headers:** sortable columns show a sort affordance + `aria-sort`; click/Enter to cycle asc/desc/none.
- **Search:** per-table text search in toolbar (client-side over mock in Phase 3).
- **Filtering:** faceted Filter menu → active-filter chips (removable). Mock facets in Phase 3.
- **Column visibility:** column selector menu; persisted per table (localStorage) later.
- **Selection & bulk actions:** row checkboxes + header select-all → sticky **bulk-action bar** (count + actions, all disabled/mock in Phase 3). Selection is keyboard-accessible.
- **Sticky:** sticky header always; **sticky first column** (entity name) optional for wide tables; horizontal scroll within an `overflow-x-auto` container so the **page never scrolls horizontally**.
- **Pagination:** cursor-style UI (Prev/Next + page size), **no infinite scroll** for records.
- **Cell renderers:**
  - **Status cell:** `StatusBadge` (icon + label + tone).
  - **Date cell:** absolute date `MMM D, YYYY`, tabular; relative in tooltip ("in 3 days"); overdue dates get amber text + warning icon.
  - **File cell:** file-type icon + name + size (mono); click = (later) open; Phase 3 non-functional.
  - **User cell:** Avatar (initials) + name; external actors labeled.
  - **Actions cell:** trailing icon-button "⋯" → DropdownMenu (row actions, mock/disabled).
- **Responsive:** `< md` the table becomes a **card/stacked list** — each row a card with label:value pairs and the status/actions; not a horizontally-scrolled desktop table.
- **States:** empty/loading(skeleton rows)/error(retry)/no-results — all specified above.
- **Keyboard:** roving focus across cells/rows optional; at minimum, all interactive cell controls are tab-reachable, headers operable, `Space`/`Enter` toggles selection.

## 6. Filters pattern

- Filter button opens a Popover/menu of facets (status, trade, assignee, due — mock). Applied filters render as **removable chips** in the toolbar. "Clear all" resets. On mobile, filters open in a bottom **Sheet**.

## 7. Search pattern

- **Three surfaces:** (a) **global** command palette (`⌘K`) — cross-entity + commands; (b) **table search** — scoped to the current list; (c) **field search** inside comboboxes.
- **Command palette states:** idle (Recent + suggested commands), typing (grouped results), loading (subtle spinner), empty ("No results for '…'"), error (retry). Permission-aware in later phases (results only for what the user can see); Phase 3 uses mock results.
- **Mobile:** palette becomes full-screen; header search is an icon that opens it.

## 8. Forms pattern

- **Field anatomy:** `Label` (top, `--text-body-strong`) + required marker (`*` with `aria-required`, and the word "required" for SR) + control + help text (`--muted-foreground`, `aria-describedby`) + error (`--danger-foreground` + icon, `aria-describedby`, `role="alert"` on submit).
- **Validation timing:** validate on **submit** and on **blur after first interaction**; do not error-flash while typing a first value. Inline errors appear beneath the field; a form-level error summary appears at top for multi-error submits (focus moves to summary).
- **Controls:** heights from tokens (`--control-h` 40 default); Textareas auto-grow within limits; Select/Combobox/Multi-select/Date input per [components.md](./components.md); Switch for on/off, Checkbox for multi, Radio for one-of-few.
- **File input:** Phase 3 shows a **disabled dropzone visual** ("Uploads arrive in Phase 8") — no real upload.
- **Sections & multi-step:** group with section headers/separators; multi-step uses a **Stepper** (design specified, built when first needed in Phase 4) with a persistent progress indicator and back/next; never cram multi-step into a modal.
- **Save states:** primary button shows loading/disabled during submit; success → toast + (for edits) inline "Saved" affordance.
- **Unsaved changes:** navigating away from a dirty form triggers a **confirm dialog** ("Discard changes?"). Disabled/read-only forms clearly indicate non-editability.
- **Mobile:** single column, full-width controls, 44px targets, sticky primary action.
- **Accessibility:** every control labelled; errors programmatically associated; focus moves to first error on failed submit.

## 9. Status system (authoritative — mapped to statuses.md)

**Rules:** every status is **icon + text label + tone** (never color alone). Badges are rectangular-rounded (`--radius-sm/md`), `--text-xs`, tone from the `-subtle` bg + `-foreground` text + `-border`. **Badge vs banner vs inline:** *Badge* = an entity's own status in lists/headers; *Banner* = page-level state affecting the whole view (read-only, permission, system); *Inline indicator* = a flag/dot next to a value (overdue, missing).

**Tone mapping** (tones from [design-tokens.md](./design-tokens.md); icons from Lucide):

### Project ([statuses.md §A](../product/statuses.md))
| Status | Tone | Icon |
|--------|------|------|
| Draft | neutral | `file` |
| Active | info | `hammer`/`activity` |
| Closeout In Progress | info | `list-checks` |
| Owner Review | owner (violet) | `user-check` |
| Published | success | `check-circle` |
| Complete | success | `badge-check` |
| Archived | neutral (muted) | `archive` |
| Cancelled | danger (muted) | `x-circle` |

### Requirement ([§B](../product/statuses.md)) — plus the **Missing** flag
| Status | Tone | Icon |
|--------|------|------|
| Not assigned | neutral | `circle-dashed` |
| Requested | info | `send` |
| Submitted | info | `upload` |
| Processing | info | `loader` |
| Under review | info | `eye` |
| Approved | success | `check` |
| Approved with conditions | warning | `check` + note |
| Rejected | danger | `x` |
| Not applicable requested | neutral | `help-circle` |
| Not applicable approved | neutral (muted) | `minus-circle` |
| Waived | neutral (muted) | `shield-off` |
| Complete | success | `check-circle` |
| **Missing (flag)** | **warning (amber), rendered as inline flag not a status badge** | `alert-triangle` |

### Document ([§C](../product/statuses.md))
| Status | Tone | Icon |
|--------|------|------|
| Uploading / Processing | info | `loader` |
| Available | neutral | `file` |
| Failed processing | danger | `alert-octagon` |
| Classified | info | `tag` |
| Under review | info | `eye` |
| Approved | success | `check` |
| Superseded | neutral (muted) | `history` |
| Quarantined | danger | `shield-alert` |
| Archived | neutral (muted) | `archive` |
| Deleted | neutral (muted) | `trash` |

### Review ([§D](../product/statuses.md))
Not started (neutral `circle`) · Assigned (info `user`) · In progress (info `eye`) · Approved (success `check`) · Approved with conditions (warning `check`) · Rejected (danger `x`) · Cancelled (neutral `x-circle`) · Superseded (neutral `history`).

### Package ([§E](../product/statuses.md))
Draft (neutral) · Generating (info `loader`) · Validation failed (warning `alert-triangle`) · Ready for review (info `eye`) · Approved (success `check`) · Published (success `check-circle`) · Superseded (neutral `history`) · Archived (neutral `archive`).

### Invitation ([§F](../product/statuses.md))
Pending (info `mail`) · Active (info `link`) · Accepted (success `check`) · Expired (neutral `clock`) · Revoked (danger `x-circle`).

### Notification ([§G](../product/statuses.md))
Queued (neutral) · Processing (info) · Delivered (success `check`) · Deferred (warning `clock`) · Bounced (danger `alert-triangle`) · Failed (danger `x`) · Suppressed (neutral `bell-off`) · Opened (success `mail-open`). *(Shown in admin/notification views, not as user-facing badges everywhere.)*

### Subscription ([§H](../product/statuses.md))
Trialing (info) · Active (success) · Past due (warning) · Suspended (danger) · Cancelled (neutral) · Expired (neutral muted). *(Billing/Settings context only.)*

**Restraint:** a screen shows at most ~3 tones at once; de-emphasized/closed states (Archived, Superseded, Waived, N/A) use the muted neutral so they recede.

## 10. Risk indicators

- **RiskIndicator** shows **Low / Medium / High / Insufficient data** as icon + label + tone (green / amber / red / neutral). **Never a bare number** — always accompanied by (or expandable to) the **drivers** ("2 overdue requirements, 1 rejected submission") per RISK-001's explainability. New projects show "Insufficient data," not a fake score. Phase 3 uses mock, clearly-labeled values.

## 11. Overdue & missing

- **Overdue** (a due date passed): amber date text + `alert-triangle` inline; optionally an "Overdue" chip. Distinct from the requirement *status* (a `Requested` requirement can also be `Missing`/overdue — the flag rides alongside the status badge).
- **Missing** requirements surface as an inline amber flag and in dashboard counts, per [statuses.md](../product/statuses.md) modeling ("Missing" is a flag, not a status).

## 12. Empty states

- Structure: muted icon + short title + one-sentence explanation + (optional) primary action or "arrives in Phase N."
- Tone: honest and calm. Distinguish **"nothing yet"** (first-run) from **"no results"** (after filter/search — offer "Clear filters").
- Placeholder pages always use an honest empty state (see [phase-3-placeholder-pages.md](./phase-3-placeholder-pages.md)).

## 13. Loading states

- **Skeletons** for content whose shape is known (cards, table rows, detail meta) — no layout shift (reserve space).
- **Spinner** only for indeterminate in-control waits (button submitting) and short overlays; not for full pages.
- **Progress bar** for determinate long operations (later: package generation, uploads) with % + status text.
- Reduced motion: skeletons become static muted blocks; spinners reduce/stop animation.

## 14. Error states

- **Inline field error** (forms) · **region error** (a failed table/panel: message + retry) · **page-level error** (route failed: friendly title, what happened, retry/back) · **permission-denied** (honest, non-alarming: "You don't have access to this. Ask an admin.") · **not-found** (404).
- Never surface raw stack traces or DB errors (consistent with [security-and-operations.md](../architecture/security-and-operations.md)). Errors are specific, blameless, and actionable.

## 15. Permission-denied pattern

- Calm full-region state: lock icon (muted), "You don't have permission to view this," a line on how to get access (contact an org admin), and a safe way back. No scary red, no blame. (Real enforcement is Phase 4; Phase 3 may demo the visual.)

## 16. Destructive actions

- Require an **AlertDialog** confirm: clear title ("Delete template?"), consequence text, the entity name, a **destructive** primary button (danger tone) and a safe Cancel (default focus on Cancel).
- For high-severity actions (later: publish, org deletion), require typed confirmation and/or step-up per [user-roles.md §D](../product/user-roles.md); Phase 3 demonstrates the visual pattern only.
- Prefer **Undo** (toast with Undo) over confirmation for reversible, low-severity actions.

## 17. Dialogs vs drawers vs pages vs popovers

| Use | When |
|-----|------|
| **Modal dialog** | Short, focused decisions/small forms (confirm, rename, small create). Not for complex multi-section workflows. |
| **Drawer / Sheet** | Contextual side panel that keeps page context (view/edit an item's details, filters on mobile, quick record view). |
| **Full page** | Complex or multi-step workflows (create project, build package) — never crammed into a modal. |
| **Popover** | Small contextual controls (filters, column selector, date picker). |
| **Dropdown menu** | Action lists (row actions, user menu). |
| **Command palette** | Global navigation/search/commands. |
| **AlertDialog** | Destructive/blocking confirmations. |

## 18. Notifications (in-app) & toasts

- **Toasts** (Radix, `--z-toast`, `aria-live` polite/assertive by tone): success (auto-dismiss ~5s), error (persist until dismissed + optional retry), warning, info. Bottom-right desktop, bottom-full mobile. Include Undo where applicable.
- **In-app notification** bell popover: placeholder list ("No notifications yet") in Phase 3; real in Phase 10. Distinct from email.

## 19. Long-running actions

- Kick off → immediate feedback (button loading), then a **progress affordance** (bar or status chip) and a completion toast. Support a way to leave and return (the action continues server-side later). Phase 3 mocks the visual only.

## 20. Unsaved changes

- Dirty forms guard navigation with a confirm ("Discard changes?"). Provide explicit Save/Cancel; disable Save when pristine/invalid; show "Saved" on success.

## 21. Read-only state

- When a record is read-only (archived project, insufficient permission, published package), show a **page banner** ("This project is archived and read-only") and render controls disabled with clear affordance — not hidden, so users understand *why* they can't act.

## 22. Mobile adaptations (pattern-level)

- Tables → cards; filters → bottom Sheet; page actions → sticky bottom bar / overflow; dialogs → bottom sheets; multi-column detail → single column; breadcrumbs → back affordance; status badges wrap/stack; touch targets ≥ 44px; long project names truncate with tooltip/expand. Full matrix in [accessibility-and-responsive.md](./accessibility-and-responsive.md).

---

*Continue to [accessibility-and-responsive.md](./accessibility-and-responsive.md).*

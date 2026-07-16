# FILE: /docs/design/components.md

> **Document status:** Phase 3A design — component architecture & inventory. **Specification only.**
> **Depends on:** [repository-structure.md](../architecture/repository-structure.md) (package boundaries), [design-tokens.md](./design-tokens.md), [technology-stack.md](../architecture/technology-stack.md) (shadcn/ui + Radix + Tailwind + TanStack Table), [testing-and-quality.md](../architecture/testing-and-quality.md).

---

## 1. Component architecture (placement rules)

Four tiers, mapped to the existing package layout. **Import direction is one-way: apps → packages; features → shared; never sideways** (enforced by `check-boundaries.mjs` + ESLint `no-restricted-imports`).

| Tier | Lives in | May depend on | Must NOT contain |
|------|----------|---------------|------------------|
| **1. Primitives** | `packages/ui/src` | tokens, Radix, `cn`, cva | data access, authz, app routes, domain/business knowledge, vendor SDKs (except Radix) |
| **2. Composites** (built from primitives) | `packages/ui/src` | primitives | domain knowledge, app state |
| **3. App/shell & domain-presentational** | `apps/web/components` (or `apps/web/src/components`) | `packages/ui`, app context, `next` | server/db/authz logic, feature business rules |
| **4. Feature components / pages** | `apps/web/src/features/*`, `apps/web/app/**` | tiers 1–3, feature server queries/actions (later) | another feature's internals |

**Rules:**
1. **`packages/ui` is presentation-only** (already enforced: no `@closeoutflow/db`, `@closeoutflow/authz`, `@supabase/*`). Tokens (`tokens.css`) live here.
2. **Domain-presentational components** (know about *statuses*/*risk* but not data-fetching) — e.g., `StatusBadge`, `RiskIndicator` — live in **`apps/web/components`** because they encode [statuses.md](../product/statuses.md) domain vocabulary. They render using the `ui` `Badge` primitive.
3. **`DataTable` wraps TanStack Table** in `apps/web/components` — features never import `@tanstack/react-table` directly. (Decision in §Data table.)
4. **No giant design-system package:** `packages/ui` holds primitives + generic composites only; anything app- or domain-aware stays in `apps/web`. This keeps `ui` reusable (future external portals) and prevents a monolith.
5. **Variants via `cva`** (already the pattern in `button.tsx`); component APIs are typed props + `className` passthrough + `forwardRef` where DOM-refable.
6. **Server-first:** components are React Server Components by default; add `"use client"` only for interactivity (Radix overlays, forms, toggles, tables with client sorting). See [patterns.md §performance] and the implementation plan.

---

## 2. Component API conventions

- Props are explicit and typed; extend the native element props (`ButtonHTMLAttributes`, etc.) + `VariantProps<typeof …>` (as `button.tsx` does).
- Every component accepts `className` (merged via `cn`) and forwards `ref` when it wraps a focusable/measurable DOM node.
- Controlled/uncontrolled follows Radix conventions for overlays/inputs.
- Accessible name is required (via children, `aria-label`, or associated `<label>`); icon-only controls **must** have an `aria-label`.
- No inline styles that would require CSP `unsafe-inline`; styling is Tailwind classes + token-driven CSS vars (compatible with **nonce-based CSP**).

---

## 3. Variant management

- Use **`class-variance-authority`** for `variant`/`size`/`tone` axes; keep axes small and semantic.
- Standard axes: `variant` (default/outline/ghost/destructive/link), `size` (sm/default/lg), `tone` (for status-bearing components: success/warning/danger/info/neutral/owner).
- Do not fork components per one-off style; extend via `className` or add a documented variant.

---

## 4. Full component inventory

**Classification:** **P3-Required** (build in Phase 3B) · **Deferred** (later design/phase, not now) · **Feature-later** (belongs to a feature phase) · **Not-recommended**.
**Tier:** which layer/package it lives in.

### Shell & navigation
| Component | Classification | Tier / location | Notes |
|-----------|----------------|-----------------|-------|
| App shell (layout) | **P3-Required** | 3 · `apps/web/components/shell` | grid: sidebar+header+content |
| Sidebar | **P3-Required** | 3 | 6 items, collapse rail, active state |
| Mobile nav (off-canvas drawer) | **P3-Required** | 3 (uses `ui` Drawer) | focus-trapped |
| Header | **P3-Required** | 3 | org switcher, search, bell, help, user menu |
| Organization switcher (placeholder) | **P3-Required** | 3 (uses DropdownMenu) | mock orgs |
| Project switcher (quick) | **P3-Required** | 3 | in-project ▾ + palette |
| User menu (placeholder) | **P3-Required** | 3 | theme/density/sign-out(disabled) |
| Breadcrumbs | **P3-Required** | 3 | route-derived |
| Page header | **P3-Required** | 3 | title + actions |
| Action bar | **P3-Required** | 3 | page/bulk actions |
| Project sub-nav (tabs) | **P3-Required** | 3 (uses `ui` Tabs) | disabled tabs supported |
| Settings nav (two-pane) | **P3-Required** | 3 | |
| Command palette | **P3-Required** | 3 (uses `ui` Command) | nav + mock search |
| Theme toggle | **P3-Required** | 3 | light/dark/system |
| Density toggle | **P3-Required** | 3 | comfortable/compact |
| Skip link | **P3-Required** | 3 | a11y |

### Primitives (packages/ui)
| Component | Classification | Notes |
|-----------|----------------|-------|
| Button | **P3-Required** | exists; migrate to tokens, add `destructive`/`link` variants + loading state |
| Icon button | **P3-Required** | requires `aria-label` |
| Link button / Link | **P3-Required** | uses `--link` |
| Input | **P3-Required** | exists; tokenize, error state, sizes |
| Textarea | **P3-Required** | |
| Label | **P3-Required** | required indicator |
| Select | **P3-Required** | Radix Select |
| Combobox | **P3-Required** | Radix + list; async-ready |
| Multi-select | **P3-Required** | chips |
| Checkbox | **P3-Required** | Radix |
| Radio group | **P3-Required** | Radix |
| Switch | **P3-Required** | Radix |
| Field (label+control+help+error wrapper) | **P3-Required** | form primitive |
| Badge | **P3-Required** | generic; base for StatusBadge |
| Avatar | **P3-Required** | initials fallback |
| Tooltip | **P3-Required** | Radix; not sole info source |
| Popover | **P3-Required** | Radix |
| Dropdown menu | **P3-Required** | Radix |
| Context menu | **Deferred** | not needed for Phase 3 shell |
| Dialog (modal) | **P3-Required** | Radix; focus trap |
| Alert dialog (confirm) | **P3-Required** | destructive confirms |
| Drawer / Sheet | **P3-Required** | Radix Dialog variant; side panel |
| Tabs | **P3-Required** | Radix |
| Accordion | **P3-Required** | Radix |
| Collapsible | **P3-Required** | Radix |
| Card | **P3-Required** | exists; tokenize |
| Metric card | **P3-Required** | dashboard; label+value+delta(mock) |
| Alert (inline) | **P3-Required** | tone variants |
| Banner (page-level) | **P3-Required** | read-only/permission/system notices |
| Toast | **P3-Required** | exists (Radix Toast); add tones |
| Skeleton | **P3-Required** | exists |
| Spinner | **P3-Required** | reduced-motion aware |
| Progress (bar) | **P3-Required** | completeness meters |
| Separator | **P3-Required** | Radix |
| Scroll area | **P3-Required** | Radix; tables/menus |
| Empty state | **P3-Required** | icon+title+text+action |
| Error state | **P3-Required** | with retry |
| Permission-denied state | **P3-Required** | honest, non-scary |
| Key-value / Metadata list | **P3-Required** | detail pages |
| Responsive stack | **P3-Required** | layout helper |
| Timeline | **Deferred** | activity phase (10) |
| Activity list | **Deferred** | activity phase (10) |
| Stepper | **Deferred** | multi-step flows (used Phase 4+) — design spec now, build later |
| Calendar | **P3-Required (primitive)** | for Date input |
| Date input / picker | **P3-Required** | Calendar + Popover |
| File-upload placeholder | **P3-Required (visual only)** | **no real upload**; disabled dropzone visual |
| Rich text editor | **Not-recommended (Phase 3)** | defer to a feature that needs it |

### Domain-presentational (apps/web/components)
| Component | Classification | Notes |
|-----------|----------------|-------|
| StatusBadge | **P3-Required** | maps [statuses.md](../product/statuses.md) → Badge tone + icon + label |
| Risk indicator | **P3-Required** | Low/Med/High/Insufficient-data; icon+label+tone; "why" affordance |
| Overdue/Missing indicator | **P3-Required** | flag treatment (amber) distinct from status |
| Data table | **P3-Required** | wraps TanStack Table |
| Table toolbar | **P3-Required** | search + filter + density + column selector |
| Filter button/menu | **P3-Required** | faceted filters (mock) |
| Pagination | **P3-Required** | cursor-style UI |
| Column selector | **P3-Required** | show/hide columns |
| Bulk-action bar | **P3-Required** | appears on selection |
| Status/Date/File/User cell renderers | **P3-Required** | standard table cells |

### Deliberately deferred / not built in Phase 3
Context menu, Timeline, Activity list, Stepper (design only), Rich text (not recommended), any real File-upload/dropzone behavior, charts/graphs (Phase 11), notification list item behavior (visual placeholder only), avatar-group.

---

## 5. Data table — wrap TanStack Table (decision)

- **Decision:** Build a shared **`DataTable`** in `apps/web/components/table` that **wraps `@tanstack/react-table`**. Features consume `DataTable` with column defs + data; they never import TanStack directly.
- **Why:** consistent density/sorting/selection/empty/loading/error/responsive behavior across every list; single place to enforce a11y (keyboard, `scope`, `aria-sort`), sticky headers, and the mobile card fallback; swappable engine behind our API. Matches the architecture's adapter/wrap philosophy.
- **Capabilities (Phase 3, client-side over mock data):** column defs, sortable headers (`aria-sort`), text search, faceted filter menu, column visibility, row selection + bulk-action bar, sticky header + optional sticky first column, horizontal scroll, cursor-style pagination UI, empty/loading(skeleton rows)/error states, standard cell renderers (Status/Date/File/User/Actions), and the **`< md` card/stacked fallback**.
- **Infinite scroll policy:** **no infinite scroll** for data tables (closeout data needs stable, countable, auditable lists) — use pagination. Infinite scroll may be used only for append-only activity feeds later.

---

## 6. Accessibility expectations (per component — summary; full rules in accessibility doc)

- All interactive components: keyboard operable, visible `:focus-visible` ring (`--ring`), correct roles/ARIA (prefer Radix which provides them), `Esc`/focus-trap for overlays, `aria-label` for icon-only controls, `aria-sort` for sortable headers, `aria-live` for toasts/status announcements, `aria-current` for active nav.
- Status/risk components never rely on color alone (icon + text).
- Tooltips are never the only place critical info lives.
- See [accessibility-and-responsive.md](./accessibility-and-responsive.md) for the authoritative per-pattern rules.

---

## 7. Responsive expectations (summary)

- Primitives are fluid; composites define breakpoints. Tables → card fallback `< md`; dialogs → bottom sheets `< md`; page actions → sticky bottom/overflow on mobile; sidebar → off-canvas `< lg`. Touch targets ≥ 44px on touch. Detail in [accessibility-and-responsive.md](./accessibility-and-responsive.md).

---

## 8. Testing expectations (summary; full plan in the accessibility doc & implementation plan)

- **Vitest + Testing Library:** each primitive/composite — renders, variant classes, disabled/loading, keyboard interaction, `aria-*` presence; StatusBadge maps every status correctly; DataTable sorting/selection/empty/loading logic.
- **Playwright + axe:** shell navigation, command palette, theme toggle, responsive breakpoints, keyboard-only traversal, reduced-motion, and axe scans on representative pages (light **and** dark).
- Tests colocated (`__tests__`) per [repository-structure.md](../architecture/repository-structure.md); E2E in `apps/web/e2e`.

---

## 9. Anti-patterns (do not do)

- ❌ Business logic, data fetching, or authz inside `packages/ui`.
- ❌ Importing `@tanstack/react-table`, `@supabase/*`, or another feature's internals from a feature.
- ❌ Encoding status→color maps in multiple places — one `StatusBadge` source of truth.
- ❌ Color-only status; pill-shaped status badges; more than ~3 status hues on screen.
- ❌ Inline `<style>`/inline event handlers that fight nonce CSP.
- ❌ One mega design-system package holding app/domain components.
- ❌ Real upload/network behavior in Phase 3 file-input placeholder.
- ❌ Overriding focus styles to remove the visible ring.

---

*Continue to [patterns.md](./patterns.md).*

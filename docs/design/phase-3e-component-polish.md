# FILE: /docs/design/phase-3e-component-polish.md

> **Document status:** Phase 3E-A — exact component refinements. Each entry: **Problem → Intended → Interaction → Tokens → A11y → Responsive → Boundaries.**
> **Global boundaries (apply to every entry):** tokens/classes/composition only — no new client islands for styling, no IA changes, no business behavior, no CSP/gating changes, Radix semantics preserved, AA contrast verified in both themes, reduced-motion respected via existing zero-duration tokens.
> **Related:** [phase-3e-visual-direction.md](./phase-3e-visual-direction.md) (tokens), [phase-3e-dashboard-redesign.md](./phase-3e-dashboard-redesign.md).

---

## 1. Sidebar (`shell/sidebar.tsx`, `primary-navigation.tsx`, `brand.tsx`)
- **Problem:** boxed icons feel heavy; sits on white like the content; big dead mid-gap; collapse button collides with the floating theme FAB; 256px wide for six items.
- **Intended:** width **240px** (rail 64px unchanged); background = **canvas** (`--background`, no fill, no right border — tonal step separates it; hairline returns under `prefers-contrast: more`). Brand row 56px: 28px "C" mark (primary bg, `--radius-md`, white 700 letter) + "Closeout" 15px/600; mark-only when collapsed. Items: **borderless rows**, 40px tall (44px touch on coarse pointers), 13.5px/500, icon 20px/1.75 stroke, 12px gap, 10px x-padding, `--radius-md`.
  - **Active:** `--selection` pill fill + `--primary` text/icon + weight 600. **No left border bar** (pill only).
  - **Hover:** `--muted`/60. **Disabled (Reports):** 55% opacity + "Later" 11px chip + tooltip (unchanged behavior).
  - Grouping: primary group top; 24px gap; utility group (Team/Settings) pinned bottom with **whitespace, no divider**; collapse control = 32px icon-button bottom row, right-aligned.
- **Interaction:** collapse animates width `--dur-base`; labels hide instantly (no fade); tooltips only in rail mode (remove the placeholder "Navigation item" tooltips on expanded items — Phase 3C P3C-009).
- **Tokens:** `--sidebar-w: 15rem`; `--selection`; `--background`.
- **A11y:** `aria-current="page"` kept; rail tooltips = accessible names; focus ring visible on pill items.
- **Responsive:** < lg unchanged off-canvas drawer (§23 mobile nav) restyled to match.
- **Boundaries:** navigation.ts item list untouched.

## 2. Header (`shell/app-header.tsx`)
- **Problem:** reads as a second white bar; bare-text org switcher; search is a loud bordered field.
- **Intended:** 56px, **canvas background**, bottom hairline `--border`; content: org switcher (§3) · breadcrumbs (flex-1, §5) · **ghost search button** (muted bg `--muted`/50, no border until hover `--border-strong`, 208px, "Search… ⌘K" with kbd chip 11px mono) · 36px icon-buttons (bell, help, avatar) with 8px gaps · avatar 28px initials on `--selection`.
- **Interaction:** sticky top (unchanged); search click opens palette; icon-button hover `--muted`.
- **Tokens:** `--header-h` unchanged; ghost-field uses `--muted`.
- **A11y:** all icon buttons labeled (existing); search button announces "Search, Command K".
- **Responsive:** < md: hamburger · org label (truncate **with leading-preserved ellipsis fixed** — min-width 0 + `truncate`, tooltip full name) · search icon · bell · avatar; help moves into user menu.
- **Boundaries:** entries/order unchanged.

## 3. Organization switcher
- **Problem:** plain text + caret; truncates badly on mobile ("mple Construction Co.").
- **Intended:** compact button: 20px org mark (initials on `--selection`, radius-sm) + name 13.5px/600 (max 176px, truncate + tooltip) + chevron 14px muted; hover = `--muted` fill + hairline; open menu shows orgs with check on active + disabled "Create organization — Phase 4" (quiet row, lock glyph).
- **Interaction/A11y:** existing DropdownMenu semantics; button labeled "Organization: {name}".
- **Responsive:** mobile shows mark + truncated name (120px max).
- **Boundaries:** still mock; becomes real in Phase 4B with **zero visual change** — this is the Phase-4-ready component.

## 4. Page header (`shell/page-header.tsx`) + PreviewPill (new)
- **Problem:** long disclaimer paragraph + chip + disabled slab dominate; no meta row; no project context.
- **Intended:** structure: breadcrumb row (auto) → **title row**: H1 24px/600 + optional `StatusBadge` + **PreviewPill** right of title + actions right-aligned → **meta row** 13px muted (date/org/project context, e.g. "Riverside Medical Office · Medical office · Target Sep 15, 2026"). Description prop reserved for *real* product copy (one line max) — **disclaimers move into the pill's popover**.
  - **PreviewPill:** 22px pill-height chip, info-outline (`--info-border` border, `--info-foreground` text, transparent bg), ⓘ 12px + "Preview" 11px/600 overline-style; click/focus opens popover: one sentence "Static sample data for design review" + "Functional in Phase N." **The only preview messaging on any page.**
  - **Future-phase actions:** outline button, muted text, 14px lock glyph, tooltip "Available in Phase N" — **never** filled primary. One real primary action max per page.
- **Tokens:** info set; `--text-h1`.
- **A11y:** pill is a button with popover semantics; H1 unique; actions keyboard-reachable.
- **Responsive:** mobile: title + pill wrap; actions collapse to header overflow or sticky bottom bar (existing pattern).
- **Boundaries:** honesty preserved — every placeholder page keeps exactly one pill.

## 5. Breadcrumbs
- **Problem:** fine functionally; visually heavy slashes; crowds the header.
- **Intended:** 13px; separators = `--subtle-foreground` "/" at 60%; current crumb `--foreground`/500, links muted→foreground on hover; middle truncation ≥3 levels (existing); moves visually quieter via color only.
- **A11y/Responsive/Boundaries:** unchanged (nav landmark, mobile back-affordance).

## 6. Cards & sections (`ui/card.tsx` + composition rules)
- **Problem:** everything boxed; nested cards on dashboard; 24px padding inflates height.
- **Intended:** `Card` = paper: `--surface`, `--radius-lg` (10px), **`--shadow-card`** light / border-only dark; padding **20px** (16px compact). New composition rules (enforced in review): section headers inside paper use **overline labels** (11px uppercase muted, [direction §4]) + optional count + optional "View all ▸"; internal separation = hairline dividers (`Separator`) or 16px gaps; **nested bordered cards prohibited** — list items inside paper are borderless rows with dividers; “no container” is the default for page-level groupings that the desk canvas already separates.
  - When to use what: **paper card** = a coherent work object (table, queue, form section group) · **divided section** = related sub-blocks within one object · **highlight** = `--selection`/status-subtle left-accent row (attention items) · **compact list/table** = repeating records · **no container** = page-level layout spacing.
- **Tokens:** `--shadow-card`, `--radius-lg`, `--space-5`.
- **Boundaries:** Card API unchanged (className-driven).

## 7. Tables (`table/data-table.tsx`, `cells.tsx`)
- **Problem:** **visible "Select …" label text column (defect)**; sunken header band + heavy framing; risk cell prints "Sample driver explanation" every row.
- **Intended:** selection labels **sr-only** (checkbox column shrinks to 40px); header row **transparent** bg, 12px/600 muted labels, strong 1px bottom border; body rows divided by hairlines, **full-row hover** `--muted`/50, selected rows `--selection` tint + strong left edge; table lives on paper (`--shadow-card` container, radius-lg, overflow clip); status cells = StatusBadge only; **risk drivers → tooltip/popover on the RiskIndicator** (visible text gone); numeric/date cells right-aligned tabular (dates keep left if mixed — decided: dates left, counts/sizes right); avatar cells 24px; row-action "⋯" appears on hover/focus-visible (always visible on touch).
- **Interaction:** sort affordance unchanged; hover ≤ `--dur-fast`.
- **Tokens:** `--row-h`/compact preserved; `--selection`.
- **A11y:** sr-only fix *improves* labels; `aria-sort`, scope, caption preserved; hover-revealed actions stay focusable (visible on `:focus-within`).
- **Responsive:** card fallback < md unchanged, restyled to paper rows.
- **Boundaries:** TanStack wrapper API unchanged.

## 8. Forms & settings surfaces (`ui/primitives` Field etc., `settings-pages.tsx`)
- **Problem:** settings = wall of disabled gray inputs; forms fine structurally.
- **Intended:** labels 13px/600 (from body-strong); inputs on paper with `--input` border, focus ring unchanged; **read-only display mode**: values render as text rows (label muted / value foreground, hairline dividers) with a single section note "Editable in Phase 4" — not rows of disabled inputs. Settings groups = paper cards with overline headers, 20px padding, 560px max form width (within existing `--content-max-form`). Disabled Save slab → quiet outline + lock + tooltip.
- **A11y:** read-only rows are real text (better than disabled inputs for SR); editable-mode field anatomy unchanged.
- **Responsive:** single column mobile (unchanged).

## 9. Buttons (`ui/button.tsx`)
- **Problem:** future-phase actions use filled disabled primary → slabs; no quiet tier in use.
- **Intended tiers:** **primary** (filled blue — max one real action/view) · **secondary** = outline · **tertiary/quiet** = ghost (toolbar/table actions) · **text/link** = link variant (inline) · **destructive** (filled danger, AlertDialog-gated) · **icon-only** 36px ghost. **New rule:** `disabled` filled-primary is banned for future-phase affordances — use outline + lock + tooltip ("locked" pattern). Loading spinner unchanged. Press = `active:translate-y-px`.
- **Tokens:** existing; no API change (usage rules + one `variant="locked"` convenience optional).
- **A11y:** locked buttons are real disabled buttons with `aria-disabled` + described-by tooltip text; contrast of outline-disabled verified.
- **Responsive:** mobile primary → sticky bottom bar (existing).

## 10. Status badges & risk (`status/status-badge.tsx`, `risk-indicator.tsx`)
- **Problem:** slightly loud in dense rows; drivers printed inline; every status equally weighted.
- **Intended:** badge height 20px (from ~22), icon 12px, text 11px/600, padding 6px, radius-sm — **quieter ink**; closed/muted states (Archived, Superseded, Waived, N/A, Complete-in-lists) drop to **text+icon only, no tint** (`--muted-foreground`) so active states own the color budget; overdue = amber icon+date text (unchanged pattern, tightened). Risk: badge unchanged semantics; **drivers in popover** (click/focus, also hover) listing explainable reasons; "Insufficient data" = neutral text-only.
- **A11y:** never color-alone (unchanged); popover keyboard-accessible; badge text stays ≥11px AA.
- **Boundaries:** every `statuses.md` label/mapping preserved exactly; no new states.

## 11. Tabs (project sub-nav, settings nav)
- **Problem:** functional; underline thin; disabled tabs plain.
- **Intended:** sub-nav on canvas (not paper), 44px, 13.5px/500; active = 2px `--primary` underline + 600 + foreground; hover = foreground (no bg); disabled = 45% + lock tooltip; scrollable gradient-fade edges on overflow (mask, not gradient decoration).
- **A11y:** `aria-current`, focus ring; fade is decorative only.

## 12. Dialogs & sheets (`ui/overlays.tsx`)
- **Problem:** plain but fine; radius/shadow per new scale.
- **Intended:** radius-xl (12px), `--shadow-lg`, `--surface-raised`; title 18px/600; 24px padding; footer actions right (primary rightmost); enter fade+scale 0.98→1 `--dur-base`; sheet slide unchanged; mobile dialog→bottom-sheet unchanged.
- **A11y:** Radix focus trap/labels preserved.

## 13. Dropdowns & popovers
- **Intended:** `--surface-raised`, radius-md 8px… (decided: menus `--radius-lg` 10px to match paper), `--shadow-md`, 4px rise+fade `--dur-fast`; item height 36px, 13.5px; destructive items danger-toned; section labels = overline style.

## 14. Command palette (`shell/command-palette.tsx`)
- **Problem:** visually plain; a brand-moment opportunity.
- **Intended:** 12px radius, `--shadow-lg`, 560px; input 48px borderless with 16px search icon; group headers = overline labels; result rows 40px with icon + text + right kbd hints; footer bar (sunken) with "↑↓ navigate · ↵ open · esc close" 11px; **the single "Sample navigation only" footnote stays** (it is the palette's preview honesty).
- **A11y:** existing Radix/combobox semantics preserved (post-3D rebuild).

## 15. Empty states (`ui` EmptyState)
- **Problem:** generic icon-in-a-box.
- **Intended:** compact branded pattern: 40px icon in a 64px `--muted` circle, title 15px/600, one 13px muted sentence, optional quiet CTA; **32px vertical padding** (not full-page voids); first-use vs no-results variants (existing) restyled; future-phase empties get the standard sentence "…arrives in Phase N" — but only where the PreviewPill isn't already saying it (tabs/pages keep exactly one source of truth).
- **A11y:** heading order preserved; icon `aria-hidden`.

## 16. Loading states
- **Intended:** skeletons match final layout exactly (stat-strip numeral blocks, row skeletons at real row heights) — zero shift; shimmer unchanged + reduced-motion static; spinners only in buttons; section-level `aria-busy` (existing).

## 17. Error / permission / not-found states
- **Intended:** same compact pattern as empty states with danger/neutral iconography; inline retry (quiet outline); page-level 404/error (built in 3D) restyled to paper-on-desk with brand mark; permission-denied stays calm (existing copy). Offline/interrupted: toast + inline row note (no new system). Suspended/auth-required visuals: **specified via the same pattern for Phase 4B reuse** ([§24 readiness]) — not routed now.

## 18. Activity lists
- **Problem:** numbered circles; caption spam.
- **Intended:** icon-dot timeline ([dashboard §3]); 40px rows; relative time right-aligned tabular; hover tint; "View all ▸" quiet link. No captions.

## 19. Metric presentation
- **Intended:** dashboard uses **StatStrip** ([dashboard §3]). `MetricCard` (kept in `ui` for future non-dashboard uses): restyled to 16px padding, 13px label, 28px tabular value, optional context line — **no more caption row**.

## 20. Toolbars (table toolbar)
- **Intended:** toolbar merges **into** the table paper (one panel: toolbar row + table, divided by hairline) instead of floating separately; search ghost-style 224px; Filters/Columns = quiet outline sm; active-filter chips (future) spec'd as removable `--selection` chips; "Mock" mini-tag inside the Filters button is removed (pill covers honesty).

## 21. Mobile navigation drawer
- **Intended:** drawer surface = `--surface` paper (distinct from dark scrim), 288px, brand row + same borderless nav items at 44px, safe-area padding; matches sidebar styling 1:1 (single source component already).

## 22. Theme toggle placement (defect fix)
- **Problem:** floating FAB overlaps collapse control on every screen (P3C-004 incomplete).
- **Intended:** **remove the FAB entirely.** Theme control lives in: user menu (Light/Dark/System radio group) + `/settings/general` preferences (existing) + `/design` gallery toolbar. No floating UI.
- **A11y:** menu radio semantics; instant swap (no transition).

## 23. Design gallery (`/design`)
- **Intended:** restage to demonstrate the new system: sections for **Surfaces** (desk/paper/raised demo), **Type ladder** (incl. overline + 32px numerals), **Color tokens** (both themes, contrast readouts), **Shell specimens** (sidebar/header/page-header mock), **StatStrip**, **Cards & rules** (incl. the "no nested cards" counter-example), **Tables** (hover/selected/sr-only note), **Buttons incl. locked tier**, **Badges/risk (quiet-muted variants)**, **Forms + read-only mode**, **Empty/error/loading**, **Density + theme toggles**, **Mobile frames** (max-width containers). Remains local/test-gated, 404 in production (unchanged).

---

## 24. Phase 4 screen readiness (polish now, build later)

The Phase 4B auth/onboarding screens ([/docs/auth/routes-and-screens.md](../auth/routes-and-screens.md)) must inherit this system with **zero new visual vocabulary**. Polished now so no parallel system emerges:

| Phase 4 need | Covered by |
|---|---|
| Sign-in/up/reset/verify (centered public pages) | **New spec here:** public auth layout = desk canvas, single 400px paper card (radius-xl, shadow-card), brand mark + wordmark top, form per §8, one primary action; footer meta links 13px. Codex builds the *pattern demo* in `/design` only. |
| Onboarding / org creation / selection | Paper card + stepper-lite (numbered overline steps); org rows = §7 row styling |
| Invitation acceptance | Same public card + org mark + role StatusBadge |
| Team management | §7 tables + §9 buttons + §12 dialogs (already real components) |
| Org switcher (real) | §3 component unchanged when wired |
| Account profile/security/MFA/sessions | §8 settings surfaces + read-only rows + §10 badges; MFA QR sits in a sunken zone (`--surface-sunken`) |
| Security/suspended/denied states | §17 patterns |

---

*Continue to [phase-3e-implementation-plan.md](./phase-3e-implementation-plan.md).*

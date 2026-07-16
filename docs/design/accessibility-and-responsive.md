# FILE: /docs/design/accessibility-and-responsive.md

> **Document status:** Phase 3A design — permanent accessibility & responsive standards. **Specification only.**
> **Depends on:** [product-requirements.md NFR-A11Y-001 / NFR-MOB-001 / NFR-BROWSER-001](../product/product-requirements.md), [design-tokens.md](./design-tokens.md), [components.md](./components.md), [patterns.md](./patterns.md), [testing-and-quality.md](../architecture/testing-and-quality.md).
> **Principle:** accessibility is a **build constraint**, not a later pass. Nothing in Phase 3 ships without meeting these.

---

## 1. WCAG target

- **WCAG 2.1 AA** for all internal flows (and the future external portals). AAA where cheap (e.g., larger touch targets).
- Verified continuously: `eslint-plugin-jsx-a11y` (already configured), `@axe-core/playwright` on representative pages in **light and dark**, plus manual keyboard/SR checks per the test plan (§14).

## 2. Semantic HTML & structure

- Real landmarks: `<header>`, `<nav>` (labelled: primary nav, project nav, breadcrumbs), `<main>` (one per page, `id="main"` for skip link), `<aside>` where appropriate, `<footer>`.
- One `<h1>` per page (the page title); sections nest `<h2>`/`<h3>` logically — no skipped levels for styling.
- Lists are lists; tables are `<table>` with `<th scope>`; buttons are `<button>`, links are `<a>` — never a `<div>` with a click handler.
- Radix primitives provide correct roles/ARIA — prefer them over hand-rolled widgets.

## 3. Keyboard navigation

- **Everything operable by keyboard**, in a logical order matching visual order.
- Standard keys: `Tab`/`Shift-Tab` move; `Enter`/`Space` activate; arrow keys within composite widgets (menus, tabs, radio groups, listboxes, tables); `Esc` closes the top-most overlay; `Home`/`End` where lists are long.
- **Focus trap** in modals/drawers/command palette; focus returns to the trigger on close.
- **No keyboard traps** anywhere else. Shortcuts (§ shell) never fire while typing in a field.
- Skip link (§12) is the first tab stop.

## 4. Focus order & visibility

- **Visible focus always:** 2px `--ring` outline with 2px offset on `:focus-visible`, in both themes, on every interactive element. Never remove focus outlines without an equal-or-better replacement.
- Focus order follows DOM/visual order; when opening overlays, move focus in; when closing, move focus back.
- When a form submit fails, move focus to the error summary (or first invalid field).

## 5. Screen-reader support

- Accessible names on all controls; **icon-only controls require `aria-label`**.
- Decorative icons `aria-hidden="true"`; meaningful icons have text alternatives (and status always has a visible text label anyway).
- **Live regions:** toasts announce via `aria-live` (`polite` for success/info, `assertive` for errors); async status changes (e.g., "Saved", "3 items updated") announce politely.
- Active nav item `aria-current="page"`; sortable headers `aria-sort`; disabled items `aria-disabled` + explanation.
- Loading: skeletons marked `aria-busy`; announce "Loading…" and completion where meaningful.

## 6. Color & contrast

- Text ≥ **4.5:1** (normal) / **3:1** (large ≥ 18.66px bold or 24px). UI component boundaries & focus indicators ≥ **3:1**.
- **Never color alone** — status/risk/overdue always pair color with icon + text ([patterns.md §status](./patterns.md)).
- Verified by automated contrast checks on the token pairs (both themes); if a pair fails, adjust L% in the ramp — **contrast wins over exact hue** ([design-tokens.md](./design-tokens.md)).
- Support `prefers-contrast: more` by strengthening borders/muted-foreground (token layer).

## 7. Reduced motion

- Honor `prefers-reduced-motion: reduce`: disable transform/slide/shimmer; keep essential opacity fades or make instant. Spinners reduce to a minimal or static indicator. No parallax/auto-playing motion ever.
- Motion is never required to understand state (state is also conveyed by text/position).

## 8. Forms (a11y)

- Every control has a programmatic `<label>` (or `aria-label`); required marked with `aria-required` **and** a visible indicator + the word "required" for SR.
- Errors: `aria-invalid` + `aria-describedby` linking to the message; error text is specific; on submit, `role="alert"`/focus moves to the summary/first error.
- Help text linked via `aria-describedby`. Grouped controls use `<fieldset>`/`<legend>` (e.g., radio groups).

## 9. Tables (a11y)

- `<table>` with `<caption>` or an `aria-label`; `<th scope="col|row">`; `aria-sort` on sortable headers; selection checkboxes have labels ("Select {row name}").
- The `< md` **card fallback** preserves label:value semantics (each field labelled) so it's understandable without column headers.
- Horizontal scroll region is keyboard-scrollable and focus-reachable; page body never scrolls sideways.

## 10. Dialogs, drawers, menus (a11y)

- `role="dialog"`/`alertdialog` with `aria-labelledby`/`aria-describedby`; focus trapped; `Esc` + backdrop close (except blocking alertdialogs where backdrop may not dismiss); focus returns to trigger.
- Menus/listboxes follow ARIA authoring patterns (Radix handles this). Command palette uses combobox+listbox semantics with `aria-activedescendant`.
- Tooltips: supplementary only; content also available via visible text/`aria-label` (tooltips aren't reliably SR/touch accessible).

## 11. Navigation (a11y)

- Primary nav, project sub-nav, breadcrumbs are each `<nav>` with distinct `aria-label`. Breadcrumb uses an ordered list; current page `aria-current="page"`.
- Off-canvas mobile nav is a labelled dialog/drawer with trap + return focus.

## 12. Skip links & headings

- First focusable element = **"Skip to main content"** → `#main`. Additional skip to primary nav where useful.
- Heading hierarchy is meaningful and unbroken; screen-reader users can navigate by heading.

## 13. Responsive breakpoints & transformations

Breakpoints from [design-tokens.md](./design-tokens.md): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

### Behavior matrix
| Area | ≥ xl (1280) large desktop | lg (1024–1279) laptop | md (768–1023) tablet landscape/portrait | < md (< 768) mobile |
|------|---------------------------|------------------------|------------------------------------------|----------------------|
| **Sidebar** | 256px fixed (or 64px rail) | 256px/rail | **off-canvas drawer** | off-canvas drawer |
| **Navigation** | full sidebar | full sidebar | hamburger + drawer | hamburger + drawer |
| **Project sub-nav** | tab strip | tab strip | scrollable tabs | scrollable tabs / "Section ▾" |
| **Tables** | full table | full table | full table (h-scroll region) | **card/stacked list** |
| **Forms** | single column (640) | single column | single column | single column, full-width |
| **Dialogs** | centered modal | centered modal | centered modal | **bottom sheet** |
| **Drawers** | side drawer | side drawer | side drawer | full-height sheet |
| **Page actions** | inline in header | inline | inline/overflow | **sticky bottom bar / overflow** |
| **Filters** | popover/menu | popover | popover | **bottom sheet** |
| **Search** | header field + `⌘K` | header field | search icon → palette | search icon → full-screen palette |
| **Cards** | 3–5 up | 2–3 up | 2 up | 1 up |
| **Breadcrumbs** | full trail | full trail | truncate middle | back affordance + title |

### Specific transformations
- **Long project/company names:** truncate with ellipsis + tooltip (desktop) / wrap to 2 lines then truncate (mobile); full name available on the detail page and via `title`/`aria-label`.
- **Status badges:** wrap/stack rather than overflow; on very small widths, badge text may abbreviate but the accessible name stays full.
- **Overflow:** any wide content (tables, code, diagrams) scrolls **inside its own `overflow-x-auto` container**; the page body never scrolls horizontally.
- **Touch targets:** ≥ **44×44px** on touch (`--touch-min`); spacing prevents mis-taps; hover-only affordances have tap equivalents.
- **Mobile is not a scaled desktop:** it re-flows (cards, sheets, sticky actions), not merely shrinks.

## 14. Accessibility test plan (Phase 3)

| Test | Tool | Where |
|------|------|-------|
| Static a11y lint | `eslint-plugin-jsx-a11y` | CI (already on) |
| Automated a11y scan (light + dark) | `@axe-core/playwright` | E2E on shell, a list page, a form, a dialog, the command palette |
| Keyboard-only traversal | Playwright | shell nav, open/close overlays, table sort/select, form submit |
| Focus visibility & trap | Playwright | modal/drawer/palette focus trap + return |
| Reduced-motion | Playwright (emulate `prefers-reduced-motion`) | overlays/skeleton render without animation |
| Contrast | axe + token contrast check | both themes |
| Responsive behavior | Playwright projects (desktop + mobile viewports) | table→card, sidebar→drawer, dialog→sheet |
| Cross-browser | Playwright (Chromium, WebKit, Firefox) | smoke of shell + key pages (extends P2C-010 coverage) |

- Component-level a11y assertions (roles, `aria-*`, labels) live in **Vitest + Testing Library** ([components.md §8](./components.md)); page/flow-level a11y lives in **Playwright**.
- **Accessibility is not deferred**: these tests are part of the Phase 3B definition of done.

---

*Continue to [phase-3-placeholder-pages.md](./phase-3-placeholder-pages.md).*

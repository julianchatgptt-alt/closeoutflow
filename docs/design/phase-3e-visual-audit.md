# FILE: /docs/design/phase-3e-visual-audit.md

> **Document status:** Phase 3E-A — visual audit of the implemented Phase 3 frontend. **Specification input only; no code changed.**
> **Method:** This audit is **grounded in the running application**, not code review alone. The dev server was run and screenshots were captured at 1440×900 (light + dark), tablet 834×1112, and mobile 390×844 across `/dashboard`, `/projects`, `/projects/[id]/requirements`, `/team`, `/settings/general`. Findings below reference what is actually rendered on branch `codex/phase-3b-design-system` (post-3D remediation, brand = Closeout).
> **Related:** [phase-3e-visual-direction.md](./phase-3e-visual-direction.md), [phase-3e-dashboard-redesign.md](./phase-3e-dashboard-redesign.md), [phase-3e-component-polish.md](./phase-3e-component-polish.md), [phase-3e-implementation-plan.md](./phase-3e-implementation-plan.md), [phase-3e-open-decisions.md](./phase-3e-open-decisions.md).

---

## 1. Current strengths (must be preserved)

1. **Information architecture is right.** Six-item sidebar, project sub-nav, settings two-pane — the shape needs no change.
2. **The token system is real.** Every color/space/radius flows through CSS variables; a re-theme is a token edit, not a component rewrite. This is why Phase 3E is cheap.
3. **The requirements table is close to good.** Status + overdue treatment, aligned dates, clean sub-nav tabs — the strongest screen in the app.
4. **Status system is disciplined.** Icon + label + tone everywhere; muted closed states; exact `statuses.md` vocabulary.
5. **Accessibility and structure are solid.** Landmarks, focus rings, Radix overlays, axe-clean, reduced-motion tokens, 44px touch targets.
6. **Honesty is complete.** Nothing pretends to work. (The problem is the *volume* of that honesty, not its presence.)
7. **Performance discipline** — server-first, split shell (post-3D), tree-shaken icons, nonce CSP, no theme flash.

## 2. Current weaknesses — why the UI feels generic

Observed directly in the running app:

1. **No surface hierarchy.** In light mode, sidebar, header, canvas, and cards are all effectively white separated by hairlines — one flat sheet with boxes drawn on it. The tinted `--background` (98% L) is indistinguishable from white surfaces in practice.
2. **Everything is a bordered rectangle, including rectangles inside rectangles.** The dashboard's "Attention needed" card contains *nested bordered item-cards*. Four detached metric cards + three detached section cards = seven equal boxes with no focal point.
3. **Metric cards are oversized voids.** ~270×120px cards containing a 13px label, one ~28px digit, and a "Sample data" caption — mostly empty space; the number doesn't command attention.
4. **Preview messaging dominates every screen.** On the dashboard alone: a two-sentence description paragraph, a "Preview — not yet functional" chip, "Sample data / Sample queue / Sample attention item" inside every metric card, "Recent **sample** activity" as a section title, and "Static provenance example" on **every** activity row. On `/projects`, every row repeats "Sample driver explanation" under the risk badge. The product's loudest voice is its own disclaimer.
5. **Disabled actions are the most prominent elements.** "Customize — Phase 11" and "New project — Phase 5" render as large filled primary-shaped slabs (top-right desktop; **full-width at the top of mobile**). A dead button is the strongest visual on several pages.
6. **Typography hierarchy is flat.** 22px page title, then 14px semibold card titles, then 14px body — three barely-distinguishable levels. No overline/eyebrow labels; metric numerals not treated as display type.
7. **Dark mode is one navy pane.** All dark surfaces sit in the same 217–222° blue-gray hue at 27–33% saturation within a narrow lightness band; sidebar, header, canvas, and cards visually merge. Confirmed on the dark screenshots: card boundaries nearly vanish.
8. **Shell defects that read as unfinished:**
   - The **floating theme-toggle FAB** sits at bottom-left **overlapping the "Collapse sidebar" control** in every screenshot (light, dark, mobile) — P3C-004 was never fully executed (moved but still floating).
   - **Visible checkbox-label text** in every DataTable: the first column renders "Select all Projects" / "Select Riverside Medical Office" as visible copy, duplicating the name column and wasting ~180px. (Label should be sr-only — a genuine defect, not a style choice.)
   - Sidebar icons render inside **small bordered boxes**, making six items feel heavy; big unstructured gap between top group and bottom group.
   - Duplicated text in attention rows ("2 overdue requirements" appears twice per row).
   - Activity items use **numbered circles (1,2,3,4)** — reads as a ranking, not a timeline.
9. **Mobile is technically responsive but not designed.** First screen = preview paragraph + chip + full-width disabled button + 2.5 giant single-digit cards; nothing operational visible without scrolling. Org name truncates to "mple Construction Co." (no truncation strategy on the switcher).
10. **No brand moments.** Beyond the "C" mark, nothing is recognizably Closeout — no signature surface treatment, no distinctive numeric/typographic voice, no crafted empty states.

## 3. Route-by-route observations

| Route | Observations (from screenshots) |
|---|---|
| `/dashboard` | Seven equal boxes; nested cards; five kinds of preview text; disabled Customize slab; numbered activity circles; right column ("Awaiting my review") half-empty; no deadlines/health view; duplicated attention text. |
| `/projects` | Visible "Select …" label column (defect); "Sample driver explanation" under every risk badge; disabled New-project slab; toolbar fine; table bones good; vast empty area below 3 rows is acceptable for mock data. |
| `/projects/[id]/requirements` | **Best screen.** Clean tab strip; good status/overdue cells. Issues: same checkbox-label defect; page header lacks project context (no project status/meta line); preview paragraph + chip again. |
| `/team`, `/companies` | Same table pattern → same defect + same preview noise. |
| `/settings/general` | Read-only alert + disabled fields is honest but every field is a gray disabled input — a wall of gray; two-pane nav fine. |
| `/design` gallery | Comprehensive but organized as one long page of boxes; no surface-hierarchy or density demonstration; will need re-staging to show the new system. |

## 4. Viewport observations

- **1440×900 (light):** Content max 1440 = zero breathing room at exactly 1440; gutters collapse against the viewport edge. Sidebar 256px + heavy icon boxes feels wide for six items. First viewport shows metrics + 1.5 sections — acceptable density, poor payoff.
- **1920×1080:** (extrapolated from 1440 layout + `--content-max: 90rem`) content centers correctly; metric cards stretch even larger — voids grow.
- **Tablet 834 portrait:** two-column dashboard collapses acceptably; sidebar correctly off-canvas; header OK; tables horizontally scroll inside region — fine.
- **Mobile 390:** see §2.9 — stacked giant metric cards, preview stack, disabled button first. Drawer nav works; bottom safe-area untested; floating FAB collides with content.

## 5. Theme observations

- **Light:** Reads as "white admin template." No desk/paper depth; hairlines do all separation work; disabled-gray slabs and the pale-blue active nav are the only tonal variation. Status tints are good.
- **Dark:** Navy-on-navy. Surfaces at neutral-950/850/800 with 27–33% blue saturation merge; borders (217 30% 22%) barely register; the light-gray disabled slab ("Customize — Phase 11") is the brightest object on screen. Status subtle-tints hold up well; primary blue-300 links are clear.

## 6. Component-level observations

| Component | State |
|---|---|
| Buttons | Solid primitives; but disabled-primary used for future-phase actions (slabs); no quiet/tertiary tier in use. |
| StatusBadge / Risk | Correct semantics; slightly large (icon 14px + text + tint reads loud in dense rows); risk drivers as always-visible text under badges adds noise. |
| MetricCard | Label-top, number-mid, caption-bottom in a big bordered card — the void problem. |
| DataTable | Engine good; visible select-labels defect; sunken header band + outer border + toolbar all boxed; pagination fine. |
| Page header | Title + long paragraph + chip + slab button; no compact meta row; description does disclaimer duty. |
| Command palette | Post-3D Radix rebuild assumed in place; visually plain but acceptable; restage later. |
| Empty states | Generic icon + text centered in a big bordered card. |
| Forms | Field anatomy excellent; settings read-only wall of gray. |
| Sidebar/Header | See §2.8; org switcher is a bare text button; search input is a full bordered field competing with content. |

## 7. Constraints that Phase 3E must respect

- **Accessibility:** WCAG 2.2 AA contrast (any darkened muted text must stay ≥4.5:1; any new tinted canvas must keep border/status contrast); focus rings on all interactive; reduced-motion tokens already wired — new motion must use them; sr-only fix for table labels *improves* a11y.
- **Performance:** token-only theming (no new client islands for styling); no animation library; no images/blur; server-first preserved; CSP untouched (no inline styles needing nonce exceptions).
- **Structure:** 26 routes, navigation IA, statuses, DataTable engine, Radix primitives, `/design` gating — all unchanged.

## 8. Highest-impact improvements (ranked)

1. **Tinted-canvas surface model** (light) + **desaturated, stepped dark surfaces** — one token edit that fixes "flat white template" and "navy monotony" simultaneously.
2. **Dashboard recomposition** — stat strip + unified attention queue + divided lists instead of seven boxes ([dashboard doc](./phase-3e-dashboard-redesign.md)).
3. **Preview-noise consolidation** — one page-level indicator; kill per-card/per-row sample captions; disabled slabs → quiet outline + tooltip.
4. **Typography ladder** — display numerals, overline section labels, stronger title, darker muted text.
5. **Shell lightening** — borderless sidebar items + active pill, canvas-tinted shell frame, org-switcher chip, ghost search, **remove the floating FAB** (theme → user menu).
6. **Table defect + polish** — sr-only select labels, transparent header, hover/selected rows, driver-as-tooltip.
7. **Crafted empty/loading/error states** — branded, compact, useful.

These seven items produce ~90% of the perceived-quality gain with no structural risk.

---

*Continue to [phase-3e-visual-direction.md](./phase-3e-visual-direction.md).*

# FILE: /docs/design/phase-3e-visual-direction.md

> **Document status:** Phase 3E-A — the refined visual direction. Supersedes nothing structurally; it **sharpens** [design-direction.md](./design-direction.md) and **amends** [design-tokens.md](./design-tokens.md) with exact token changes. Brand = **Closeout**, domain `closeoutflow.com`.
> **Related:** [phase-3e-visual-audit.md](./phase-3e-visual-audit.md) (grounding), [phase-3e-dashboard-redesign.md](./phase-3e-dashboard-redesign.md), [phase-3e-component-polish.md](./phase-3e-component-polish.md).

---

## 1. Refined design thesis

Keep the metaphor — **"the well-run closeout binder, made live"** — and finally *render* it:

> **The workspace is the paper. The shell is the desk.**

The application chrome (sidebar + header) becomes a quiet, slightly tinted **frame**; the work surfaces (tables, queues, records) become crisp **paper** lifted a breath above it. Numbers and statuses are the ink that matters. Everything else recedes. This one move — a real two-level surface model — is what separates "premium operational software" from "white admin template," and it costs a token edit, not a rewrite.

**Brand personality (unchanged, now visible):** credible · precise · calm · grounded · efficient. What changes is that precision becomes *seen*: display-weight tabular numerals, engineered hairline alignment, one strong action per view, disciplined quiet everywhere else.

## 2. Before → after (the honest summary)

| Today (observed) | Phase 3E |
|---|---|
| White sheet + hairline boxes; no depth | Tinted graphite canvas; white paper surfaces with a whisper of lift |
| Seven equal dashboard boxes, nested cards | One stat strip + one attention queue + divided lists; zero nested cards |
| Metric = small digit lost in a big card | Metric = 32px tabular display numeral in a shared strip — the focal point |
| Preview text in 5+ places per screen | **One** page-level preview pill; everything else speaks like a product |
| Disabled primary slabs ("… — Phase 11") | Quiet outline + lock glyph + tooltip; primary reserved for real actions |
| Flat 22/14/14 type ladder | 24/600 titles · 11px overline section labels · 32px metric numerals · darker muted |
| Sidebar: boxed icons, floating FAB collision | Borderless rows, soft active pill, FAB removed (theme → user menu) |
| Dark = one navy pane | Desaturated graphite steps; surfaces separate by lightness, not borders alone |
| Tables: visible "Select …" labels, boxed-in-boxed | sr-only labels, transparent header, full-row hover, tooltip risk drivers |

**What stays:** IA, routes, statuses, tokens-as-mechanism, Radix, DataTable engine, accessibility, server-first, CSP, honesty.
**What becomes distinctive:** the framed-workspace surface model, the numeric voice (Plex Mono/tabular displays), overline "binder-tab" section labels, and the restrained engineered-blue accent doing real work (active states, links, one primary action) instead of decorating.
**How we avoid overdesign:** every change below is a token value, a class swap, or a layout recomposition of existing components. No new visual vocabulary is invented beyond the two-level surface model.

## 3. Surface hierarchy (final)

Levels, light mode:

| Level | Token | Light value | Use |
|---|---|---|---|
| 0 — Desk (canvas) | `--background` | **`216 20% 95.5%`** (was 210 20% 98%) | app background, sidebar, header |
| 1 — Paper | `--surface` | `0 0% 100%` | workspace cards, tables, queues, forms, stat strip |
| 1a — Inset | `--surface-sunken` | **`214 20% 97%`** | zones *inside* paper (code, thumbnails); table headers become **transparent** instead |
| 2 — Raised | `--surface-raised` | `0 0% 100%` + `--shadow-md` | menus, popovers |
| 3 — Overlay | + `--shadow-lg` | modals, drawers, palette |
| Hover | `--muted` @ 60% | row/item hover tint |
| Selected | `--selection` (blue-100) | selected rows/items |

**Rules:**
- **Sidebar and header share the canvas** (level 0) — no fill of their own; the sidebar loses its right border in favor of the tonal step (a hairline may remain in `prefers-contrast: more`). Header keeps a bottom hairline.
- **Paper surfaces get the only ambient shadow in the system:** new token `--shadow-card: 0 1px 2px 0 hsl(220 30% 15% / 0.05), 0 0 0 1px hsl(var(--border))` (border folded into the shadow ring for crisp edges). Prohibited elsewhere except overlays.
- **Spacing replaces containers inside paper.** Sections within a card divide with hairlines or whitespace — **never a nested bordered card** (hard rule).
- **What merges:** dashboard section pairs sharing one paper panel with an internal divider where related (attention + deadlines). **What stays separated:** distinct work objects (the stat strip, the activity panel, each table).
- **Dark-mode depth** comes from stepped lightness of *desaturated* graphite (§6) plus low-contrast borders — never heavier shadows.

## 4. Typography refinement (IBM Plex retained — no replacement)

| Token | Was | Now | Use |
|---|---|---|---|
| `--text-display` | 28px | **32px / 38px / 600, tabular** | metric numerals, hero counts |
| `--text-h1` | 22px | **24px / 30px / 600, -0.011em** | page titles |
| `--text-h2` | 18px | 18px / 26px / 600 | panel titles (used sparingly) |
| `--text-overline` | 11px (unused) | **11px / 16px / 600 / +0.08em / uppercase / muted-foreground** | **section labels** — replaces most 14px-semibold card titles ("ATTENTION NEEDED", "RECENT ACTIVITY") |
| `--text-body` | 14px | unchanged | body, cells |
| `--text-sm` | 13px | unchanged | meta, secondary |
| `--muted-foreground` | 215 18% 40% | **`215 20% 34%`** light (dark: `215 16% 72%`) | one step darker/lighter for real hierarchy (AA-safe) |
| Nav items | 14px/500 | **13.5px/500**, active **600** | lighter chrome voice |
| Numerals | — | `tabular-nums` mandatory in stat strip, tables, dates (already partial) | |

The ladder becomes: 32-display → 24-title → 18-panel → 11-overline → 14-body → 13-meta. Six distinguishable levels instead of three.

## 5. Color refinement (light)

Engineered blue stays the brand; it gets **one notch more presence** where it works and disappears where it decorated.

| Token | Was | Now | Why |
|---|---|---|---|
| `--background` | 210 20% 98% | **216 20% 95.5%** | the desk tint — the single highest-impact change |
| `--primary` | blue-600 (216 68% 36%) | unchanged | correct |
| `--sidebar-active` (new alias) | info-subtle fill | **`--selection` (blue-100) pill + `--primary` text/icon** | crisper active state |
| `--ring` | blue-500 | unchanged | |
| `--link` | blue-600 | unchanged | |
| `--selection` | blue-100 | unchanged | selected rows |
| `--border` | 214 18% 91% | **214 16% 89%** | hairlines must survive on the tinted canvas |
| `--muted-foreground` | see §4 | darkened | hierarchy |
| Amber/status hues | — | **unchanged** | amber stays semantic-only; ≤3 tones per screen rule stands |

## 6. Dark theme (final strategy: desaturate + step)

Kill the navy cast by dropping saturation of dark neutrals from 27–33% → **14–20%**, and separate surfaces by *lightness steps* the eye can read:

| Token | Was | Now |
|---|---|---|
| `--background` (desk) | 222 40% 7% | **224 18% 6.5%** |
| `--surface` (paper) | 217 27% 20% (neutral-850… effectively ~15%) | **220 15% 11.5%** |
| `--surface-raised` | neutral-800 | **219 14% 15%** |
| `--surface-sunken` | neutral-900 | **222 16% 9%** |
| `--border` | 217 30% 22% | **218 12% 22%** |
| `--border-strong` | 216 26% 30% | **217 12% 30%** |
| `--muted` | neutral-800 | **219 14% 15%** |
| `--foreground` | 210 40% 96% | **214 20% 93%** (softer, less blue halation) |
| `--muted-foreground` | neutral-400 | **215 16% 72%** |
| `--primary` | blue-300 | unchanged (the one saturated voice) |
| Status subtle/border sets | — | keep hues, **reduce their saturation ~15% relative** so tints read as tinted graphite, not neon panels |

Result: desk ≈ 6.5% L, paper ≈ 11.5% L, raised ≈ 15% L — three visibly distinct graphite steps; blue exists only in interactive/status ink. Not pure black anywhere; borders subtle but present; large blocks can no longer blend because adjacent levels differ by ≥4 L points **and** saturation.

## 7. Border · radius · shadow (final)

- **Borders:** default hairline (`--border`) for paper edges (via `--shadow-card` ring), table row dividers, input outlines (`--input`); **strong** for selected/active frames and input hover; **error** = `--danger-border`. Sidebar/header lose decorative borders (tonal step instead).
- **Radius:** cards/panels **10px** (`--radius-lg: 0.625rem` — one step softer for the paper metaphor), modals/palette **12px** (`--radius-xl`), buttons/inputs **6px** (`--radius-md`, unchanged), badges 4–6px (unchanged, never pills), stat strip 10px.
- **Shadows:** `--shadow-card` (new, §3) on paper in **light only**; `--shadow-md` menus/toasts; `--shadow-lg` modals/drawers/palette; **prohibited** on buttons, badges, inputs, nav, table rows, and all dark-mode paper.

## 8. Spacing rhythm

- Page gutter 24px (16 mobile) unchanged; **content max stays 1440 but gains `px-6` breathing at exactly-1440 viewports** (gutter applies outside max-width).
- Vertical rhythm: page-header block **20px** below breadcrumb row, **24px** to first content; sections separated by **32px** of canvas (no divider needed — the desk shows through); inside paper: 16–20px padding (was 24) with 12px stacks — cards get denser, not taller.
- Stat strip height ≈ **88px**; dashboard panels min-height removed (content-sized); table cells unchanged (44/40 density preserved).
- Forbidden: nested cards, >24px padding inside paper, dead vertical zones >48px, disabled slabs as spacing anchors.

## 9. Motion (restrained, tokenized — durations already exist)

- Nav/tab active: background/color transition `--dur-fast`; sidebar collapse: width `--dur-base` ease-standard (no content fade).
- Buttons: color transition only + `active:translate-y-px` (1px press, no scale).
- Rows/items: instant-feel hover (`--dur-fast` bg only).
- Menus/popovers: fade + 4px rise, `--dur-fast`; dialogs/palette: fade + scale 0.98→1, `--dur-base`; sheets: slide `--dur-base`.
- Toasts: slide-fade in, fade out; skeleton shimmer unchanged; status changes: none (statuses never animate); theme change: **no transition** (instant swap avoids mixed-state frames).
- All via existing reduced-motion zero-duration tokens; nothing moves layout; nothing loops; nothing is required for comprehension.

## 10. What makes Closeout visually distinctive (the recognizable kit)

1. **The framed workspace** — graphite desk, white paper, whisper lift. No popular admin template does this quietly.
2. **The numeric voice** — 32px tabular Plex numerals as the dashboard's focal point; mono for IDs/versions.
3. **Binder-tab overlines** — the 11px uppercase section labels echo tabbed dividers in a closeout binder.
4. **One blue action per view** — action discipline as a visible trait.
5. **Engineered-blue + graphite + semantic-only amber** — a palette with a point of view.
6. **Statuses as ink, not decoration** — small, exact, never loud.

## 11. Anti-patterns (enforced)

No hazard/hard-hat/blueprint/orange-wash clichés · no glassmorphism/gradients/neon · no shadow stacking · no nested cards · no pill-everything · no marketing whitespace inside the app · no disabled-primary slabs · no per-row "sample" captions · no decorative animation · no fintech/game dashboard styling · no generic shadcn demo look (the tinted frame + overlines + numeric voice are the antidote).

## 12. Exact token change list (for Phase 3E-B Task 2)

Light: `--background → 216 20% 95.5%` · `--border → 214 16% 89%` · `--muted-foreground → 215 20% 34%` · `--subtle-foreground → 215 16% 45%` · `--radius-lg → 0.625rem` · **add** `--shadow-card` · **add** `--text-metric: 2rem/2.375rem` (or repurpose `--text-display`) · overline already tokenized.
Dark: the §6 table (background/surface/raised/sunken/border/border-strong/muted/foreground/muted-foreground; status sets desaturated ~15% relative).
Dimensions: `--sidebar-w → 15rem` (240px); all else unchanged.
Every value must pass automated AA contrast checks in both themes before merge (contrast wins over exact hue, per the standing rule).

---

*Continue to [phase-3e-dashboard-redesign.md](./phase-3e-dashboard-redesign.md).*

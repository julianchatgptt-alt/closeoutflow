# FILE: /docs/design/design-tokens.md

> **Document status:** Phase 3A design — the token system Codex implements in Phase 3B. **Specification only — no production CSS.** Values are the source of truth; Phase 3B writes them into `packages/ui/src/tokens.css` (CSS variables) and exposes them via the Tailwind preset in `packages/config/tailwind.preset.ts`.
> **Conventions:** Colors are expressed as **HSL channel triplets** (`H S% L%`) to match the existing `tokens.css` pattern (`hsl(var(--token))`). Names are kebab-case CSS custom properties. This document does **not** write CSS; it defines the values and names.
> **Grounding:** extends the existing minimal token set (`--background`, `--foreground`, `--border`, `--primary`, `--muted`, `--radius`). Phase 3B **migrates primitives off hardcoded `blue-*`/`slate-*`** (current `button.tsx`, `card.tsx`) onto these semantic tokens.

---

## 1. Token architecture

Three layers (implement in this order):

1. **Primitive/ramp tokens** — raw color ramps (`--neutral-500`, `--blue-600`, …). Not used directly in components.
2. **Semantic tokens** — meaning-based aliases (`--background`, `--primary`, `--danger`, `--ring`, …) that map to primitives and **flip between light/dark**. Components use these.
3. **Component/dimension tokens** — sizing/layout (`--sidebar-w`, `--header-h`, `--row-h`, `--radius`). Mostly theme-independent.

Rule: **components reference semantic + dimension tokens only**, never raw ramps or Tailwind palette literals. This is what makes theming and future org-accent possible.

---

## 2. Color ramps (primitive)

Warm-leaning **neutral** ("graphite/concrete"), engineered **blue** (brand), and status hues. HSL triplets.

### Neutral (slightly warm slate)
| Token | HSL | Note |
|-------|-----|------|
| `--neutral-0` | `0 0% 100%` | pure white (light surfaces) |
| `--neutral-50` | `210 20% 98%` | canvas (light) |
| `--neutral-100` | `214 20% 96%` | sunken/subtle bg |
| `--neutral-200` | `214 18% 91%` | borders (light) |
| `--neutral-300` | `214 15% 84%` | strong border / disabled border |
| `--neutral-400` | `215 14% 66%` | placeholder / icon-muted |
| `--neutral-500` | `215 14% 52%` | muted text (light) |
| `--neutral-600` | `215 18% 40%` | secondary text |
| `--neutral-700` | `216 22% 30%` | strong text |
| `--neutral-800` | `217 27% 20%` | surface (dark) |
| `--neutral-850` | `218 30% 15%` | panel (dark) |
| `--neutral-900` | `220 33% 11%` | foreground (light) / canvas (dark) |
| `--neutral-950` | `222 40% 7%` | deepest (dark canvas base) |

### Brand blue ("engineered blue" — deeper & less saturated than a bright SaaS blue)
| Token | HSL |
|-------|-----|
| `--blue-50` | `214 60% 96%` |
| `--blue-100` | `214 65% 90%` |
| `--blue-200` | `214 66% 82%` |
| `--blue-300` | `214 64% 70%` |
| `--blue-400` | `215 60% 56%` |
| `--blue-500` | `216 62% 44%` |
| `--blue-600` | `216 68% 36%` | **primary (light)** |
| `--blue-700` | `217 72% 30%` | primary hover (light) |
| `--blue-800` | `218 72% 24%` | primary active (light) |
| `--blue-900` | `219 66% 18%` |

### Status hues (each: base + `-fg` for text-on-tint via subtle bg)
| Hue | 600 (solid) | subtle-bg (light) | subtle-bg (dark) | Used for |
|-----|-------------|-------------------|------------------|----------|
| **Green** (success/complete/approved) | `158 64% 30%` | `152 44% 94%` | `156 40% 14%` | Approved, Complete, Published, Active(sub), Accepted, Delivered |
| **Amber** (warning/attention — the accent) | `36 92% 42%` | `40 90% 92%` | `36 60% 14%` | Missing, Overdue, Corrections, Past due, Deferred, Validation failed, At-risk |
| **Red** (danger/destructive) | `2 72% 44%` | `3 80% 95%` | `2 60% 15%` | Rejected, Failed, Quarantined, Suspended, Cancelled, Expired, Revoked, Bounced |
| **Info-blue** (in-progress/processing) | `205 78% 38%` | `205 70% 94%` | `205 55% 15%` | Requested, Processing, Under review, In progress, Generating, Delivered(mid) |
| **Slate** (neutral/inactive/closed) | `215 16% 46%` | `214 18% 94%` | `217 24% 18%` | Draft, Not assigned, Not started, Queued, Trialing, Archived, Superseded, Waived, N/A |
| **Violet** (owner/external review, sparing) | `256 46% 48%` | `256 50% 95%` | `256 34% 17%` | Owner Review (project), external-reviewer emphasis |

> **Restraint rule:** a single screen should rarely show more than **3 status hues at once**. Violet is reserved for the owner/external-review context so it doesn't compete with the everyday green/amber/blue/red.

---

## 3. Semantic color tokens

Each semantic token has a **light** and **dark** value. Components use only these.

### Surfaces & text
| Semantic token | Light | Dark | Purpose |
|----------------|-------|------|---------|
| `--background` | `neutral-50` | `neutral-950` | app canvas |
| `--surface` | `neutral-0` | `neutral-850` | cards, panels, table body |
| `--surface-raised` | `neutral-0` | `neutral-800` | dropdowns, popovers, modals, drawers |
| `--surface-sunken` | `neutral-100` | `neutral-900` | table header, insets, code |
| `--foreground` | `neutral-900` | `210 40% 96%` | primary text |
| `--muted` | `neutral-100` | `neutral-800` | muted backgrounds |
| `--muted-foreground` | `neutral-500` | `neutral-400` | secondary text |
| `--subtle-foreground` | `neutral-400` | `215 16% 55%` | tertiary/placeholder/meta |
| `--border` | `neutral-200` | `217 30% 22%` | default hairline separators |
| `--border-strong` | `neutral-300` | `216 26% 30%` | emphasis/active frames |
| `--input` | `neutral-300` | `216 26% 30%` | input border |
| `--ring` | `blue-500` | `blue-300` | focus ring (both themes, AA-contrast) |
| `--overlay` | `220 33% 11% / 0.45` | `222 40% 4% / 0.6` | modal/drawer backdrop (with alpha) |

### Brand & interaction
| Token | Light | Dark |
|-------|-------|------|
| `--primary` | `blue-600` | `blue-300` |
| `--primary-hover` | `blue-700` | `blue-200` |
| `--primary-active` | `blue-800` | `blue-100` |
| `--primary-foreground` | `neutral-0` | `neutral-950` |
| `--accent` | `amber-600 (36 92% 42%)` | `36 90% 60%` |
| `--accent-foreground` | `neutral-0` | `neutral-950` |
| `--link` | `blue-600` | `blue-300` |
| `--link-hover` | `blue-700` | `blue-200` |
| `--selection` | `blue-100` | `blue-900` |

### Semantic status (foreground/solid, subtle-bg, border) — light / dark
| Token group | `-foreground` (solid text/icon) | `-subtle` (tint bg) | `-border` |
|-------------|-------------------------------|---------------------|-----------|
| `--success-*` | `158 64% 26%` / `152 55% 70%` | `152 44% 94%` / `156 40% 14%` | `152 40% 80%` / `156 34% 26%` |
| `--warning-*` | `33 90% 34%` / `40 90% 66%` | `40 90% 92%` / `36 60% 14%` | `38 80% 78%` / `36 50% 28%` |
| `--danger-*` (a.k.a. `--destructive`) | `2 72% 40%` / `2 80% 70%` | `3 80% 95%` / `2 55% 15%` | `3 70% 84%` / `2 45% 30%` |
| `--info-*` | `205 78% 32%` / `205 70% 68%` | `205 70% 94%` / `205 55% 15%` | `205 60% 80%` / `205 45% 28%` |
| `--neutral-status-*` | `215 18% 38%` / `215 16% 66%` | `214 18% 94%` / `217 24% 18%` | `214 16% 84%` / `217 20% 30%` |
| `--owner-*` (violet) | `256 46% 42%` / `256 60% 74%` | `256 50% 95%` / `256 34% 17%` | `256 40% 84%` / `256 30% 32%` |

### States
| Token | Value |
|-------|-------|
| `--disabled-foreground` | `--subtle-foreground` |
| `--disabled-surface` | `--muted` |
| Disabled opacity | `0.5` on interactive elements (matches existing `disabled:opacity-50`) |
| `--focus-ring-width` | `2px`; `--focus-ring-offset` | `2px` |

**Non-negotiables:**
- Focus ring uses `--ring` at 2px with 2px offset, **always visible** on keyboard focus (`:focus-visible`), on every interactive element and in both themes.
- Status meaning is **never** conveyed by color alone (see [patterns.md §status](./patterns.md) for the required icon+label pairing).
- All text/background pairs above target **≥ 4.5:1** (body) / **≥ 3:1** (large text & UI component boundaries). Phase 3B must verify with automated contrast checks (see [accessibility-and-responsive.md](./accessibility-and-responsive.md)); adjust L% within the ramp if any pair fails — **contrast wins over exact hue**.

### High-contrast consideration
- Respect `prefers-contrast: more` by mapping to stronger borders (`--border` → `--border-strong`) and darker muted-foreground; do not ship a separate palette in Phase 3 but keep tokens factored so a high-contrast override is a later token layer.

---

## 4. Typography tokens

### Families (license-safe, self-hosted via `next/font`, no manual font-file distribution)
| Token | Stack | Loading |
|-------|-------|---------|
| `--font-sans` | **"IBM Plex Sans"**, then system UI fallback: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` | `next/font/google` (OFL), `display: swap`, subset `latin`, preload |
| `--font-mono` | **"IBM Plex Mono"**, then `ui-monospace, "SFMono-Regular", "Cascadia Code", Menlo, Consolas, monospace` | `next/font/google` (OFL) |

**Why IBM Plex:** engineering/industrial heritage (reads as a serious technical tool, not a generic SaaS), excellent small-size legibility for dense tables, OFL-licensed, self-hosted at build (no CDN, works with nonce CSP). **Reconsideration trigger:** if ≤13px table legibility tests poorly, swap `--font-sans` to **Inter** (same tokens, drop-in) — see [open-design-decisions.md](./open-design-decisions.md) OD-1. System stack is the always-present fallback so the app is fully usable before/without web fonts.

### Type scale (rem; base 16px root, body 14px)
| Token | Size / line-height | Weight | Use |
|-------|--------------------|--------|-----|
| `--text-display` | 28px / 36px | 600 | page hero (rare) |
| `--text-h1` | 22px / 28px | 600 | page title |
| `--text-h2` | 18px / 26px | 600 | section header / card title |
| `--text-h3` | 16px / 24px | 600 | sub-section |
| `--text-body` | 14px / 20px | 400 | default body, table cells |
| `--text-body-strong` | 14px / 20px | 500 | emphasized body, labels |
| `--text-sm` | 13px / 18px | 400 | secondary/meta, dense tables |
| `--text-xs` | 12px / 16px | 500 | badges, captions, overline |
| `--text-overline` | 11px / 16px | 600, `+0.06em`, uppercase | section eyebrows only |

### Numeric & table typography
- **Tabular figures everywhere numbers align:** tables, metric cards, dates, sizes, counts → `font-variant-numeric: tabular-nums` (token `--nums-tabular`). Prevents column jitter.
- **Monospace** (`--font-mono`) for: IDs, checksums, file sizes, version numbers, tokens/keys (masked), and any fixed-width technical value.
- Currency/counts right-aligned in tables; dates use a consistent format (see [patterns.md](./patterns.md)).

### Weights & spacing
- Weights used: **400** (body), **500** (labels/emphasis/UI), **600** (headings/buttons). Avoid 300/700 in UI chrome for consistency.
- Letter-spacing: default 0; **overline/eyebrow** `+0.06em` uppercase; large headings slight negative tracking optional (`-0.01em`).
- **Uppercase rules:** only for overline/eyebrow labels and (optionally) status-badge text at `--text-xs`. Never uppercase body, table data, or headings.

---

## 5. Spacing scale (4px base grid)

Use Tailwind's 4px scale; semantic aliases for layout consistency.

| Token | px | Common use |
|-------|----|-----------|
| `--space-0` | 0 | — |
| `--space-1` | 4 | icon–label gap, tight |
| `--space-2` | 8 | control inner padding |
| `--space-3` | 12 | compact row padding |
| `--space-4` | 16 | default gap, card inner (compact) |
| `--space-5` | 20 | — |
| `--space-6` | 24 | card padding, page gutter (desktop) |
| `--space-8` | 32 | section spacing |
| `--space-10` | 40 | — |
| `--space-12` | 48 | large section spacing |
| `--space-16` | 64 | page-top rhythm (rare) |

- **Page gutter:** 24px desktop, 16px mobile.
- **Card padding:** 24px comfortable / 16px compact.
- **Stack rhythm:** sections 24–32px apart; related fields 16px; label→control 6px.

---

## 6. Size / dimension tokens

### Layout
| Token | Value |
|-------|-------|
| `--sidebar-w` | 256px (16rem) |
| `--sidebar-w-collapsed` | 64px (4rem, icon rail) |
| `--header-h` | 56px (3.5rem) |
| `--project-subnav-h` | 44px (contextual secondary nav) |
| `--content-max` | 1440px (fluid app pages, centered beyond) |
| `--content-max-reading` | 1120px (detail pages) |
| `--content-max-form` | 640px (single-column forms/settings) |
| `--page-gutter` | 24px desktop / 16px mobile |

### Controls & tables
| Token | Value |
|-------|-------|
| `--control-h-sm` | 36px |
| `--control-h` | 40px (default) |
| `--control-h-lg` | 44px |
| `--touch-min` | 44px (mobile min touch target) |
| `--row-h` | 44px (comfortable) |
| `--row-h-compact` | 40px |
| `--row-h-header` | 44px |
| `--icon-sm` | 16px |
| `--icon` | 20px (default) |
| `--icon-lg` | 24px |
| `--avatar-sm/md/lg` | 24 / 32 / 40px |

## 7. Radius tokens
| Token | Value | Use |
|-------|-------|-----|
| `--radius` | 8px (0.5rem) | base (cards, menus, modals) |
| `--radius-sm` | 4px | chips, small badges, inputs-in-tables |
| `--radius-md` | 6px | buttons, inputs, selects |
| `--radius-lg` | 8px | cards, popovers, drawers |
| `--radius-xl` | 12px | large surfaces (rare) |
| `--radius-full` | 9999px | avatars, switches, spinners, dot indicators |

> Changes the existing `--radius` from 0.625rem → **0.5rem** for a crisper, more precise feel; sm/md/lg derived (see Tailwind preset mapping). Status badges use `--radius-sm`/`--radius-md`, **not** `--radius-full` (rectangular-rounded reads as "record label," not "tag").

## 8. Shadow / elevation tokens
| Token | Value (light) | Use |
|-------|---------------|-----|
| `--shadow-none` | none | default (flat, borders only) |
| `--shadow-sm` | `0 1px 2px 0 hsl(220 33% 11% / 0.06)` | subtle hover lift (rare) |
| `--shadow-md` | `0 4px 12px -2px hsl(220 33% 11% / 0.12)` | dropdowns, popovers, toasts |
| `--shadow-lg` | `0 12px 32px -8px hsl(220 33% 11% / 0.20)` | modals, drawers, command palette |

- **Dark mode:** reduce/replace shadow with `--surface-raised` tint + `--border`; shadows are near-invisible on dark, so elevation reads via surface + border.

## 9. Motion tokens
| Token | Value |
|-------|-------|
| `--dur-fast` | 120ms |
| `--dur-base` | 180ms |
| `--dur-slow` | 240ms |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` (ease-out) |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` entrance / `cubic-bezier(0.4, 0, 1, 1)` exit |
| Reduced motion | when `prefers-reduced-motion: reduce`, durations → `0ms` for transforms; opacity fades allowed; shimmer becomes a static muted block |

Motion is applied to: overlay/menu enter-exit, drawer/sidebar slide, toast, focus/hover color transitions, skeleton shimmer. Nothing loops or blocks input.

## 10. Z-index tokens
| Token | Value | Layer |
|-------|-------|-------|
| `--z-base` | 0 | content |
| `--z-sticky` | 100 | sticky table headers, sticky page actions |
| `--z-sidebar` | 200 | sidebar (mobile off-canvas) |
| `--z-header` | 300 | app header |
| `--z-dropdown` | 400 | dropdown/select/popover |
| `--z-overlay` | 500 | modal/drawer backdrop |
| `--z-modal` | 510 | modal/drawer content |
| `--z-command` | 600 | command palette |
| `--z-toast` | 700 | toasts |
| `--z-tooltip` | 800 | tooltips (always on top) |

## 11. Breakpoints (match Tailwind defaults; semantic names)
| Token | Min width | Semantic |
|-------|-----------|----------|
| `sm` | 640px | large phone / small tablet portrait |
| `md` | 768px | tablet portrait |
| `lg` | 1024px | tablet landscape / small laptop |
| `xl` | 1280px | laptop / desktop |
| `2xl` | 1536px | large desktop |

Shell breakpoints (see [application-shell.md](./application-shell.md)): sidebar becomes off-canvas **below `lg` (1024px)**; tables switch to card/stacked fallback **below `md` (768px)**.

## 12. Container widths (recap)
| Context | Max width |
|---------|-----------|
| App content (lists/dashboards) | `--content-max` 1440px, fluid, centered beyond |
| Detail/reading pages | `--content-max-reading` 1120px |
| Forms / settings panes | `--content-max-form` 640px |

---

## 13. Light-theme mapping (summary)
`:root` (default, `color-scheme: light`): background=`neutral-50`, surface=`neutral-0`, foreground=`neutral-900`, border=`neutral-200`, primary=`blue-600`, ring=`blue-500`, status tokens = the "light" columns above.

## 14. Dark-theme mapping (summary)
`.dark` (`color-scheme: dark`): background=`neutral-950`, surface=`neutral-850`, surface-raised=`neutral-800`, foreground=`210 40% 96%`, border=`217 30% 22%`, primary=`blue-300`, ring=`blue-300`, status tokens = the "dark" columns above. Elevation via surface tint + border, not shadow.

## 15. Tailwind preset exposure (guidance, not CSS)
Phase 3B extends `packages/config/tailwind.preset.ts` to expose the new semantic tokens as Tailwind colors (`surface`, `surface-raised`, `surface-sunken`, `foreground`, `muted`/`muted-foreground`, `subtle-foreground`, `border`/`border-strong`, `input`, `ring`, `primary` + `hover`/`active`, `accent`, `success`/`warning`/`danger`/`info`/`neutral-status`/`owner` with `-foreground`/`-subtle`/`-border`), plus `borderRadius` (sm/md/lg/xl), `boxShadow` (sm/md/lg), `zIndex`, `fontFamily` (sans/mono), `fontSize` (the scale above), and `screens` (breakpoints). All map to `hsl(var(--token))` so theme switching is a class flip on `<html>`.

## 16. Phase 3E implementation amendment

Phase 3E supersedes the earlier light/dark summary values above with the exact implemented values in [phase-3e-visual-direction.md](./phase-3e-visual-direction.md). The implementation adds the cool-neutral desk (`--background: 216 20% 95.5%`), white paper, desaturated three-step graphite dark surfaces, `--shadow-card`, a 10px panel radius, a 240px expanded sidebar, 32px metric numerals, 24px page titles, and the binder-tab overline utility. See [phase-3e-exit-review.md](./phase-3e-exit-review.md) for validation evidence.

---

*Continue to [application-shell.md](./application-shell.md).*

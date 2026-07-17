# FILE: /docs/design/phase-3e-dashboard-redesign.md

> **Document status:** Phase 3E-A — complete dashboard redesign specification. **Still mock data, still honest** — this changes composition and presentation, not functionality. Analytics remain Phase 11; the redesign must not fabricate live claims.
> **Related:** [phase-3e-visual-direction.md](./phase-3e-visual-direction.md) (surfaces/type), [phase-3e-component-polish.md](./phase-3e-component-polish.md) (component specs), [phase-3e-visual-audit.md](./phase-3e-visual-audit.md) §3 (what's wrong today).

---

## 1. Design intent

The dashboard becomes the **closeout command center**: *"What needs me, what's at risk, what's moving."* One glance answers all three. The current page (four metric voids → three detached boxes) becomes: a compact **stat strip**, a dominant **Needs attention** queue, a supporting rail, and a quiet activity record — all paper panels on the graphite desk, no nested cards, one preview indicator.

## 2. Desktop layout (≥ xl, described wireframe)

```
┌ Page header ─────────────────────────────────────────────────────────────┐
│ Dashboard                    [Preview ⓘ pill]        [Go to projects ▸]  │  ← title 24px; ONE preview pill;
│ Tuesday, Jul 16 · Sample Construction Co.                                 │    quiet real action, no dead slabs
└──────────────────────────────────────────────────────────────────────────┘
┌ STAT STRIP (one paper panel, 4 stats ÷ hairlines, ~88px) ────────────────┐
│  Active projects   Due this week   Awaiting my review   Overdue          │  ← 13px labels
│      3                 7                 2                 1⚠            │  ← 32px tabular numerals;
└──────────────────────────────────────────────────────────────────────────┘    overdue numeral warning-toned
┌ NEEDS ATTENTION (paper, 2/3 width) ────────┐ ┌ RIGHT RAIL (1/3) ─────────┐
│ NEEDS ATTENTION ······················ (5) │ │ AWAITING MY REVIEW ···(2) │
│ ⚠ Riverside Medical Office     [Medium]   │ │ HVAC O&M Manual  [In prog]│
│   2 overdue requirements        Jul 12 ▸  │ │  PM review · 2 of 3       │
│ ────────────────────────────────────────  │ │ Fire Alarm Test  [Approved]│
│ ⚠ Roofing Warranty · Missing    Aug 5 ▸   │ │  Final · 3 of 3           │
│ ────────────────────────────────────────  │ │ ── divider ──             │
│ ◷ Eastgate review response      1 waiting▸│ │ UPCOMING DEADLINES        │
│ … (compact interactive rows, ÷ hairlines) │ │ Jul 30 · Fire Alarm  ✓    │
│                              View all ▸   │ │ Aug 5 · Roofing Warranty  │
└────────────────────────────────────────────┘ │ Aug 10 · As-builts        │
                                               └───────────────────────────┘
┌ PROJECT HEALTH (paper, full width) ──────────────────────────────────────┐
│ PROJECT HEALTH                                                            │
│ Riverside Medical Office   Closeout In Progress  ▓▓▓▓▓▓░░ 18/25  [Med]  ▸ │  ← one row per project:
│ Eastgate Retail Buildout   Active                ▓▓▓░░░░░  9/25  [Low]  ▸ │    name · status · progress
│ Grace Community Church     Owner Review          ▓▓▓▓▓▓▓░ 23/25  [—]   ▸ │    meter · fraction · risk
└──────────────────────────────────────────────────────────────────────────┘
┌ RECENT ACTIVITY (paper, full width, quiet) ──────────────────────────────┐
│ RECENT ACTIVITY                                                           │
│ ◉ Jordan Lee reviewed the HVAC O&M Manual                    1h ago      │  ← icon dots (action-typed),
│ ○ Sam Rivera submitted a replacement document                2h ago      │    NOT numbered circles;
│ …                                                            View all ▸  │    no per-row captions
└──────────────────────────────────────────────────────────────────────────┘
```

**First-viewport priority (1440×900):** page header + stat strip + Needs Attention + right rail fully visible; Project Health partially. The screen answers "what needs me" without scrolling. Health/Activity are the scroll reward.

## 3. Section-by-section decisions

| Content | Form (decided) | Rationale |
|---|---|---|
| Portfolio counts | **Stat strip** (metrics) | numbers as focal point; not four cards |
| Overdue reqs + missing items + waiting responses | **"Needs attention" unified compact list** | one triage queue, not per-type boxes |
| My review queue | **Compact list** (rail) | glanceable, links into project reviews |
| Upcoming deadlines | **Mini date list** (rail, shares panel with reviews via divider) | new — operationally vital, tiny footprint |
| Project completeness | **Table-like health rows with progress meters** | the "closeout binder" spine |
| Activity | **Timeline list** (icon dots) | provenance record, quiet |
| Trends/charts | **Not rendered.** A single "Trends arrive in Phase 11" footnote row inside Project Health, nothing chart-shaped | honest; avoids fake analytics |
| Quick actions | **Page-header action ("Go to projects ▸") + command palette** | no dead Customize slab; real navigation only |
| Customize | **Removed from the page.** Noted in `/design` gallery as future Phase 11 affordance | a disabled control this prominent earns nothing |

**Stat strip spec:** one `--surface` panel, `--shadow-card`, radius-lg; 4 equal cells divided by hairlines; cell = 13px muted label over 32px/600 tabular numeral + optional small context glyph; Overdue cell numeral uses `--warning-foreground` with ⚠ icon (color-not-alone). Cells are links (Projects / Requirements-due / Reviews / Overdue filter targets — placeholder hrefs to existing routes). Hover: `--muted`/60 tint. 2×2 grid on tablet; 2×2 on mobile (§5).

**Needs attention rows:** icon (severity-typed) + primary text (project/requirement) + one-line secondary meta + right-aligned status/risk badge + date + chevron; 52px row height; hairline dividers; whole row is a link; count in the overline header; "View all ▸" footer link. **No duplicated text** (meta appears once). Max 5 rows.

**Awaiting my review rows:** title + stage/step meta + StatusBadge right; 48px; links to project reviews. **Upcoming deadlines rows:** tabular date (mono) + item + tiny status tick; 40px.

**Project health rows:** 56px; name (link) + StatusBadge + `Progress` meter (existing component, 96px wide) + `18/25` tabular fraction + RiskIndicator + chevron. Overline header; hairline dividers.

**Activity rows:** 40px; 8px icon-dot in a 24px muted circle (icon by action type: eye=review, upload=submission, send=request, check=approval) + sentence + right-aligned relative time (tabular). No "static provenance example" captions — the **page-level preview pill covers sample-data honesty**.

## 4. Tablet structure (md–lg)

Stat strip → **2×2 grid** (same panel, internal hairline cross). Needs Attention full-width; rail contents (Reviews + Deadlines) become a **two-up row** beneath it; Health + Activity stack full-width. Sidebar off-canvas per shell rules; page gutter 24px.

## 5. Mobile structure (< md)

Order: page header (title + preview pill inline, meta line below) → **stat strip as 2×2 compact grid** (cells 72px, numerals 28px — four stats in one phone viewport, replacing today's 520px of stacked cards) → Needs Attention (top 3 + View all) → Awaiting my review (2) → Upcoming deadlines (3) → Project health (compact rows: name/status/fraction) → Activity (3 + View all). No disabled buttons anywhere on mobile. Bottom safe-area padding `env(safe-area-inset-bottom)`. Touch targets ≥44px (rows already ≥48px).

## 6. States

- **Empty (no projects):** one paper panel: compass icon (muted), "No projects yet," "Projects appear here once they're created in Phase 5," quiet outline CTA to `/projects`. Stat strip renders with `0` values (em-dash for risk), not hidden — the frame persists.
- **Loading:** skeleton stat strip (4 numeral blocks) + 3 skeleton rows per panel; `aria-busy`; no layout shift (fixed heights match real rows).
- **Error:** per-panel `ErrorState` (compact, inline retry) — one failing panel never blanks the page; stat strip falls back to em-dashes with a tooltip.
- **Preview treatment:** exactly **one** indicator — the page-header **Preview pill** (info-tinted outline, 11px overline type, ⓘ icon) whose popover explains: "This dashboard shows static sample data for design review. Live portfolio analytics arrive in Phase 11." Nothing else on the page says sample/preview/static. Sample names remain obviously fictional — that plus the pill is honest.

## 7. Exact component changes required

| Component | Change |
|---|---|
| `MetricCard` | superseded on dashboard by new `StatStrip` (composed cells); MetricCard remains in `ui` for other uses, restyled per [component-polish §metric] |
| `dashboard-page.tsx` | recomposed to §2 structure (server component; rows are existing Link/Badge primitives) |
| New `AttentionList`, `DeadlineList`, `HealthRow` presentational pieces | thin compositions in `apps/web/components/dashboard/` — **no new client islands** (pure render) |
| Activity list | icon-dot variant; remove numbered circles + captions |
| Preview chip | new `PreviewPill` (+ popover) used by PageHeader across all placeholder routes |
| "Customize" slab | deleted |

## 8. Screenshot review checkpoints (for Phase 3E-B Task 11)

Dashboard at 1440 light, 1440 dark, 1280 laptop, 834 tablet, 390 mobile; plus empty-state and loading-state captures. Founder soft-review before proceeding to remaining routes.

---

*Continue to [phase-3e-component-polish.md](./phase-3e-component-polish.md).*

# FILE: /docs/visual-seo/current-visual-audit.md

> **Document status:** Phase 6E-A specification — evidence-based teardown of the current authenticated product. **Observations only; no fixes here (fixes live in the redesign specs).**
> **Evidence:** live application review (signed in as the seeded owner) plus source inspection of `apps/web/components/*` and `packages/ui/src/tokens.css`.

## 1. Dashboard teardown (the founder's exhibit — the worst offender)

**Live state (`/dashboard`, source `components/dashboard/*` + `components/pages/dashboard-page.tsx`):** the entire dashboard is **static mock data** wrapped in a `PreviewPill` (`previewPhase={11}`, "static sample data for design review"). Every number and row is fabricated, and most describe **systems that do not exist**:

| Widget | Live content | Truth problem |
|--------|--------------|---------------|
| Header | "Dashboard `PREVIEW` · Thursday, Jul 16 · Sample Construction Co." | Hard-coded date; `PREVIEW` label reads as unfinished. |
| StatStrip | Active projects **3**, Due this week **7**, **Awaiting my review 2**, **Overdue 1 ⚠** | "Awaiting my review" and "Overdue" describe Phase 9 review + Phase 10 deadline systems that **do not exist**. |
| Needs attention | "Riverside… 2 overdue requirements · Medium", "Roofing Warranty · **Missing submission** · Missing", "Eastgate… 1 **review** awaiting response · Review" | "Missing submission", "review awaiting response", "Medium" risk = Phase 8/9/11 fiction. |
| Awaiting my review (2) | "HVAC O&M Manual · PM review · **2 of 3** · In progress", "Fire Alarm Test Report · Final · 3 of 3 · **Approved**" | Pure Phase 9 review-chain fabrication. |
| Upcoming deadlines | dated list with completion checks | Phase 10 reminders/deadlines fiction. |
| Project health | "Riverside… Closeout In Progress · **18/25** · Medium" (`RiskIndicator`) | Phase 11 risk scoring + fake completion ratio; "Trends arrive in Phase 11". |
| Recent activity | "Jordan Lee **reviewed** the HVAC O&M Manual", "Sam Rivera **submitted** a replacement document" | Phase 8/9 verbs for actions the system cannot perform. |

**Visual problems (independent of truth):** flat hierarchy with no focal point; the stat row is a generic four-up KPI strip; every panel is the same bordered rectangle (see §3); secondary text at 13px is thin; the page is dense top-to-bottom with nothing dominant; the sidebar "Dashboard" item is a heavy solid-fill block.

**Verdict:** the dashboard must be **rebuilt from zero on real Phase 5/6 data**, the `PREVIEW` pill removed, and every review/submission/approval/risk/deadline term deleted. Directions in [dashboard-redesign.md](./dashboard-redesign.md).

## 2. Later-phase language census (delete everywhere it implies non-existent systems)

Beyond the dashboard, audit and remove any UI string implying uploads/submissions/reviews/approvals/risk/deadlines/packages on **real** surfaces. Confirmed offenders live only in the mock dashboard widgets (`stat-strip.tsx`, `attention-list.tsx`, `supporting-rail.tsx`, `project-health.tsx`, `activity-list.tsx`). The Phase 6 register/overview already use honest language ("Planned", "Not applicable", "Planned date passed", "Requests are sent when the subcontractor portal arrives"). The project sub-nav correctly keeps documents/reviews/etc. as honest `PreviewPill` placeholders — **keep those**; they are honest, not fake.

## 3. Systemic surface / token flatness (the "identical dark rectangles" root cause)

Source: `packages/ui/src/tokens.css`.

- **Light:** `--shadow-card: 0 1px 2px 0 hsl(220 30% 15% / 0.05), 0 0 0 1px hsl(var(--border))` — every card is a faint shadow **plus a 1px border ring**.
- **Dark:** `--shadow-card: 0 0 0 1px hsl(var(--border))` — **just a border ring, no elevation.** So in dark mode every panel is literally an identical outlined rectangle. This is the exact founder complaint, and it is a **token-level** cause, not a per-page one.
- Surface tokens exist (`--surface`, `--surface-raised`, `--surface-sunken`) but are barely differentiated and the uniform `shadow-card` ring is applied to nearly everything (`Card`, `Section`, list wrappers, dashboard panels), erasing hierarchy.

**Direction (see [design-system-evolution.md §Surface](./design-system-evolution.md)):** define a small **surface ladder** — canvas → quiet → panel → raised/interactive — using tone + spacing + one restrained elevation for *raised only*, and stop ringing every container. Borders become a deliberate accent (tables, insets), not the default frame.

## 4. Navigation heaviness

Source: `components/shell/sidebar.tsx`, `primary-navigation.tsx`, `navigation.ts`.

- The active item renders as a large solid-fill block (the `/dashboard` selection dominates the rail).
- Core destinations (Dashboard/Projects/Companies/Contacts/Templates) and utility destinations (Reports-disabled/Team/Settings) are visually undifferentiated — one flat list.
- The `1 Issue` dev badge and collapse chevron sit in the same weight as nav.

**Direction ([application-shell.md §Sidebar](./application-shell.md)):** lighter active treatment (tinted text + left accent or soft pill, not a filled block), a grouped rail (primary work vs. org utilities), refined proportions, honest disabled treatment for later-phase items.

## 5. Typography & density

- Secondary text at 13px `text-muted-foreground` is frequently too light/small for scanning (dashboard metas, table sub-lines).
- Page titles do not command enough of the first viewport; title/context/state/actions compete.
- Numbers are tabular (good) but the KPI presentation is generic.

**Direction ([design-system-evolution.md §Typography](./design-system-evolution.md)):** raise the page-title step, lift secondary text to a readable minimum, formalize a data-emphasis treatment, and give each page one dominant element in the first viewport.

## 6. Per-page-group quick findings (detail in the redesign specs)

- **Projects list / directories:** sound `DataTable`+card pattern, but generic density, weak first viewport, dividers-heavy. → premium table system.
- **Project overview:** honest and useful (Phase 6 panel is real), but panels share one treatment and will crowd as phases land. → surface differentiation + a growth-safe panel grid.
- **Requirement register:** already the strongest surface (grouped, honest, derived attention) — elevate it to *flagship* with a refined table system, bulk bar, and status ink; it should be the product's showcase.
- **Templates library/builder:** functional and first-class in IA, but the builder is a long stacked form; needs hierarchy + a "time saved / standardization" value frame.
- **Team/settings:** risk of generic settings-card grids; needs a two-pane, quiet-surface treatment with clear dangerous-action hierarchy.
- **Auth/onboarding:** Phase 5E is genuinely strong — **refine only** (logo sizing, form width, error states, mobile), do not redesign for novelty.

## 7. Public surface

`/` currently `redirect("/dashboard")`. There is **no public marketing content and no indexable page**, so `closeoutflow.com` cannot rank or convert. This is the single largest commercial gap and is addressed in [public-site-architecture.md](./public-site-architecture.md) + [seo-content-and-metadata.md](./seo-content-and-metadata.md).

## 8. Priority-ordered problem list (for 6E-B sequencing)

1. **Dashboard is a fabricated Phase 8/9/11 fiction** (truth + visual) — rebuild on real data, remove PREVIEW. **P0.**
2. **Token-level surface flatness** (identical rectangles, dark-mode has no elevation) — fix in shared tokens first. **P0.**
3. **No public/indexable marketing site** — build truthful homepage + core pages. **P0 (commercial).**
4. **Heavy sidebar selection / flat nav grouping.** **P1.**
5. **Requirement register / template library not yet at flagship polish.** **P1.**
6. **Small secondary type / weak title hierarchy.** **P1.**
7. **Directory & project-panel sameness; settings-card feel.** **P2.**
8. **State-system consistency (empty/loading/error/permission) across pages.** **P2.**

---

*Continue to [design-system-evolution.md](./design-system-evolution.md).*

# FILE: /docs/visual-seo/phase-6e-b2-authenticated-rollout.md

> **Document status:** Phase 6E-B2 — authenticated product premium visual rollout. **Presentation-layer only; no migration, RPC, RLS, grant, permission, audit, server-action or authentication-logic change.**
> **Branch:** `codex/phase-6e-b2-authenticated-visual-rollout` (baseline `229ce5c`, the Phase 6E-B1 head).
> **Status:** implementation complete for every authenticated group. **Verification is incomplete** — the local Docker engine could not be started in this environment, so no database-backed suite and no screenshot matrix could be produced. See §12 and §16.

## 1. Baseline

| Item | Value |
|------|-------|
| Branch cut from | `229ce5c` — `test: capture and a11y-check the visual direction review board` (B1 head) |
| Worktree at cut | clean, synchronized with `origin` (0 ahead / 0 behind) |
| B1 prototypes | committed and pushed before this branch; **not modified or discarded** |
| `pnpm format:check` | ✅ pass |
| `pnpm lint` | ✅ pass (eslint + workspace import boundaries) |
| `pnpm typecheck` | ✅ pass (15/15 packages) |
| `pnpm test` | ✅ 184 tests / 45 files |
| `pnpm build` | ✅ 15/15 tasks |
| Accessibility / production probe / DB suites | ❌ **not run** — require Docker (§12) |
| Baseline screenshots | ❌ **not captured** — require a running app against a seeded database (§12) |

## 2. Shared-system changes (G1 — commit `62aebb6`)

The founder-approved B1 scoped prototype tokens were migrated into production `packages/ui/src/tokens.css`, the Tailwind preset and the shared primitives, so pages inherit the change rather than restyling themselves.

**Surface ladder.** canvas → quiet → panel → raised → overlay, differentiated by tone and elevation.

| Tier | Treatment |
|------|-----------|
| Canvas (`--background`) | page background, no border, no shadow |
| Quiet (`--surface-sunken`) | grouping regions, insets, toolbars — tone only |
| Panel (`--surface`) | default content surface — hairline boundary, **no drop shadow** |
| Raised (`--surface-raised`) | the one focal element per view — real elevation, **no ring** |
| Overlay | dialogs, sheets, popovers, menus — stronger elevation |

**The core fix.** `--shadow-card` was `0 1px 2px + 0 0 0 1px border` in light and *only* a border ring in dark, so every panel and every "raised" surface rendered as the same outlined rectangle. It is now a hairline boundary with no drop shadow, and elevation is reserved for `--shadow-raised` / `--shadow-overlay`. Dark mode gains genuine ambient elevation for the first time.

Also delivered:

- **`--hairline`** for internal table/list rules, held lower-contrast than `--border` in both themes (regression-tested) so registers stop reading as a spreadsheet grid.
- **Secondary text contrast raised** in both themes; the overline takes the quieter rank so the two ranks stay distinguishable. AA re-verified on canvas, quiet, panel and raised in both themes.
- **Page titles 24px → 30px**; new section and metric type steps.
- **Navigation tokens** for the light-accent active state.
- **Content-width system** gains `--content-wide` for operational pages.
- **`Card` tiers** (`quiet` / `panel` / `raised`), defaulting to `panel` so existing usage is unchanged.
- **New primitives:** `Metric`, `RecordCard`, `AttentionChip`, `Meter`.
- **State system:** `EmptyState` / `ErrorState` / `PermissionDenied` share one composition.
- **Overlays:** real elevation, hairline boundary, safe-area-aware bottom sheet below `sm`.
- **`DataTable`:** hairline rules, overline headers, quiet-surface hover and toolbar.

### Defect found and fixed during G1

`text-h1` and `text-h2` were referenced by five page headings (`/platform`, `/account/profile`, `/account/preferences`, `/account/security`, `/account/sessions`) and by the `Dialog` and `AlertDialog` titles, **but generated no CSS at all** — the design tokens live in a plain `:root` block, not a Tailwind `@theme`, so no utility was ever emitted. Those headings silently rendered at 14px body size. Both utilities are now defined; verified in the browser at 30px and 18px respectively.

## 3. Application shell (G2 — commit `0e09772`)

- **Grouped rail:** **Work** (Dashboard · Projects · Companies · Contacts · Templates) and **Organization** (Team · Settings · Reports). Templates remain first-class under Work.
- **Light-accent active state:** tinted background + 3px left accent bar + accent text. The oversized solid-filled block is gone. The settings rail uses the same treatment so the two agree.
- Each group renders as a **labelled list**, so the collapsed icon rail still announces its structure; collapsed items keep accessible names and tooltips.
- **Reports** is honestly disabled with a "Later" chip plus a screen-reader clarification, and is excluded from the command palette.
- Header, sidebar and sub-nav adopt hairline boundaries; sidebar, header and `main` gain safe-area padding.
- **Operational full-width mode:** dashboard, project list, directories, template library and the register take `--content-wide`; forms and detail keep the reading width.
- **Notifications:** the bell stays quiet and truthful — no unread count, no invented items; it now states that reminders arrive with the notifications system.
- **Command palette:** dropped stale "sample projects / no live search or API" wording; it is honest that it jumps between pages and that searching records comes later.

### Defect found and fixed during G2

`brand.tsx` wrote `sidebar-collapsed-only:block` as if it were a Tailwind variant, but `sidebar-collapsed-only` is a plain class defined in `globals.css`. Tailwind emitted **no rule** for the variant-style class, so the element kept `hidden` and **the collapsed sidebar rendered no logo at all**. Verified in the browser: the mark now shows collapsed and the full lockup shows expanded.

## 4. Dashboard (G3 — commit `b7d44db`)

**Deleted entirely** (all fabricated Phase 8/9/11 content): `PreviewPill` on the dashboard, `StatStrip` ("Awaiting my review", "Overdue"), `AttentionList` ("Missing submission", "review awaiting response"), `SupportingRail` ("Upcoming deadlines"), `ProjectHealth` ("18/25", "Medium risk"), `ActivityList` (invented "reviewed"/"submitted" verbs), and the `DashboardPage` Phase-3 wrapper.

**Rebuilt as Direction A**, attention-first, on real data only:

- **Metric trio** — Active projects · Projects needing setup · Requirements needing attention. No four-up KPI strip, no charts, no decorative progress.
- **Focal raised panel** — "Projects needing setup attention", ranking the caller's active projects by outstanding setup, naming the real reasons, showing genuine configured-of-total progress, and linking to that project's register (deep-filtered to `?attention=1`, or to the empty register when nothing is configured).
- **Quiet rail** — recently updated projects and recently configured templates.

**Data sources (FD-2 Path A — no new SQL):** `search_projects` (RLS-scoped) plus `get_requirement_summary` for a bounded set of at most **10** projects. Both readers already enforce authorization; the summary re-checks `can_access_project` and `requirement.view` per project and raises `42501` otherwise.

**Permission-safe behaviour:** a caller who can see a project but not its requirements is **omitted from the counts** rather than shown a zero we cannot stand behind, and the metric states when counts are partial.

**States implemented:** populated · empty organization · no active projects · nothing needing attention · requirements not readable · error · loading skeleton mirroring the real layout.

`RiskIndicator` is marked `@deprecated` and no longer appears on any real-data surface. It survives only for the dev-only gallery and the clearly-labelled later-phase preview pages (see §14).

## 5. Projects (G4 — commit `14f63be`)

Filter toolbar drops to a quiet inset; table headers take the overline rank; rules become hairlines; hover uses the quiet surface; long project names truncate with an accessible title on both table and mobile cards. The **setup checklist** becomes the focal raised panel while setup is incomplete and recedes to a plain panel once done, using the shared `Meter` with a real count instead of a decorative bar and a large percentage.

## 6. Requirement register (G5 — commit `2896ca0`)

Category group headers move to the quiet surface and overline rank; internal rules become hairlines; column headers take the overline rank; row hover uses the quiet surface; summary chips adopt the light-accent treatment so a selected filter reads as selected; the filter toolbar drops to a quiet inset; secondary text moves off the smallest step to the readable 13px rank; attention stays a quiet warning chip.

**Preserved exactly:** the Firefox-safe `table-fixed` + grouped `<tbody>` pattern, stored lifecycle rules, derived attention, selection, bulk cap, optimistic concurrency, accessible adjacent-move controls and date-only behaviour.

## 7. Templates (G6 — commit `68e8c51`)

The library was a four-column settings-style table. It is now a **card grid**, one card per family, leading with the name, what the template standardises, and where its version chain stands — published and draft as distinct chips rather than a run-on text cell. Each card carries the real requirement count and last update, and the whole card is the link.

The starter disclaimer appears exactly as approved: **"Editable starting point. Verify requirements against your contract documents and project obligations."**

## 8. Directories (G7 — commit `8c817a4`)

Both directories take the shared table system. Long company names, contact names, company affiliation and email truncate with an accessible title. Counts are tabular and correctly pluralised on mobile cards.

## 9. Team and settings (G8 — commit `561ae00`)

The status column rendered the **raw enum value**, and a suspended member was styled almost identically to an active one. Suspended members now sit on the quiet surface with muted names and a warning "Suspended" badge; the status column renders human labels. Role assignment, suspension, removal and every permission gate are untouched.

## 10. Authentication refinements (G9 — commit `56f2144`)

Refinement only. The auth card carried an explicit border *and* `shadow-card`, which after the ladder change meant two boundaries; it is the focal element of the page, so it takes the raised tier. Adds safe-area bottom padding. **No authentication logic, redirect behaviour, token handling, invitation validation, OAuth configuration, MFA or recovery-code behaviour touched.**

## 11. Global states (G10 — commit `61f64d0`, gallery fix `576bbc0`)

- The 404 said the page "is not available in this preview" — reading as an unfinished product. It now states plainly that the page does not exist or is not accessible, wording that stays deliberately **non-enumerating**.
- The projects loading state dropped its "Loading projects…" text and double-bounded placeholder boxes for a skeleton mirroring the real list layout.
- The dev-only gallery dashboard specimens still labelled their metric row "Due this week", "Awaiting my review", "Overdue"; they now mirror the real metric trio.

## 12. What could NOT be verified in this environment

**Docker Desktop could not be started.** The service `com.docker.service` is stopped and starting it requires elevation, which is a founder action. Consequently the local Supabase stack would not start, and the following mandated steps **did not run**:

| Step | Status |
|------|--------|
| `pnpm db:start` / `db:reset` / `db:lint` / `db:validate` | ❌ not run — Docker unavailable |
| `pnpm test:db` | ❌ not run |
| `pnpm test:phase6-scale` | ❌ not run |
| `pnpm test:e2e` | ❌ not run |
| `pnpm test:a11y` | ❌ not run |
| `pnpm test:live-security` | ❌ not run |
| `pnpm test:production-probe` | ❌ not run |
| Baseline screenshots | ❌ not captured |
| **Visual acceptance matrix** (§13) | ❌ **not captured** |
| Dashboard numbers against seeded data | ⚠️ **not verified live** — covered by unit tests instead (§15) |

This is the reason the phase verdict is *incomplete* rather than ready for review. Everything is implemented and every Docker-free check is green, but the founder checkpoint depends on visual evidence that cannot be produced here.

## 13. Visual evidence index

**Empty.** No screenshots were captured. The mandated matrix (1920×1080, 1440×900, laptop, tablet landscape/portrait, Pixel 7, iPhone 15 × light/dark × empty/populated/long/loading/error/permission/archived) requires the app running against a seeded database.

Partial in-browser verification *was* performed against the dev server before the database became unavailable, using DOM and computed-style inspection rather than images:

| Check | Result |
|-------|--------|
| All new tokens resolve in the browser | ✅ |
| Dark `--shadow-raised` is a real ambient shadow, not a ring | ✅ |
| `.text-h1` renders 30px, `.text-h2` 18px (was 14px) | ✅ |
| Sidebar groups render as Work / Organization | ✅ |
| Active nav item = tinted bg + 3px accent bar, not a filled block | ✅ |
| Reports honestly marked "Later — not available yet" | ✅ |
| Collapsed rail shows the mark; expanded shows the lockup | ✅ |

## 14. Components refined / rebuilt / deprecated

| Component | Disposition |
|-----------|-------------|
| `Card` | Refined — gains `quiet`/`panel`/`raised` tiers |
| `EmptyState` / `ErrorState` / `PermissionDenied` | Refined — one shared composition |
| `Dialog` / `AlertDialog` / `Sheet` / `Popover` / `DropdownMenu` | Refined — real elevation, mobile sheet |
| `DataTable` | Refined — hairlines, overline headers, quiet hover |
| `Sidebar` / `PrimaryNavigation` | **Rebuilt** — grouped rail, light accent |
| Dashboard | **Rebuilt** — `AttentionPanel`, `DashboardRail`, `loadDashboardData` |
| Template library | **Rebuilt** — cards, not a table |
| `Metric`, `RecordCard`, `AttentionChip`, `Meter` | **New** |
| `StatStrip`, `AttentionList`, `SupportingRail`, `ProjectHealth`, `ActivityList`, `DashboardPage` | **Deleted** |
| `RiskIndicator` | **Deprecated** — removed from all real-data surfaces |

> **Deliberate call on `RiskIndicator`:** `design-system-evolution.md` §9 says "deprecate". It is deleted from every real-data surface, but the component file is retained because the dev-only gallery and the honest later-phase preview pages (`/projects/[id]/documents`, `reviews`, `equipment`, `warranties` — all `PreviewPill`-labelled, priority P3 "keep") still reference it via `list-columns.tsx`. Fully removing it would mean rewriting Phase-3 preview content that the route inventory explicitly says to keep. Flagged for founder direction.

## 15. Test results

| Suite | Baseline | After |
|-------|:--------:|:-----:|
| `pnpm format:check` | ✅ | ✅ |
| `pnpm lint` (+ boundaries) | ✅ | ✅ |
| `pnpm typecheck` | ✅ 15/15 | ✅ 15/15 |
| `pnpm test` | ✅ 184 / 45 files | ✅ **233 / 48 files** |
| `pnpm build` | ✅ 15/15 | ✅ 15/15 |
| `pnpm test:server-only` | not run at baseline | ✅ both client-import escapes still fail the build as required |

**49 tests added**, none weakened or skipped:

- **Token/contrast (`tokens.test.ts`, rewritten):** the ladder tokens exist; dark elevation has real blur/spread geometry and is not a ring; panels carry no drop shadow; `--hairline` stays lower-contrast than `--border` in both themes; AA holds for primary, secondary and overline text on canvas/quiet/panel/raised in both themes, plus the active-nav label and primary button.
- **Surface system (`surface-system.test.tsx`, new):** tier treatments are distinct; `Card` still defaults to panel; `Metric` / `RecordCard` / `Meter` / state components behave and pass axe; `Meter` does not divide by zero.
- **Navigation (`primary-navigation.test.tsx`, new):** grouping and membership; light-accent active state (asserts it is *not* `bg-primary`); sub-route activity; Reports is not a link and is honestly marked; command palette excludes it; collapsed rail keeps accessible names; axe clean in both rail states.
- **Dashboard (`dashboard-data.test.ts`, new):** active-status filtering; attention summation and ranking (empty projects first); fully-configured exclusion; **the permission-denied path omits rather than zeroes**; summary fetches are bounded to 10 and partial counts are flagged; recent ordering; error surfacing; empty organization.

## 16. Business-logic and security-boundary preservation

Verified by diff over the whole branch (`git diff --name-only 229ce5c..HEAD`):

- **No** file under `supabase/`, no `.sql`, no migration touched.
- **No** change to `packages/authz`, `packages/audit`, `packages/auth`, or middleware.
- **No** server action changed (`apps/web/actions/**` untouched).
- **No** secure Server Component replaced with client-side tenant-data fetching. The dashboard reader is `server-only` and uses the existing request-auth client.
- **No** private data moved into public layouts or metadata.
- `(app)/layout.tsx` still sets `robots: { index: false, follow: false }`.
- No fabricated later-phase language remains on any real surface.
- No secrets committed.

**Not independently re-verified** (requires the DB/probe suites in §12): RLS behaviour at runtime, CSP nonce behaviour in a production build, `/design` returning 404 in production, and live security probes. None of these files were modified, but the assertion rests on the diff rather than on a passing probe.

## 17. Remaining concerns

1. **No visual evidence.** The founder checkpoint cannot proceed without the capture matrix. Highest priority once Docker is available.
2. **Dashboard numbers unverified against live data.** Derivation is well covered by unit tests, but the RPC shapes have not been exercised end-to-end on this branch.
3. **`RiskIndicator` retained** for gallery/preview pages — see §14, needs a founder call.
4. **Register detail, apply flow, project overview, project sub-pages, account pages and the remaining settings pages** received the inherited shared-system improvements (surfaces, type scale, dialogs, states) but **no dedicated per-page composition pass**. They are improved but not individually reviewed against the acceptance matrix.
5. **`linkButton` keeps a hardcoded `#1d4f9a`** rather than a token. It is a deliberate Phase 5E hydration-contrast measure; left untouched, but it is a standing exception to the "no one-off colour literals" rule.

## 18. Founder checkpoint

**Not ready.** Implementation is complete and every Docker-free gate is green, but the mandated authenticated-product review needs the visual acceptance matrix and the database-backed suites, neither of which could run here.

**To resume:** start Docker Desktop, then `pnpm db:start && pnpm db:reset`, then the full battery in the phase brief, then capture the matrix in §13.

---

*Related: [phase-6e-implementation-plan.md](./phase-6e-implementation-plan.md) · [phase-6e-b1-founder-visual-review.md](./phase-6e-b1-founder-visual-review.md) · [open-decisions.md](./open-decisions.md)*

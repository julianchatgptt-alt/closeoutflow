# FILE: /docs/visual-seo/phase-6e-b1-founder-visual-review.md

> **Document status:** Phase 6E-B1 — founder visual-direction checkpoint. **Development-only prototypes; no production routes, tokens, data, or business logic changed.**
> **Branch:** `codex/phase-6e-b1-visual-prototypes` (baseline `7789f3b`).
> **Where to review:** run the app locally and open **`/design`** → the **“Full-Product Visual Direction Review”** board (first section, in-page anchors: Surfaces · Shell · Dashboard · Register · Templates · Homepage · Current vs proposed · Risks & notes). The gallery returns **404 in production** (unchanged `APP_ENV` gate).

## 1. Files changed

| File | Type | Purpose |
|------|------|---------|
| `apps/web/components/gallery/full-product-visual-review.tsx` | **new** | The five prototypes + shared-surface comparison + current-vs-proposed + risks board (static specimen data). |
| `apps/web/components/gallery/full-product-visual-review.module.css` | **new** | **Scoped** prototype tokens (`.scope`) — a real surface ladder with genuine light/dark elevation. Never touches production `tokens.css`. |
| `apps/web/components/gallery/design-gallery.tsx` | edit | Mounts the review board at the top of the dev-only gallery (one import + one render). |
| `scripts/phase-6e-b1.capture.spec.ts` | **new** | Dev-only capture + focused axe scan of the board. |
| `playwright.phase6e-b1.capture.config.ts` | **new** | Standalone capture config (reuses a running local dev server; no DB harness). |
| `docs/visual-seo/phase-6e-b1-founder-visual-review.md` | **new** | This document. |

**Not touched:** any production route/page, `packages/ui/src/tokens.css` or primitives, migrations, RPCs, RLS, grants, permissions, audit, server actions, real dashboard queries, indexing/robots/sitemap, the Keystone Fold assets, or the `/design` production gate.

## 2. Baseline evidence

- Branch cut from the clean post-6D head `7789f3b` (the 13 Phase 6E-A planning docs committed first).
- Current live dashboard reviewed as the founder’s exhibit: a `PREVIEW` pill over fabricated Phase 8/9/11 content — “Awaiting my review 2”, “Overdue 1”, “Missing submission”, “1 review awaiting response · 2 of 3 · Approved”, “Project health 18/25 · Medium risk” — atop flat, identical bordered rectangles (dark-mode `--shadow-card` is only a border ring, so every panel is an identical outline). This is captured in the board’s **Current vs. proposed** comparison.

## 3. Shell result (Prototype 1)

Grouped **Work / Organization** rail; the oversized filled active block is replaced by a **light-accent treatment** (tinted background + 3px left accent + accent text); quieter header (org switcher, breadcrumbs, search/⌘K, honest bell, help, avatar); **honest “Later” chip** for unbuilt destinations (Reports); **Templates first-class**; refined spacing and readable secondary text; collapsed icon rail with accessible labels; mobile drawer with the same grouped rail. Keystone Fold symbol + wordmark, **placement only**. Rendered light + dark, expanded + collapsed, desktop + mobile.

## 4. Dashboard result (Prototype 2 — Direction A)

Attention-first, truthful. Strong page title + restrained org context; one primary action (**New project**); a compact **three-metric** row (Active projects · Projects needing setup · Requirements needing attention) with no four-card KPI strip; a **dominant raised operational list** — “Projects needing setup attention” — each row showing status, the real reasons (unassigned / undated / stale), a setup-progress meter, and an “N to fix” chip; a quiet rail with recently-configured templates and a recommended next action. Empty-organization and mobile states included. **Zero** review/submission/approval/risk/deadline/health/% language; no `PREVIEW`. Rendered desktop light/dark, empty, mobile.

## 5. Requirement-register result (Prototype 3)

Preserves the real Phase 6 IA (category groups, responsible company/contact, internal owner, due date, source line, derived attention, selection, bulk bar, search, summary chips). Improvements: stronger title, category group headers on a quiet surface, **hairline** internal rules (no spreadsheet grid), readable secondary type, honest status ink (**Planned** / **Not applicable**), attention as quiet warning chips (“Unassigned”, “Company left project”, “Planned date passed”) rather than red alarms, a refined bulk bar, mobile-card conversion, and empty/no-results/loading states. Rendered light + dark + mobile + states.

## 6. Template-library result (Prototype 4)

A first-class reuse surface presented as **cards, not a settings table**: name, purpose, **version + status** chips (draft vs published), requirement count, last update, and a “time saved / standardization” value line; the **version-chain** detail (draft vs published + publish panel); empty state that sells reuse; and the **FD-6** disclaimer verbatim — “Editable starting point. Verify requirements against your contract documents and project obligations.” Rendered light + dark + mobile.

## 7. Homepage result (Prototype 5, dev-only)

Truthful marketing direction visually connected to the product. Header → hero (“Construction closeout software” + honest value prop) → **real product framing** (the register in a browser frame) → How it works (3 real steps) → requirement-register value → template value → project/team coordination → security & access → who it’s for → **honest FAQ** (“Does it handle document uploads or reviews yet? Not yet…”) → **Request access** CTA (secondary **Sign in**) → footer. Advertises only Phase 4/5/6 capability (**FD-7**); **Request access** primary per **FD-3/FD-4**. No fake logos/testimonials/metrics/ratings/certifications/integrations/pricing/AI/clichés/gradient-as-brand. Truthful SEO-facing language (construction closeout software, project closeout software, closeout requirement tracking, requirement templates, commercial construction closeout, project handoff organization) used naturally. Rendered desktop + mobile. *Known artifact:* the hero’s live-rendered register frame shows minor header overlap at the reduced scale — production will use a real captured screenshot, not a scaled live component.

## 8. Shared-system result

The scoped **surface ladder** — canvas → quiet → panel (hairline) → raised (real elevation) → overlay — is shown light and dark side by side. The key fix is visible: **dark-mode raised surfaces have genuine ambient elevation** instead of the identical border-ring rectangles of production. Stronger page-title scale, readable secondary type (raised to AA), refined chips/status, meters, table density, empty/loading states, and buttons are all demonstrated. These are **scoped specimens**; the production token migration is 6E-B task G1.

## 9. Accessibility result

Focused axe scan of the board region passes with **zero violations in light and dark**. Contrast findings surfaced by axe were fixed at the token level (secondary/muted text raised to meet 4.5:1; disabled-nav meaning carried by the “Later” chip, not low-contrast text). Duplicate-landmark findings were resolved by demoting the repeated shell/homepage specimens to non-landmark elements (they are visual illustrations, not the navigable app); the board keeps semantic headings, one uniquely-named review nav, `figure`/`figcaption` specimens, `alt=""` on the decorative mark, and keyboard-reachable anchors. Reduced motion is honored.

## 10. Responsive result

Every prototype captured at desktop (1440) and mobile (412); the shell also collapsed; register/templates/homepage as mobile cards/stacks. No horizontal clipping; long project/requirement names truncate; touch-friendly spacing.

## 11. Screenshot index

Directory: `C:\Users\julia\.codex\visualizations\2026\07\23\phase-6e-b1` (machine-local; regenerate with `PHASE6E_B1_CAPTURE_DIR=… npx playwright test --config playwright.phase6e-b1.capture.config.ts`). Commit: this branch head.

| # | ID | Route | Viewport | Theme | Purpose | Status |
|---|----|-------|----------|-------|---------|--------|
| 1 | `01-surfaces-light` | /design #pv-surfaces | 1440 | light | surface ladder | ✅ |
| 2 | `08-surfaces-dark` | /design #pv-surfaces | 1440 | dark | dark elevation | ✅ |
| 3 | `02-shell-light` | /design #pv-shell | 1440 | light | shell (light+dark+collapsed+mobile board) | ✅ |
| 4 | `09-shell-dark` | /design #pv-shell | 1440 | dark | shell board (dark theme) | ✅ |
| 5 | `13-shell-mobile` | /design #pv-shell | 412 | light | shell board (mobile) | ✅ |
| 6 | `03-dashboard-light` | /design #pv-dashboard | 1440 | light | Direction A | ✅ |
| 7 | `10-dashboard-dark` | /design #pv-dashboard | 1440 | dark | Direction A dark | ✅ |
| 8 | `14-dashboard-mobile` | /design #pv-dashboard | 412 | light | Direction A + empty state | ✅ |
| 9 | `04-register-light` | /design #pv-register | 1440 | light | register + states | ✅ |
| 10 | `11-register-dark` | /design #pv-register | 1440 | dark | register dark | ✅ |
| 11 | `15-register-mobile` | /design #pv-register | 412 | light | register mobile cards | ✅ |
| 12 | `05-templates-light` | /design #pv-templates | 1440 | light | library + version chain | ✅ |
| 13 | `12-templates-dark` | /design #pv-templates | 1440 | dark | library dark | ✅ |
| 14 | `16-templates-mobile` | /design #pv-templates | 412 | light | library mobile | ✅ |
| 15 | `06-homepage-light` | /design #pv-homepage | 1440 | light | homepage + product section | ✅ |
| 16 | `17-homepage-mobile` | /design #pv-homepage | 412 | light | homepage mobile | ✅ |
| 17 | `07-current-vs-proposed` | /design #pv-compare | 1440 | — | dashboard before/after | ✅ |
| 18 | `20-full-board-light` | /design | 1440 | light | full founder board | ✅ |
| 19 | `21-full-board-dark` | /design | 1440 | dark | full founder board (dark) | ✅ |

## 12. Known implementation risks (for 6E-B)

- Scoped prototype tokens must be migrated into production `tokens.css` carefully (G1), re-validating AA contrast in both themes across all existing surfaces.
- The production dashboard rebuild reads **real** access-scoped data via existing readers (`search_projects` + bounded `get_requirement_summary`) — **no new RPC** (FD-2); it removes the mock widgets and the `PreviewPill`, and deprecates `RiskIndicator`.
- Register/table refinements must preserve the Firefox-safe `table-fixed` + grouped `<tbody>` pattern proven in Phase 6.
- The homepage is a dev prototype; the real public site is a separate 6E-B track and stays `noindex` / request-only (FD-4) until founder Checkpoint 3.
- Local dev keeps orphaning on port 3000; free it before builds/captures (a stale process caused an EPERM build lock this session).

## 13. Confirmation

- **Production routes unchanged:** no file under `apps/web/app/**` production routes, no server action, no data query was modified. Only the dev-only gallery, the dev capture harness, and docs changed.
- **Business logic unchanged:** no migration/RPC/RLS/grant/permission/audit/server-action change.
- **No public route made indexable:** the homepage is a `/design` specimen only; no `(marketing)` production page was created; robots/sitemap unchanged.
- **Branding preserved:** corrected Keystone Fold logo used (placement only); no stale “CloseoutFlow” strings introduced.

## 14. Founder selections required

Confirm before 6E-B rollout (defaults already approved in FD-1..7):
1. **Approve the visual direction** shown (surface ladder, shell, Direction A dashboard, register, template library) for production migration.
2. **Approve the public homepage direction** (positioning, Request-access CTA, honest FAQ tone) for the separate public-site track.
3. Confirm any wording changes to the hero value proposition or category statement.
4. Confirm the honest **notifications** treatment (quiet bell + empty state) for the production shell.

No decision here is blocking; on approval, 6E-B proceeds per [phase-6e-implementation-plan.md](./phase-6e-implementation-plan.md) (tokens → shell → page groups → public → SEO), presentation-only.

# Phase 3C Audit

> **Auditor role:** Independent frontend architecture, UX, accessibility, branding, SEO-readiness & security reviewer.
> **Subject:** Codex Phase 3B on branch `codex/phase-3b-design-system` (commits `5393677`, `88a530d`, `9728359`, `bc1dc88`, `ad31670`, `7da23bf`, `a4df743`).
> **Method:** Independent inspection of the actual repository + reproduction of the validation suite **and live production probes**. The Codex summary was not trusted without verification.
> **Boundary honored:** No implementation code, tests, tokens, migrations, routes, or dependencies were changed. This audit added exactly one file: this document. No commits were made.
> **Permanent branding rule applied:** public brand = **Closeout**; domain `closeoutflow.com` allowed where a domain is displayed; internal `@closeoutflow/*` scopes and technical identifiers are allowed.

---

## 1. Executive verdict

Phase 3B is a **strong, honest, spec-faithful implementation** of the design system, application shell, and 26 placeholder routes. The lean 6-item global sidebar, contextual project sub-nav, exhaustive `statuses.md`-accurate status system, token-migrated primitives (no hardcoded `blue-*/slate-*` leakage), Radix-backed overlays, a real TanStack-wrapped `DataTable` with a genuine mobile card fallback, nonce-based production CSP, and a production-inaccessible `/design` gallery are all present and verified **at runtime**.

I reproduced the full static suite green and the key production behaviors directly: **`/dashboard` → 200**, **`/design` → 404**, **per-request nonce CSP with no `unsafe-inline`/`unsafe-eval` in `script-src`**, **26 unit files / 68 tests**, and **zero axe violations** on the sampled a11y suite (light + dark).

The one dominant issue is **branding**: the entire visible product still reads **"CloseoutFlow"** (browser titles, PWA manifest, sidebar, ARIA labels, gallery, SVG icon titles). This is expected — the "Closeout" decision was made in *this* phase, after Phase 3B — so it is legitimately Phase 3D remediation, but it is pervasive and must be fixed early (before Phase 4 auth screens and before stale snapshots/tests calcify).

**No CRITICAL findings. No security regressions.** Findings: **2 HIGH** (branding cluster + brand-regression test gap), **6 MEDIUM**, **8 LOW**, plus observations. **Verdict: READY FOR PHASE 3D REMEDIATION.**

---

## 2. Repository and Git state

| Check | Result |
|-------|--------|
| Branch | `codex/phase-3b-design-system` (expected) ✅ |
| Working tree before audit doc | clean ✅ |
| Seven Phase 3B commits present | ✅ all seven |
| Files changed across Phase 3B | 92 |
| Migrations / `packages/db|authz|audit|storage|...` touched | **none** ✅ (no backend/db changes) |
| Build artifacts / `.env` / logs committed | none ✅ |
| Secret patterns in changed source | none ✅ |
| New deps | `@tanstack/react-table`, `@radix-ui/*`, `@hookform/resolvers`, `react-hook-form`, IBM Plex via `next/font` — legitimate ✅ (caret ranges — see P3C-016) |
| Phase 2 history / migrations rewritten | no ✅ |
| Commit boundaries match messages | yes (tokens→primitives→shell→table/form→routes→docs) ✅ |

---

## 3. Scope compliance

**Phase 3 stayed within its boundary.** Verified absent: authentication/registration/sessions, real org switching, real project/company/requirement/document/review records, uploads, notifications, billing, integrations, AI, owner/subcontractor portals, business tables/migrations, real analytics, and API-backed behavior. `pnpm db:validate` still reports **infrastructure-only** schema; `git grep` for network/writes found **only** the server-side health route (`createServiceClient`) — **zero** `fetch`/mutations/`'use server'` in app/components. All actions are disabled placeholders or local-only (theme/density, form validation with explicit "No data was persisted").

Mock presentation vs. prohibited functionality: **correctly separated.** Mock data lives in `apps/web/src/mock/phase-3.ts`, is labeled, and never persists.

---

## 4. Public branding and SEO-readiness review

The visible product is **uniformly "CloseoutFlow."** Confirmed at runtime: rendered `<title>Dashboard · CloseoutFlow</title>`, manifest `"name":"CloseoutFlow"` / `"short_name":"CloseoutFlow"`, and 4 visible "CloseoutFlow" strings per dashboard page.

### 4.1 Brand census

| Location | File:line | Current visible value | Expected | Action | Phase 4 blocker |
|----------|-----------|-----------------------|----------|--------|:---------------:|
| Root browser title | `apps/web/app/layout.tsx:14` | `CloseoutFlow` | `Closeout` (+ template) | Replace | Yes |
| Per-page titles (14) | `app/(app)/**/page.tsx:2`, `(dev)/design/page.tsx:8` | `… · CloseoutFlow` | `… · Closeout` | Replace (prefer title template) | Yes |
| PWA name | `app/manifest.ts:5` | `CloseoutFlow` | `Closeout` | Replace | Yes |
| PWA short_name | `app/manifest.ts:6` | `CloseoutFlow` | `Closeout` | Replace | Yes |
| Sidebar brand text | `components/shell/app-shell.tsx:34` | `CloseoutFlow` | `Closeout` | Replace | Yes |
| Brand monogram | `app-shell.tsx:31` | `CF` | `C`/`CO` | Replace | Yes |
| Brand link ARIA label | `app-shell.tsx:29` | `CloseoutFlow dashboard` | `Closeout dashboard` | Replace | Yes |
| Mobile drawer title (visible + SR) | `app-shell.tsx:313` | `CloseoutFlow navigation` | `Closeout navigation` | Replace | Yes |
| Gallery H1 | `components/gallery/design-gallery.tsx:72` | `CloseoutFlow component gallery` | `Closeout component gallery` | Replace | Yes (dev, but required) |
| App icon `<title>` | `public/icons/icon-any.svg:2` | `CloseoutFlow foundation icon` | `Closeout …` | Replace | Yes |
| Maskable icon `<title>` | `public/icons/icon-maskable.svg:2` | `CloseoutFlow maskable foundation icon` | `Closeout …` | Replace | Yes |
| E2E assertions (lock stale brand) | `e2e/phase-3.spec.ts:57,59,118` | `CloseoutFlow navigation` / `… component gallery` | `Closeout …` | Update with rename | Yes |

**Total visible occurrences: ~23 across 8 shipped surfaces** (+ the `CF` monogram, + 3 test assertions that must change with the rename). **Allowed and unchanged:** `@closeoutflow/*` import scopes, `closeoutflow` package/DB/env identifiers, `cof-*` storage keys, and `docs/**` internal references — none of these are user-visible.

### 4.2 Metadata census

| Metadata | Present? | Result |
|----------|:--------:|--------|
| Root `title` | yes | `CloseoutFlow` (needs `Closeout` + `title.template`) |
| `metadataBase` | **no** | absent — needed for absolute OG/canonical URLs |
| `applicationName` | **no** | absent (should be `Closeout`) |
| OpenGraph (`siteName`/`title`) | **no** | absent |
| Twitter card | **no** | absent |
| `alternates.canonical` | **no** | absent (`https://closeoutflow.com`) |
| `description` | yes | `The well-run closeout binder, made live` (internal metaphor, not a customer descriptor — no "construction closeout software") |
| Per-page titles | yes | hardcoded strings (no template → brand repeated 14×) |
| Security/theme-color | yes | present in `viewport` |

### 4.3 PWA name review
`manifest.ts` has proper `icons` (P2C-009 resolved), `display: standalone`, theme/background colors — but `name`/`short_name` = `CloseoutFlow` and the SVG icon `<title>`s embed the old brand. Must all become `Closeout`.

### 4.4 Accessibility-label brand review
Brand leaks into AT-exposed labels: `aria-label="CloseoutFlow dashboard"`, `Sheet title="CloseoutFlow navigation"`, and SVG `<title>` elements. Screen-reader users currently hear "CloseoutFlow." Fix with the rename.

### 4.5 Allowed internal identifiers (no action)
`@closeoutflow/*`, `closeoutflow` package/repo/branch/DB/env names, `cof-theme|cof-density|cof-sidebar` storage keys, `docs/**` "CloseoutFlow" references (internal/historical).

### 4.6 SEO-readiness assessment
The frontend can support the brand cleanly, but the **metadata foundation is minimal** (no `metadataBase`, `title.template`, `applicationName`, OG, or canonical), and **`/` redirects to `/dashboard`** (`app/(marketing)/page.tsx`), so the intended homepage title *"Closeout | Construction Closeout Software"* has no home yet. Copy is brand-neutral and does not naturally surface *"construction closeout software"* — acceptable for an internal shell, but the descriptor should be added to root metadata during the rename. No keyword stuffing needed. Captured as **P3C-002**.

---

## 5. Design-system compliance

Verified against `design-direction.md` / `design-tokens.md` / `components.md`:

- **Engineered-blue primary** (`--blue-600 = 216 68% 36%`) + **warm graphite neutrals** + status ramps: implemented in `tokens.css` as primitive ramps → semantic tokens → components. ✅
- **Amber reserved for attention/warning** (`--warning-*`, `OverdueFlag`, "Later" affordances). ✅
- **Flat/bordered surfaces, limited shadows, controlled radius (`--radius` 0.5rem), quiet motion** (`--dur-*`, `motion-reduce:` guards on spinner/loading). ✅
- **Token discipline:** no hardcoded `blue-*/slate-*/gray-*` leaked into `packages/ui` components or `apps/web/components` (ramps correctly confined to `tokens.css`). `button.tsx`/`card.tsx` migrated to `bg-primary`, `bg-surface`, `border-border`, `bg-destructive`, etc. ✅
- **Density** is real: `[data-density="compact"] { --row-h: var(--row-h-compact) }`; toggle in user menu flips `dataset.density`. ✅
- **Tabular numerals** applied (globals, table cells, metric/gallery/pages). ✅
- No generic-SaaS-template drift or construction clichés observed. ✅

---

## 6. Application-shell review

`components/shell/app-shell.tsx` implements: fixed desktop sidebar with collapse **rail** (`lg:pl-16/64`, persisted via `cof-sidebar`), off-canvas **mobile drawer** (Radix `Sheet`, focus-trapped), header with **org switcher** placeholder (disabled "Create organization — Phase 4"), **breadcrumbs** (route-derived, mid-crumb collapse on mobile, `aria-current`), **search entry** + **command palette** (`⌘K`/`Ctrl-K`/`/`), **notifications** (disabled "No notifications yet"), **help** (shortcuts + disabled support), **user menu** (disabled profile, density toggle, disabled "Sign out — Phase 4"), **skip link** (`#main`), **project sub-nav** (sticky, scrollable, `sr-only` "preview for Phase N"), and **keyboard shortcuts** (`⌘K`, `/`, `[`, `g p`, `g d`, with typing guard). Global sidebar contains exactly **Dashboard · Projects · Companies · Reports (disabled) · Team · Settings** — no project modules leaked (confirmed in `navigation.ts`). ✅

Issues: the shell is one **400-line client component** (P3C-006); the command palette is **hand-rolled without focus trap/restore/scroll-lock/arrow-nav** (P3C-003); the **ThemeToggle floats `fixed` bottom-right at `z-toast`** rather than living in the user menu (P3C-004); expanded nav links carry a placeholder `Tooltip content="Navigation item"` (P3C-009).

---

## 7. Navigation and route census

| # | Route | Present | Type | Honest marker |
|---|-------|:------:|------|:-------------:|
| 1 | `/dashboard` | ✅ | mock | ✅ |
| 2 | `/projects` | ✅ | mock table | ✅ |
| 3 | `/projects/[projectId]` | ✅ | mock overview | ✅ |
| 4–15 | `/projects/[projectId]/{requirements,documents,reviews,equipment,warranties,inspections,training,lien-waivers,drawings,package,contacts,activity}` | ✅ | mock / disabled previews | ✅ |
| 16 | `/companies` | ✅ | mock table | ✅ |
| 17 | `/reports` | ✅ | disabled placeholder | ✅ |
| 18 | `/team` | ✅ | mock table | ✅ |
| 19 | `/settings` → `/settings/general` | ✅ | redirect + form | ✅ |
| 20–26 | `/settings/{members,templates,trades,billing,integrations,api-keys,security}` | ✅ | mock / disabled | ✅ |
| dev | `/design` | ✅ | gated gallery (404 in prod) | ✅ |
| legacy | `/playground` | ✅ | gated → redirects `/design` | ✅ |
| — | `/portal`, `/owner` | **absent** ✅ | not built | — |

**26 in-app routes + 1 dev gallery** — matches the approved map. No unauthorized product routes. External portals absent. Breadcrumbs, project-scoped nav, and settings nav are distinct. Long names truncate (`truncate` + mid-crumb hide). Route titles consistent (aside from the brand). Mobile drawer reaches all global destinations; project sub-nav scrolls.

---

## 8. Placeholder honesty review

Every page is honest. `mockNotice` + "Sample data"/"Sample queue" labels on metrics; disabled actions labeled "— Phase N"; the command palette footer states *"Sample navigation only — no live search or API"*; the sample form shows *"This confirmation is visual only. No data was persisted"*; the DataTable filter is a disabled "Mock" button and bulk actions are "Bulk actions — preview." Disabled nav items carry a "Later" badge + "Available in Phase N" tooltip; disabled project tabs and settings pages render honest empty states. **No page implies live data, saved actions, or real analytics.** ✅

---

## 9. Component-architecture review

- **Placement correct:** primitives + generic composites in `packages/ui` (Button, Input, Field, Select, Combobox, MultiSelect, Checkbox, Radio, Switch, Badge, Avatar, IconButton, Alert/Banner, Spinner, Progress, Separator, EmptyState, ErrorState, PermissionDenied, KeyValue, MetricCard, FileUploadPlaceholder, Toast; overlays: Tooltip, DropdownMenu, Dialog, AlertDialog, Popover, Sheet/Drawer, Tabs, Accordion, Collapsible, ScrollArea). Domain-presentational + shell in `apps/web/components` (StatusBadge, RiskIndicator, OverdueFlag, DataTable, cells, shell/*, theme/*, form/*). ✅
- **Boundaries enforced:** `packages/ui` imports no `@closeoutflow/db|authz|@supabase` (lint boundary rule + `check-boundaries.mjs` both pass). `DataTable` is the only importer of `@tanstack/react-table` (wrapper strategy honored). No circular imports; dependency direction apps→packages intact. ✅
- **Concerns:** two **overgrown client files** — `app-shell.tsx` (400 lines) and `pages/phase-3-pages.tsx` (561 lines) — concentrate the shell and all page bodies as single `"use client"` modules (P3C-006). No business logic in primitives; no premature domain abstraction. Component APIs are consistent (`className` passthrough, `cva` variants, `forwardRef` where needed).

---

## 10. Status-system review

`components/status/status-badge.tsx` is the single source of truth. `statusValues` enumerates **all 8 categories** with the **exact `statuses.md` labels** (project 8, requirement 12, document 11, review 8, package 8, invitation 5, notification 8, subscription 6) — cross-checked, **no invented states**, "Missing" correctly modeled as a flag (`OverdueFlag`), not a status. Every badge renders **icon + text** (`<Icon aria-hidden/> <span>{status}</span>`) → never color-alone. Closed/inactive states (Archived/Superseded/Waived/N/A/Cancelled) map to muted `neutral`. Tones are limited to the 6-tone system. `RiskIndicator` = Low/Medium/High/Insufficient data (icon+label). ✅

Gaps: the `StatusBadge` prop `status: string` is **loosely typed** (no per-category union) and **throws** on an unknown status (`throw new Error`), which would crash a render rather than degrade — fine for controlled mock data, risky for real data (P3C-007).

---

## 11. Tables and forms review

**DataTable** (`components/table/data-table.tsx`): wraps TanStack Table; provides search, sortable headers (`<button>` + `aria-sort` on `<th scope="col">`), column visibility, row selection (labeled checkboxes) + sticky bulk-action bar (`role="status"`), pagination (tabular page number), disabled "Mock" filter, empty (distinguishes no-data vs no-match with "Clear search"), loading (skeleton rows, `aria-busy`), and error (retry) states. Desktop renders an `overflow-x-auto role="region"` table (`min-w-[760px]`, sticky `thead`, `<caption class="sr-only">`); **`< md` transforms to `<article>` cards with `<dl>` label/value pairs** — a real transformation, not a shrunk table. Density responds to the token. Two documented ESLint disables (scroll-region tabindex, TanStack hook) are justified. ✅

**Forms** (`components/form/sample-form.tsx` + `ui` Field): RHF + Zod, `Field` composes label + help + error with `aria-describedby`/`aria-invalid`/`aria-required`, error summary with `role="alert"` + focus management, required indicator, disabled/read-only states, `FileUploadPlaceholder` (no real upload), disabled "Save — Phase 4", and an explicit "no data persisted" confirmation. **No form writes to any API/DB.** ✅

Gap: unsaved-changes guard uses only `beforeunload` (covers refresh/close, **not** client-side `<Link>` navigation) (P3C-010).

---

## 12. Responsive review

Verified via code + the shell/table transforms: sidebar → off-canvas drawer `< lg`; header condenses (search icon `< md`); breadcrumbs collapse middle crumbs; tables → card lists `< md`; forms single-column; dialogs use Radix (bottom-sheet styling via `Sheet`); touch targets `min-h-11` (44px) on nav items, checkboxes, switches; wide content scrolls inside its own region (page body never scrolls sideways); metric cards `sm:grid-cols-2 xl:grid-cols-4`. Playwright projects include **Pixel 7** and **iPhone 15**. Mobile is a genuine re-flow, not a shrunk desktop. ✅ (Long-name truncation + `title`/tooltip present.)

---

## 13. Accessibility review

- **Landmarks:** `<aside aria-label>`, `<nav aria-label="Primary navigation"|"Project navigation"|"Breadcrumbs">`, `<header>`, `<main id="main" tabIndex=-1>`, skip link first. ✅
- **Overlays:** Dialog/AlertDialog/Popover/DropdownMenu/Tooltip/Sheet are **Radix** → focus trap, `Esc`, scroll-lock, roles handled. ✅
- **Forms:** error association + `role="alert"` summary + focus move. ✅
- **Tables:** `scope`, `aria-sort`, labeled selection, focusable scroll region. ✅
- **Status:** icon + text (never color-alone). ✅
- **Reduced motion:** `motion-reduce:animate-none` on spinner/loading. ✅
- **axe:** reproduced **zero violations** on `/dashboard`, `/settings/general`, `/projects` in **light and dark** (chromium sample). ✅

Gaps (all fixable, none blocking): command palette is a **custom dialog without focus trap/restore/scroll-lock and without arrow-key option navigation** (P3C-003); RiskIndicator drivers are **tooltip-only** (P3C-011); placeholder `Tooltip content="Navigation item"` noise on every expanded nav link (P3C-009). WCAG 2.2 AA foundation is credible.

---

## 14. Theme and CSP review

- **Theme:** light/dark/**system**, persisted (`cof-theme`), applied **pre-paint** by a **nonce'd** inline `THEME_INIT_SCRIPT` in `<head>` with `suppressHydrationWarning` and `force-dynamic` — **no flash**, fail-safe `try/catch`. Density persists independently (`cof-density`). Dark theme uses token overrides (no unapproved hardcoded values). ✅ Minor: invalid stored theme value is stored in `dataset.theme` (renders light, safe-ish) (P3C-015); collapsed-sidebar width may briefly flash for collapsed users on first paint (P3C-014).
- **CSP (verified at runtime, production build):** `script-src 'self' 'nonce-…' 'strict-dynamic'` with a **per-request nonce and no `unsafe-inline`/`unsafe-eval`** (eval only in dev); plus `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri/form-action 'self'`, `upgrade-insecure-requests`. `style-src 'unsafe-inline'` retained (low-risk, Tailwind/Next). Delivered by `apps/web/proxy.ts` (Next 16 middleware, confirmed emitting the header). All Phase 2 headers preserved (HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy). ✅
- **Security preservation:** server-only boundary passes (`pnpm test:server-only` green), no `dangerouslySetInnerHTML`, no `NEXT_PUBLIC_` secret, service-role only in the health route (server), no public storage, no new migrations/RLS changes. ✅

---

## 15. Performance review

- Root is `force-dynamic` (required for nonce CSP) — acceptable; pages are cheap. Route files are thin server components exporting metadata; bodies are client. **Client overuse:** the shell and all page bodies are large `"use client"` modules (P3C-006) — more hydration than needed for mostly-static mock content; splitting into server shells + client islands is advised before feature phases.
- Icons imported individually from `lucide-react` (tree-shakeable) ✅. Fonts via `next/font` self-hosted with `display: swap` + fallback (no CDN, no layout-shift, nonce-safe) ✅. No unnecessary global state (theme via small provider; table/palette state local) ✅. Mock dataset is tiny ✅. Gallery excluded from production (404) ✅. Theme flash prevented ✅.

---

## 16. Testing review

Reproduced: `format:check` ✅, `lint` ✅ (+ boundaries), `typecheck` ✅ (14/14), **`pnpm test` → 26 files / 68 tests ✅** (matches claim), `build` ✅, `test:server-only` ✅, `db:validate` ✅. Playwright config has **5 projects** (Chromium, Firefox, WebKit, Pixel 7, iPhone 15); the **`@a11y` subset reproduced green on chromium** (foundation + dashboard/settings/projects light+dark, zero violations) — corroborating "20 a11y tests" (4 × 5). I did not re-run all 5 browser projects (time), but the config, the reproduced subset, and the exit-review numbers are consistent.

Test quality: assertions are meaningful (status mapping exhaustiveness, theme/density, keyboard nav, gallery gating, CSP function, form validation, table behavior). No `.skip`/`.only`, no broad snapshots, no over-mocking. Justified project-specific skips exist for keyboard/desktop-only cases.

**Gap:** there is **no regression test asserting the visible brand**, and existing e2e assertions **hardcode "CloseoutFlow"** (`phase-3.spec.ts:57,59,118`), which both lock in the stale brand and will silently pass the wrong value. A brand test (assert visible "Closeout"; assert no visible "CloseoutFlow") must be added with the rename (P3C-008).

---

## 17. Documentation and Git review

`phase-3-implementation-progress.md` and `phase-3-exit-review.md` match reality (checked claim-by-claim: token colors, fonts, no-flash theme, 6-item shell, contextual project nav, 26 routes, `/design` gating, DataTable card transform, forms non-persistence, deferrals). Commands in docs match `package.json` scripts. Deferred components (Stepper, Timeline, Activity List, context menu, real upload) are accurately documented as later-phase. Founder visual checkpoints recorded as "soft/available." No doc claims Phase 4 functionality exists. **Docs correctly still say "CloseoutFlow" internally** — acceptable, but there is **no doc stating the public brand is now "Closeout"**; add brand guidance in 3D (P3C-002 companion). Git: logical commits, messages match, no artifacts/secrets, Phase 2 history intact, worktree clean.

---

## 18. Findings summary

| ID | Sev | Area | Title | P4 blocker | Owner |
|----|-----|------|-------|:----------:|-------|
| P3C-001 | HIGH | Branding | Visible brand is "CloseoutFlow" across titles, PWA, shell, ARIA, gallery, icon `<title>`s | **Yes** | Codex |
| P3C-002 | HIGH | Metadata/SEO | No `metadataBase`/`title.template`/`applicationName`/OG/canonical; descriptor missing; `/`→`/dashboard` redirect | **Yes** | Codex + founder (domain) |
| P3C-003 | MEDIUM | Accessibility | Command palette lacks focus trap/restore/scroll-lock + arrow-key option nav | No | Codex |
| P3C-004 | MEDIUM | UX/Shell | ThemeToggle is a floating `fixed` widget at `z-toast` (overlaps toasts); spec places theme in user menu | No | Codex |
| P3C-005 | MEDIUM | UX/Branding | No custom `not-found`/`error` pages → unbranded Next defaults on 404/500 | No | Codex |
| P3C-006 | MEDIUM | Architecture/Perf | Overgrown client modules: `app-shell.tsx` (400 lines), `phase-3-pages.tsx` (561 lines) | No | Codex |
| P3C-007 | MEDIUM | Correctness | `StatusBadge` `status: string` (no union) + `throw` on unknown (render crash vs. safe fallback) | No | Codex |
| P3C-008 | HIGH→test | Testing/Branding | No brand regression test; e2e assertions hardcode "CloseoutFlow" | **Yes** (with rename) | Codex |
| P3C-009 | LOW | UX/A11y | Placeholder `Tooltip content="Navigation item"` on every expanded nav link | No | Codex |
| P3C-010 | LOW | UX | Unsaved-changes guard only covers `beforeunload`, not SPA navigation | No | Codex |
| P3C-011 | LOW | A11y | RiskIndicator drivers are tooltip-only | No | Codex |
| P3C-012 | LOW | Visual | Reports and Dashboard share the same icon | No | Codex |
| P3C-013 | LOW | Cleanup | Two dev routes (`/design` + legacy `/playground` redirect) | No | Codex |
| P3C-014 | LOW | UX | Collapsed-sidebar width may flash on first paint | No | Codex |
| P3C-015 | LOW | Robustness | Invalid stored theme value retained in `dataset.theme` | No | Codex |
| P3C-016 | LOW | Deps | New Radix/table deps use caret ranges vs. repo's exact-pin convention | No | Codex |
| P3C-017 | OBSERVATION | Security | `style-src 'unsafe-inline'` retained (low-risk; tighten later) | No | — |

---

## 19. Detailed findings

### P3C-001 — HIGH — Visible brand is "CloseoutFlow" (must be "Closeout")
- **Evidence:** runtime `<title>Dashboard · CloseoutFlow</title>`; manifest `name`/`short_name` = `CloseoutFlow`; `app-shell.tsx:29,31,34,313`; `design-gallery.tsx:72`; `public/icons/*.svg:2`; 14 page-title literals; ~23 visible occurrences (§4.1).
- **Rule violated:** permanent branding decision (public brand = Closeout).
- **Why it matters:** the product presents the wrong brand everywhere a user or search engine looks; fixing it after Phase 4 means auth screens and more snapshots/tests calcify the stale name.
- **Remediation:** replace every visible occurrence with `Closeout`; change the monogram `CF`→`C`/`CO`; set root `title: { default: "Closeout", template: "%s · Closeout" }` and reduce per-page titles to the page name only; update `manifest.name/short_name`; update SVG `<title>`s and the ARIA/drawer labels; keep `@closeoutflow/*`, `closeoutflow` identifiers, `cof-*` keys, and `docs/**` unchanged.
- **Tests required:** brand regression test (§P3C-008).
- **Blocks Phase 4:** **Yes.**

### P3C-002 — HIGH — Metadata/SEO foundation incomplete for the brand
- **Evidence:** `layout.tsx` has only `title` + `description`; no `metadataBase`, `applicationName`, `openGraph.siteName`, Twitter, or `alternates.canonical`; `app/(marketing)/page.tsx` redirects `/`→`/dashboard`; description is the internal metaphor.
- **Rule violated:** SEO-readiness direction (Site/Org name "Closeout", canonical `https://closeoutflow.com`, homepage title direction).
- **Why it matters:** the brand/domain cannot be represented to crawlers/social; per-page hardcoding will repeat any future brand mistake.
- **Remediation (do with the rename):** add `metadataBase: new URL("https://closeoutflow.com")`, `applicationName: "Closeout"`, `title.template`, `openGraph: { siteName: "Closeout", title: "Closeout | Construction Closeout Software" }`, and a canonical strategy; add a customer descriptor ("construction closeout software") to the root description. (A real marketing homepage is later-phase; do **not** build SEO features now — just the metadata scaffold.)
- **Tests required:** metadata test asserting `Closeout` site name + no `CloseoutFlow`.
- **Blocks Phase 4:** **Yes** (do alongside P3C-001).

### P3C-003 — MEDIUM — Command palette missing focus management
- **Evidence:** `app-shell.tsx:84–170` — custom `<div role="dialog">`; focuses input on open but no focus trap, no focus restore to trigger on close, no scroll-lock; options are static `aria-selected="false"` with only Enter→first result (no arrow navigation).
- **Rule violated:** `accessibility-and-responsive.md §10` / `patterns.md §17` (dialog focus trap + restore + scroll lock; palette arrow-nav).
- **Why it matters:** keyboard/SR users can tab out of the "modal," lose their place on close, and can't navigate results.
- **Remediation:** build the palette on the `ui` Radix `Dialog` (trap/restore/scroll-lock free) and implement listbox `aria-activedescendant` arrow navigation, or add focus-trap + restore + arrow handling to the custom implementation.
- **Tests:** Playwright — focus trapped, returns to trigger on `Esc`, arrow keys move active option.
- **Blocks Phase 4:** No.

### P3C-004 — MEDIUM — Floating ThemeToggle overlaps the toast layer
- **Evidence:** `app-shell.tsx:~388` — `<div className="fixed bottom-3 right-3 z-toast …"><ThemeToggle/></div>`.
- **Rule violated:** `application-shell.md §5` (theme lives in the user menu); z-index token intent (`--z-toast` is for toasts).
- **Why it matters:** a permanent floating control obscures bottom-right content, will overlap toasts and any future mobile sticky action bar, and duplicates the theme control (also in settings + user menu density).
- **Remediation:** move the theme control into the user menu (beside density) and/or the settings form; remove the fixed floating widget (or lower its z-index and reposition) so it never competes with `--z-toast`.
- **Tests:** component/e2e — theme toggle reachable from user menu; no fixed overlay at toast z-index.
- **Blocks Phase 4:** No.

### P3C-005 — MEDIUM — No custom not-found / error pages
- **Evidence:** no `apps/web/app/not-found.tsx`, `error.tsx`, or `global-error.tsx`; `/portal`, `/owner`, and typos return the default unbranded Next 404.
- **Rule violated:** `patterns.md §14` (page-level error/not-found states); branding (these are brand surfaces).
- **Why it matters:** 404/500 are real user-facing surfaces that currently show framework defaults with no brand, navigation back, or honest messaging.
- **Remediation:** add branded `not-found.tsx` and `error.tsx` using `EmptyState`/`ErrorState` with a link home; use "Closeout" copy.
- **Tests:** e2e — unknown route returns branded 404 with a home link.
- **Blocks Phase 4:** No.

### P3C-006 — MEDIUM — Overgrown client modules
- **Evidence:** `app-shell.tsx` 400 lines (sidebar+header+drawer+breadcrumbs+palette in one `"use client"` file); `pages/phase-3-pages.tsx` 561 lines (all page bodies, `"use client"`).
- **Rule violated:** `components.md §1` (server-first; discrete Sidebar/Header/CommandPalette/Breadcrumbs) / performance guidance.
- **Why it matters:** more client JS/hydration than needed for mostly-static content, and harder maintenance as real features land.
- **Remediation:** split the shell into discrete components (Sidebar, Header, MobileNav, CommandPalette, Breadcrumbs) and one file per page/feature; keep static parts as server components with client islands for interactivity.
- **Tests:** existing shell/page tests remain green after the split.
- **Blocks Phase 4:** No (recommended before feature phases).

### P3C-007 — MEDIUM — StatusBadge loose typing + throw on unknown
- **Evidence:** `status-badge.tsx` — `StatusBadge({ category, status }: { category; status: string })`; `if (!presentation) throw new Error(...)`.
- **Rule violated:** `patterns.md §status` / `components.md` (type safety; unknown states fail safely).
- **Why it matters:** `statusValues` is `as const` (a typed union is available) but unused, so arbitrary strings compile; a real/stray status would **crash the render** instead of degrading.
- **Remediation:** type `status` as `(typeof statusValues)[Category][number]` via a discriminated union, and render a neutral "Unknown" fallback badge (dev-warn) instead of throwing.
- **Tests:** unit — invalid status renders a fallback, valid unions type-check.
- **Blocks Phase 4:** No.

### P3C-008 — HIGH (test) — Missing brand regression test; e2e hardcodes stale brand
- **Evidence:** `e2e/phase-3.spec.ts:57,59` assert `"CloseoutFlow navigation"`, `:118` asserts `"CloseoutFlow component gallery"`; no test asserts the public brand.
- **Rule violated:** testing rigor + branding.
- **Why it matters:** the suite currently *enforces the wrong brand*; without a positive brand test, future regressions to "CloseoutFlow" pass silently.
- **Remediation:** with the rename, update these assertions to "Closeout" and add a test asserting visible/title/manifest brand is "Closeout" and that no visible "CloseoutFlow" string appears (domain excepted).
- **Tests:** the new brand regression test itself.
- **Blocks Phase 4:** **Yes** (with P3C-001).

### P3C-009…P3C-016 — LOW (concise)
- **009:** Remove/replace the `Tooltip content="Navigation item"` on expanded nav links (only keep the collapsed-rail label tooltip). *Test:* no tooltip text "Navigation item" in expanded state.
- **010:** Add an in-app route-change guard (confirm dialog) for dirty forms, not just `beforeunload`. *Test:* navigating away from a dirty form prompts.
- **011:** Surface RiskIndicator drivers as visible/`aria`-exposed text, not tooltip-only. *Test:* drivers present in the accessibility tree.
- **012:** Give Reports a distinct icon (e.g., `BarChart3`). *Test:* n/a (visual).
- **013:** Consolidate to a single dev gallery route (keep `/design`; drop or clearly document the `/playground` redirect). *Test:* both remain 404 in prod (already true).
- **014:** Drive collapsed-sidebar width from the pre-paint `dataset.sidebar` (CSS) to avoid first-paint flash. *Test:* no width shift for collapsed users.
- **015:** Validate stored theme against the union in `ThemeProvider`; normalize invalid values to `system`. *Test:* invalid `cof-theme` → system.
- **016:** Pin the new Radix/table/hookform deps to exact versions to match repo convention. *Test:* n/a (lockfile).

---

## 20. Deferred items confirmed (correctly not built)

Stepper, Timeline, Activity List, context menu, **real file-upload behavior** (only `FileUploadPlaceholder`), authentication/registration/sessions, organization creation/real switching, business tables/migrations, real APIs/data-fetching, notifications delivery, billing, integrations, AI processing, owner portal, subcontractor portal. All verified absent and documented as later-phase.

---

## 21. Validation commands and actual results

| Command | Reproduced | Result |
|---------|:----------:|--------|
| `pnpm format:check` | ✅ | PASS |
| `pnpm lint` | ✅ | PASS (+ "Workspace import boundaries passed") |
| `pnpm typecheck` | ✅ | PASS (14/14) |
| `pnpm test` | ✅ | **26 files / 68 tests PASS** (matches) |
| `pnpm build` | ✅ | PASS (compiled; static pages generated) |
| `pnpm test:server-only` | ✅ | PASS (client import of service entry fails build) |
| `pnpm db:validate` | ✅ | PASS (infrastructure-only) |
| Playwright `@a11y` (chromium) | ✅ (sample) | 4 PASS, **0 axe violations** (light+dark) |
| Full Playwright 5-project suite | ⚠️ not fully re-run | config verified (Chromium/Firefox/WebKit/Pixel 7/iPhone 15); a11y subset + prod probes reproduced; 61/9-skip corroborated via exit review |
| **Prod probe `/dashboard`** | ✅ | **HTTP 200** |
| **Prod probe `/design`** | ✅ | **HTTP 404** |
| **Prod probe `/playground`** | ✅ | **HTTP 404** |
| **Prod CSP header** | ✅ | nonce-based, **no `unsafe-inline`/`unsafe-eval` in `script-src`**; all Phase 2 headers present |
| **Prod `<title>` / manifest** | ✅ | `Dashboard · CloseoutFlow` / `name`,`short_name` = `CloseoutFlow` (confirms P3C-001) |

**Environment:** Node v24, pnpm 10.33, Windows host; production build served via `next start` with `APP_ENV=production`. All reproduced commands passed; nothing was repaired.

---

## 22. Phase 3D remediation order

**Do branding first** so stale strings never enter new snapshots/tests, then the rest:

1. **P3C-001 + P3C-002 (branding + metadata) — together, first.** Introduce root `title.template`/`metadataBase`/`applicationName`/OG with **"Closeout"**; reduce per-page titles to page names; update manifest, sidebar brand + monogram, ARIA/drawer labels, gallery H1, and SVG icon `<title>`s. Add the customer descriptor. Leave `@closeoutflow/*`/`closeoutflow`/`cof-*`/`docs/**` untouched.
2. **P3C-008 — brand regression test.** Update the stale e2e assertions to "Closeout" and add a positive brand/metadata/manifest test (and a "no visible CloseoutFlow" guard).
3. **P3C-005 — branded `not-found`/`error` pages** (uses the new brand).
4. **P3C-003 — command-palette focus trap/restore/scroll-lock + arrow-nav** (rebuild on Radix `Dialog`).
5. **P3C-004 — move ThemeToggle into the user menu; drop the floating widget.**
6. **P3C-007 — StatusBadge union typing + safe fallback.**
7. **P3C-006 — split `app-shell.tsx` and `phase-3-pages.tsx`** into discrete components/pages.
8. **P3C-009…016 — LOW polish** (nav tooltip, SPA unsaved-changes guard, risk drivers, Reports icon, single dev route, sidebar-flash, theme-value validation, exact dep pins).

Each remediation must keep all reproduced checks green and add the named test. No migrations, no business features.

---

## 23. Final checklist

| Item | Verdict | Basis |
|------|---------|-------|
| Phase 3 Tasks 0–15 implemented | ✅ | routes/components/tests present + reproduced |
| No Phase 4 implementation | ✅ | no auth/business; only disabled placeholders |
| No business schema or migrations | ✅ | `db:validate` infrastructure-only; no db changes |
| All approved routes exist | ✅ | 26 in-app + `/design`; no extras |
| External portals absent | ✅ | `/portal`,`/owner` not built |
| Placeholder pages honest | ✅ | markers, disabled actions, "no data persisted" |
| Sidebar remains lean | ✅ | exactly Dashboard/Projects/Companies/Reports/Team/Settings |
| Project navigation contextual | ✅ | project sub-nav, not global |
| Public brand is Closeout | ❌ | currently "CloseoutFlow" everywhere (P3C-001) |
| Visible CloseoutFlow refs identified | ✅ | ~23 visible + 3 test assertions (census §4.1) |
| Domain remains closeoutflow.com | ✅ | unchanged; allowed |
| Metadata ready to identify product as Closeout | ❌/partial | scaffold missing (P3C-002) |
| Design gallery production-inaccessible | ✅ | `/design` + `/playground` → **404** in prod (verified) |
| Theme works without flash | ✅ | nonce'd pre-paint init, fail-safe |
| CSP remains nonce-based | ✅ | verified at runtime |
| No `unsafe-inline` in production script-src | ✅ | verified (`script-src` nonce+strict-dynamic only) |
| Status labels match approved lifecycles | ✅ | all 8 categories exact, no invented states |
| Responsive behavior implemented | ✅ | drawer/table-card/sheets/touch targets |
| WCAG 2.2 AA foundation credible | ✅ | Radix overlays, form a11y, axe clean (sample) |
| Cross-browser tests exist | ✅ | 5 Playwright projects |
| No secrets committed | ✅ | scan clean |
| Git history clean | ✅ | logical commits, no artifacts, Phase 2 intact |

---

*Audit complete. No repository files were modified except the creation of this document. No commits were made.*

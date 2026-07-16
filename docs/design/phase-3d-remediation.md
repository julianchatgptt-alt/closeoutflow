# Phase 3D frontend audit remediation

## Scope and result

Phase 3D resolves every actionable HIGH, MEDIUM, and LOW finding from the preserved [Phase 3C audit](./phase-3c-audit.md). It changes only the Phase 3 frontend foundation, its tests, dependency pins, and documentation. It adds no authentication, business persistence, APIs, database tables, migrations, external integrations, or Phase 4 behavior.

The permanent public identity is **Closeout** at **closeoutflow.com**. Internal technical identifiers such as `@closeoutflow/*` remain stable.

## Finding resolutions

### P3C-001 — HIGH — Public branding

- **Root cause:** The Phase 3 scaffold inherited the internal CloseoutFlow repository name in visible shell, gallery, manifest, icon, title, and accessible-name surfaces.
- **Files changed:** shell brand/header/navigation components; route metadata; `design-gallery.tsx`; `manifest.ts`; `public/icons/*.svg`; `not-found.tsx`; `error.tsx`.
- **Exact fix:** Replaced visible product naming with Closeout, changed the `CF` monogram to `C`, and aligned desktop/mobile/accessibility labels and SVG titles. Internal package scopes and storage keys remain unchanged.
- **Tests:** Metadata, manifest, error-surface, and Playwright brand-census assertions cover titles, visible copy, accessible names, manifest data, and absence of visible `CloseoutFlow`.
- **Validation result:** Targeted unit and Chromium tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-002 — HIGH — Metadata and SEO foundation

- **Root cause:** Root metadata had no centralized base URL, title template, canonical, application name, Open Graph identity, or Twitter identity.
- **Files changed:** `apps/web/app/metadata.ts`, `metadata.test.ts`, `layout.tsx`, all application page metadata exports, and `manifest.ts`.
- **Exact fix:** Centralized `metadataBase` at `https://closeoutflow.com`; default title `Closeout | Construction Closeout Software`; template `%s | Closeout`; application name, canonical, descriptor, Open Graph, and Twitter fields. Routes now provide page-only titles.
- **Tests:** Unit metadata contract and Playwright rendered-title/canonical/Open Graph checks.
- **Validation result:** Targeted unit and Chromium tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-003 — MEDIUM — Command-palette accessibility

- **Root cause:** The hand-built dialog only focused its input and lacked a focus trap, focus restoration, scroll lock, and navigable option state.
- **Files changed:** `packages/ui/src/overlays.tsx`, `components/shell/command-palette.tsx`, `app-shell.tsx`, and `e2e/phase-3.spec.ts`.
- **Exact fix:** Rebuilt the palette on the shared Radix dialog; added controlled open state, close-focus restoration, full-mobile layout, labeled combobox/listbox semantics, `aria-activedescendant`, wrapping Arrow navigation, Home/End, Enter activation, and Escape close. Radix supplies focus trapping and scroll locking.
- **Tests:** Playwright verifies focus containment, focus restoration, Arrow/Home/End/Enter/Escape behavior, mobile behavior, and an axe scan while open.
- **Validation result:** Targeted Chromium keyboard and axe tests pass; final matrix recorded below.
- **Status:** Resolved.

### P3C-004 — MEDIUM — Floating theme control

- **Root cause:** A fixed bottom-right theme widget used the toast z-index and could overlap feedback or future sticky actions.
- **Files changed:** `components/shell/app-header.tsx` and `app-shell.tsx`.
- **Exact fix:** Removed the floating widget and placed system/light/dark choices in the user menu beside density preferences.
- **Tests:** Playwright changes theme through the user menu and verifies persistence after reload.
- **Validation result:** Targeted Chromium test passes; final matrix recorded below.
- **Status:** Resolved.

### P3C-005 — MEDIUM — Branded error surfaces

- **Root cause:** Framework-default 404 and error UI had no product identity, recovery route, or safe failure copy.
- **Files changed:** `apps/web/app/not-found.tsx`, `error.tsx`, `error.test.tsx`, and `e2e/phase-3.spec.ts`.
- **Exact fix:** Added Closeout-branded `EmptyState`/`ErrorState` pages with dashboard recovery and no raw exception rendering.
- **Tests:** Unit test verifies reset behavior and error-detail suppression; Playwright verifies the branded 404 and HTTP 404 response.
- **Validation result:** Targeted Chromium 404 test passes; final suite recorded below.
- **Status:** Resolved.

### P3C-006 — MEDIUM — Overgrown client modules

- **Root cause:** A 400-line client shell and 561-line all-pages client module hydrated mostly static UI and mixed unrelated responsibilities.
- **Files changed:** split shell modules under `components/shell/`; split page modules under `components/pages/`; replaced `phase-3-pages.tsx` with a small barrel.
- **Exact fix:** Extracted brand, header, sidebar, primary navigation, breadcrumbs, project subnavigation, and command palette. Static dashboard/project/settings page compositions are server components; only interactive table configuration remains a client island.
- **Tests:** Existing route, shell, table, theme, and accessibility tests exercise the split architecture.
- **Validation result:** TypeScript, unit tests, build, and targeted Chromium suite pass; final suite recorded below.
- **Status:** Resolved.

### P3C-007 — MEDIUM — StatusBadge correctness

- **Root cause:** `status` accepted arbitrary strings and an unknown value threw during rendering.
- **Files changed:** `components/status/status-badge.tsx`, its tests, and gallery typing.
- **Exact fix:** Added a category-discriminated status union and a neutral, non-throwing Unknown fallback with a development warning.
- **Tests:** Unit coverage checks every valid lifecycle presentation and a forced invalid runtime value.
- **Validation result:** Unit tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-008 — HIGH (test) — Brand regressions

- **Root cause:** Browser assertions encoded the former public name and no positive brand contract guarded rendered or PWA output.
- **Files changed:** `metadata.test.ts`, `manifest.test.ts`, `error.test.tsx`, and `e2e/phase-3.spec.ts`.
- **Exact fix:** Added positive Closeout contracts and negative visible-`CloseoutFlow` checks for metadata, manifest, shell, gallery, error states, accessible labels, and rendered page body.
- **Tests:** New unit/component and Chromium brand census.
- **Validation result:** Targeted tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-009 — LOW — Navigation tooltip placeholder

- **Root cause:** Expanded navigation wrapped every item in a generic `Navigation item` tooltip.
- **Files changed:** `components/shell/primary-navigation.tsx` and `e2e/phase-3.spec.ts`.
- **Exact fix:** Tooltips now label meaningful destinations only in the collapsed icon rail; expanded labels stand on their own.
- **Tests:** Playwright asserts the placeholder tooltip text is absent in expanded navigation.
- **Validation result:** Targeted Chromium test passes; final matrix recorded below.
- **Status:** Resolved.

### P3C-010 — LOW — SPA unsaved-change guard

- **Root cause:** The sample form protected only full-page `beforeunload` navigation.
- **Files changed:** `components/form/sample-form.tsx`, `sample-form.test.tsx`, and shared controlled `AlertDialog` support in `packages/ui/src/overlays.tsx`.
- **Exact fix:** Dirty same-origin link navigation opens a confirmation dialog. Cancel stays on the form; discard resets dirty state and resumes the original client-side link without affecting external, modified, download, or current-page clicks.
- **Tests:** Component test verifies prompt, cancellation boundary, and discard navigation seam.
- **Validation result:** Unit test passes; final suite recorded below.
- **Status:** Resolved.

### P3C-011 — LOW — Risk drivers hidden in tooltips

- **Root cause:** Risk explanations were discoverable only by pointer/focus tooltip interaction.
- **Files changed:** `components/status/risk-indicator.tsx`, dashboard sample composition, gallery usage, and status tests.
- **Exact fix:** Drivers render as visible secondary text and are associated with the risk label through `aria-describedby`.
- **Tests:** Component assertions verify visible drivers and the accessibility association.
- **Validation result:** Unit tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-012 — LOW — Duplicate report icon

- **Root cause:** Dashboard and Reports used the same icon, reducing scan distinction.
- **Files changed:** `components/shell/navigation.ts`.
- **Exact fix:** Reports now uses `BarChart3`; Dashboard retains its own icon.
- **Tests:** Covered by typed navigation construction and browser shell rendering.
- **Validation result:** Build and targeted shell tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-013 — LOW — Duplicate development galleries

- **Root cause:** `/design` coexisted with a legacy `/playground` redirect and duplicate gate code.
- **Files changed:** `app/(dev)/design/access.ts`, its test/page; removed `app/(marketing)/playground/*`.
- **Exact fix:** `/design` is the single local/test gallery; `/playground` no longer exists. The runtime production 404 gate remains.
- **Tests:** Gallery gate unit tests, local `/design` E2E, and live production 404 probes for both paths.
- **Validation result:** Local gallery test passes; final production probes recorded below.
- **Status:** Resolved.

### P3C-014 — LOW — Collapsed-sidebar first paint

- **Root cause:** React state initially rendered expanded widths even though the pre-paint script had already restored collapsed preference.
- **Files changed:** `app/globals.css`, `components/shell/app-shell.tsx`, and `e2e/phase-3.spec.ts`.
- **Exact fix:** Sidebar and shell widths derive directly from pre-paint `html[data-sidebar]`; React synchronizes after hydration.
- **Tests:** Playwright seeds collapsed storage before navigation and asserts the first stable computed widths are both 64px.
- **Validation result:** Targeted Chromium test passes; final matrix recorded below.
- **Status:** Resolved.

### P3C-015 — LOW — Invalid stored appearance values

- **Root cause:** Arbitrary storage strings were copied into theme/density datasets.
- **Files changed:** `components/theme/theme-script.ts`, `theme-provider.tsx`, `theme-script.test.ts`, and `e2e/phase-3.spec.ts`.
- **Exact fix:** Theme normalizes to light/dark/system, density to compact/comfortable, and sidebar to collapsed/expanded before paint and in the provider.
- **Tests:** Unit initializer tests and a browser test seed invalid theme plus collapsed sidebar values.
- **Validation result:** Unit and targeted Chromium tests pass; final suite recorded below.
- **Status:** Resolved.

### P3C-016 — LOW — Dependency pin convention

- **Root cause:** Phase 3 additions used caret ranges while the workspace uses exact dependency versions.
- **Files changed:** `apps/web/package.json`, `packages/ui/package.json`, and `pnpm-lock.yaml`.
- **Exact fix:** Exact-pinned Radix, TanStack Table, React Hook Form, resolver, and Lucide versions without upgrading resolved packages.
- **Tests:** Frozen-lockfile install verifies manifest/lock consistency.
- **Validation result:** `pnpm install --frozen-lockfile` passes; final suite recorded below.
- **Status:** Resolved.

### P3C-017 — OBSERVATION — CSP style policy

- **Root cause:** The audit noted the existing `style-src 'unsafe-inline'` allowance; the actionable security requirement is that `script-src` remains nonce-based without unsafe execution allowances.
- **Files changed:** None.
- **Exact fix:** No Phase 3 change was recommended. Tightening style handling is deferred because Next.js and the approved styling stack currently require inline style support; script policy remains strict.
- **Tests:** Production CSP live probe checks per-response script nonces and absence of `unsafe-inline`/`unsafe-eval` in `script-src`.
- **Validation result:** Final production probe recorded below.
- **Status:** Reviewed; justified observation, not an actionable finding.

## Validation evidence

| Check | Result |
| --- | --- |
| Frozen install | Passed; all 15 workspace projects, lockfile current |
| Formatting | Passed |
| ESLint and package boundaries | Passed with zero warnings; workspace boundaries passed |
| TypeScript | 14/14 workspace packages passed |
| Unit/component tests | 27 files, 71 tests passed |
| Production build | 14/14 workspace packages passed; production-environment web rebuild also passed |
| Server-only boundary | Deliberate client import of `@closeoutflow/db/server` failed the Next.js build as required |
| Migration validation | Passed; no Phase 3 migration exists |
| E2E/cross-browser | 78 passed, 17 intentional project-specific skips across Chromium, Firefox, WebKit, Pixel 7, and iPhone 15 |
| Dedicated accessibility run | 25 passed; no axe violations detected on the tested light/dark pages or command palette |
| Brand and metadata | Rendered title `Dashboard | Closeout`; canonical, Open Graph, manifest, shell, gallery, error, and accessible-name checks passed; zero visible old-brand occurrences in application source |
| Route census | All 26 approved placeholders passed in Chromium; representative route smoke passed in every browser project |
| Live production routes | `/dashboard` 200, `/design` 404, `/playground` 404 |
| Live production CSP | Per-request nonces differed; every script carried a nonce; `script-src` contained neither `unsafe-inline` nor `unsafe-eval` |
| Secret scan | `gitleaks` was not installed; local fallback signature scan covered the repository excluding generated/vendor directories and found no credential pattern |
| Git checks | `git diff --check` passed; staged-file hook probe and final clean status are recorded with the Phase 3D commits |

## Boundaries preserved

- Exactly 26 approved application placeholder routes remain, plus development-only `/design`.
- `/portal` and `/owner` remain unimplemented.
- All mock content remains static, labeled as preview data, and non-persistent.
- Nonce CSP, server-only service-role protection, RLS, audit immutability, private storage policy, and environment validation are unchanged.
- No migration, business-domain table, real provider integration, authentication flow, or Phase 4 feature was added.

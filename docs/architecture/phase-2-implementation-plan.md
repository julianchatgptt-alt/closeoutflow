# FILE: /docs/architecture/phase-2-implementation-plan.md

> **Document status:** Phase 2 architecture — the exact ordered plan Codex follows to build the **foundation only**.
> **Hard boundary:** This plan **stops before Phase 3 feature development**. It creates **no** authentication features, project/requirement/document features, uploads, or business tables. It establishes the repository, tooling, shells, seams, CI, and skeletons described in the architecture docs.
> **Depends on:** all sibling architecture docs, especially [repository-structure.md](./repository-structure.md), [technology-stack.md](./technology-stack.md), [environments-and-delivery.md](./environments-and-delivery.md), [testing-and-quality.md](./testing-and-quality.md).

**Legend:** *Infra?* = changes external infrastructure/accounts. *Founder?* = requires a founder action (account, secret, approval).

---

## Task 0 — Read & confirm (gate)
- **Objective:** Codex reads all six Phase 1 docs + all Phase 2 architecture docs and confirms understanding; resolves nothing silently.
- **Files/dirs:** none (read-only).
- **Dependencies:** none.
- **Required checks:** none.
- **Tests:** none.
- **Completion criteria:** Codex posts a short confirmation listing the key constraints it will enforce (tenant isolation, RLS, no public buckets, service-role server-only, AI-not-approver, version integrity, append-only migrations/audit). Any contradiction found is reported, not edited.
- **Infra?** No. **Founder?** No.

## Task 1 — Repository initialization
- **Objective:** Initialize git repo, root files, license, README, `.gitignore`, `.nvmrc`, editorconfig.
- **Files/dirs:** `/README.md`, `/.gitignore`, `/.nvmrc`, `/.editorconfig`, `/LICENSE` (founder choice), root `package.json` (name, private, `packageManager`, `engines`).
- **Dependencies:** Task 0.
- **Required checks:** repo builds an empty install.
- **Tests:** none.
- **Completion criteria:** `git` initialized on `main`; root files present; Node/pnpm versions pinned.
- **Infra?** No. **Founder?** Choose license.

## Task 2 — Package manager & workspace (pnpm + Turborepo)
- **Objective:** Establish pnpm workspaces + Turborepo pipeline.
- **Files/dirs:** `/pnpm-workspace.yaml`, `/turbo.json`, root `package.json` scripts, `packages/config/` (base tsconfig, eslint, prettier, tailwind preset).
- **Dependencies:** Task 1.
- **Required checks:** `pnpm install` succeeds; `pnpm turbo run build --dry` resolves graph.
- **Tests:** none.
- **Completion criteria:** empty workspace with `apps/` and `packages/` recognized; shared config package present.
- **Infra?** No. **Founder?** No.

## Task 3 — TypeScript strictness & shared config
- **Objective:** Strict TS base, ESLint (with **import-boundary** rules), Prettier, shared across workspace.
- **Files/dirs:** `packages/config/tsconfig.base.json`, `eslint.config.*`, `prettier` config; root `tsconfig.json` with project references.
- **Dependencies:** Task 2.
- **Required checks:** `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass on the empty tree.
- **Tests:** a trivial lint rule test proving import-boundary config loads.
- **Completion criteria:** strict mode on; boundary rules configured (apps→packages only; ui has no db/authz; features can't cross-import).
- **Infra?** No. **Founder?** No.

## Task 4 — Web application shell only
- **Objective:** Create `apps/web` Next.js App Router shell: root layout, a placeholder landing page, PWA `manifest.ts`, Tailwind wired to the design-token preset. **No auth, no business UI.**
- **Files/dirs:** `apps/web/app/layout.tsx`, `apps/web/app/(marketing)/page.tsx` (placeholder), `apps/web/app/manifest.ts`, `apps/web/app/globals.css`, `apps/web/next.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/package.json`, route-group folders as empty placeholders.
- **Dependencies:** Task 3.
- **Required checks:** `pnpm --filter web build` succeeds; typecheck/lint pass.
- **Tests:** one component test (Vitest) rendering the landing placeholder.
- **Completion criteria:** app runs via `pnpm dev`, renders a neutral placeholder, installable PWA manifest present.
- **Infra?** No. **Founder?** No.

## Task 5 — Environment validation (`packages/env`)
- **Objective:** Zod-validated env schema (server/client split); `.env.example` documenting every var (non-secret placeholders).
- **Files/dirs:** `packages/env/src/index.ts`, `/.env.example`.
- **Dependencies:** Task 3.
- **Required checks:** app fails fast with a clear error when a required var is missing; passes when `.env` present.
- **Tests:** Vitest: missing var → throws; valid env → parses; **no `NEXT_PUBLIC_` var may be a secret** (assert service-role is server-only).
- **Completion criteria:** single source for env; documented example.
- **Infra?** No. **Founder?** Later provides real values (not now).

## Task 6 — Formatting, linting, pre-commit hooks
- **Objective:** Husky + lint-staged pre-commit (Prettier + ESLint on staged, quick typecheck); Gitleaks pre-commit optional.
- **Files/dirs:** `.husky/`, `lint-staged` config, `scripts/*.mjs` as needed (cross-platform).
- **Dependencies:** Task 3.
- **Required checks:** committing a badly-formatted file is auto-fixed/blocked.
- **Tests:** none (verified by hook behavior).
- **Completion criteria:** fast, cross-platform pre-commit works on Windows + Linux.
- **Infra?** No. **Founder?** No.

## Task 7 — Testing frameworks skeleton
- **Objective:** Vitest (unit/component), Playwright (e2e) config, axe integration, pgTAP test folder — all runnable with placeholder tests.
- **Files/dirs:** `vitest.config.*`, `apps/web/e2e/` with a smoke spec (loads landing page), `supabase/tests/` with a placeholder pgTAP test, `packages/*/src/__tests__` seed.
- **Dependencies:** Tasks 4, 8 (pgTAP needs local DB).
- **Required checks:** `pnpm test`, `pnpm test:e2e` (headless), placeholder `pnpm test:db` run.
- **Tests:** landing-page smoke (Playwright), a trivial unit test, a trivial pgTAP test.
- **Completion criteria:** all test commands execute green locally + CI.
- **Infra?** No. **Founder?** No.

## Task 8 — Supabase local configuration & empty migration baseline
- **Objective:** Supabase CLI local stack; **empty baseline migration**; generated-types workflow; cross-platform `db:*` scripts. **No business tables** — only the baseline (extensions, `audit` schema stub, `set_updated_at()` function, RLS-enabled convention placeholders are allowed as infrastructure, but NO domain tables).
- **Files/dirs:** `supabase/config.toml`, `supabase/migrations/0000_baseline.sql` (extensions like `pgcrypto`; `audit` schema created; utility functions; **no tenant/business tables**), `supabase/seed/` (empty/minimal), `packages/db/src/types.generated.ts` (generated), `packages/db/src/client.ts` (server client factories: anon + service-role, **service-role server-only**), `scripts/db-reset.mjs`.
- **Dependencies:** Task 2; Docker available.
- **Required checks:** `pnpm db:start`, `pnpm db:reset`, `pnpm db:types` produce a committed, current types file; `supabase db lint` clean.
- **Tests:** pgTAP placeholder asserts the `audit` schema exists and `set_updated_at()` is present.
- **Completion criteria:** local DB boots identically on Windows + Linux; types generated & committed; **no domain schema created**.
- **Infra?** Yes (local Docker; a Supabase project is created in Task 14). **Founder?** Founder creates Supabase org/projects when cloud is wired (Task 14).

## Task 9 — Database client & generated types wiring (`packages/db`)
- **Objective:** Typed client factories and a `server-only` guard so the service-role client can never be bundled to the client.
- **Files/dirs:** `packages/db/src/client.ts`, `packages/db/src/index.ts`, `server-only` import guard.
- **Dependencies:** Task 8.
- **Required checks:** typecheck; a build test that importing the service-role client from a client component fails.
- **Tests:** Vitest: anon client available to server; **service-role import blocked in client context** (guard test).
- **Completion criteria:** DB access seam ready; privileged client provably server-only (validation item #4).
- **Infra?** No. **Founder?** No.

## Task 10 — Observability & audit seams
- **Objective:** `packages/observability` (pino logger, request-id helper, Sentry init behind env flag) and `packages/audit` (typed event catalog + `writeAuditEvent()` writing to the `audit` schema). **No business events yet**, just the writer + one generic system event used by the health check.
- **Files/dirs:** `packages/observability/src/*`, `packages/audit/src/*`.
- **Dependencies:** Tasks 8, 9.
- **Required checks:** typecheck; audit writer inserts an append-only row in a test DB.
- **Tests:** Vitest/pgTAP: audit row is insert-only (update/delete denied); logger emits structured JSON; Sentry no-ops when unset.
- **Completion criteria:** audit + logging seams distinct and working; audit immutability proven.
- **Infra?** No (Sentry DSN added in Task 15). **Founder?** No.

## Task 11 — Health endpoint & security headers
- **Objective:** `/api/health` Route Handler (returns build/version, DB reachability boolean — **no secrets**), and centralized **security headers + CSP** via middleware/config.
- **Files/dirs:** `apps/web/app/api/health/route.ts`, `apps/web/middleware.ts` (or headers config).
- **Dependencies:** Tasks 4, 9.
- **Required checks:** health returns 200 locally; a CI header check asserts CSP + security headers present.
- **Tests:** Vitest/Playwright: health responds; headers present; health leaks no secret/env.
- **Completion criteria:** health + headers in place (supports uptime monitoring + baseline security).
- **Infra?** No. **Founder?** No.

## Task 12 — Design-system foundation (`packages/ui`)
- **Objective:** Tailwind design tokens (CSS variables, light/dark), shadcn/ui setup, a **minimal** primitive set (Button, Input, Card, Toast, Skeleton) + an in-repo component playground route. **No feature screens.**
- **Files/dirs:** `packages/ui/src/*`, tokens, `apps/web/app/(marketing)/_playground/` (dev-only).
- **Dependencies:** Task 4.
- **Required checks:** build; a11y check on primitives (axe); typecheck.
- **Tests:** component tests for primitives; axe passes; dark-mode token test.
- **Completion criteria:** shared UI seam with tokens + a few accessible primitives; **`ui` has no db/authz imports** (boundary test).
- **Infra?** No. **Founder?** No.

## Task 13 — Provider-adapter seams (interfaces only)
- **Objective:** Create adapter **interfaces** (and trivial/no-op or local impls) for `packages/storage`, `packages/email`, `packages/jobs`, `packages/notifications`, `packages/search`, `packages/ai`, plus `packages/authz` skeleton (`can()` deny-by-default returning Deny for all until roles exist). **No vendor calls, no models, no business policy.**
- **Files/dirs:** `packages/{storage,email,jobs,notifications,search,ai,authz}/src/index.ts` with typed interfaces + local/dev stubs (e.g., email → Mailpit/no-op; storage → local signed-URL stub; jobs → Inngest client wrapper with a single no-op function).
- **Dependencies:** Tasks 3, 5.
- **Required checks:** typecheck; boundary rules (vendor SDKs only inside their adapter).
- **Tests:** Vitest: `authz.can()` denies by default; each adapter interface has a stub that satisfies its type; job wrapper enqueues the no-op locally.
- **Completion criteria:** all seams exist so later phases implement, not invent; deny-by-default authz proven.
- **Infra?** No (vendor accounts wired later). **Founder?** No.

## Task 14 — Cloud Supabase + Vercel wiring (non-prod first)
- **Objective:** Connect the repo to cloud Supabase (non-prod project) and Vercel (preview/staging), with **separate** projects/keys per environment and **no prod data/secrets in preview**.
- **Files/dirs:** Vercel project config, environment variable definitions (values set by founder in dashboards), `docs/runbooks/deploy.md` (initial).
- **Dependencies:** Tasks 4, 8.
- **Required checks:** a preview deploy builds and serves the placeholder + `/api/health`.
- **Tests:** smoke test against the preview URL.
- **Completion criteria:** PR → preview deploy works; env separation documented.
- **Infra?** **Yes.** **Founder?** **Yes** — create Supabase org + non-prod project, Vercel project, set env vars/secrets.

## Task 15 — CI pipeline (GitHub Actions)
- **Objective:** CI running required checks: typecheck, lint, format, unit/component, **pgTAP + authz**, **migration apply (empty→head) + types-diff = 0 + append-only check**, build, **Gitleaks** + `pnpm audit`, Playwright **smoke** + **axe** against preview; branch protection with required checks.
- **Files/dirs:** `.github/workflows/ci.yml`, `migrations.yml`, `e2e.yml`, `security.yml`, `.github/pull_request_template.md`.
- **Dependencies:** Tasks 3, 7, 8, 14.
- **Required checks:** the workflows themselves must pass on a sample PR.
- **Tests:** CI green on an empty-but-wired repo.
- **Completion criteria:** all gates from [testing-and-quality.md §8](./testing-and-quality.md) enforced on PRs; `main` protected.
- **Infra?** **Yes** (GitHub settings). **Founder?** **Yes** — enable branch protection, add CI secrets.

## Task 16 — Background-job & email dev setup (skeleton)
- **Objective:** Inngest client + Dev Server wired via `packages/jobs`; a single no-op scheduled/triggered function; Mailpit (or Resend test mode) for local email via `packages/email`. **No business jobs, no real sends.**
- **Files/dirs:** `apps/worker/src/functions/health.ts` (no-op), Inngest route handler in `apps/web/app/api/inngest/route.ts`, email dev config.
- **Dependencies:** Task 13.
- **Required checks:** `pnpm dev` runs the Inngest dev server; the no-op function is invocable; a test email lands in Mailpit.
- **Tests:** job handler idempotency test (no-op); email adapter payload test.
- **Completion criteria:** async + email seams proven end-to-end locally.
- **Infra?** Later (Inngest/Resend cloud accounts in a follow-up). **Founder?** Later — create Inngest + Resend accounts before Phase 8/10.

## Task 17 — Analytics & error-monitoring skeleton
- **Objective:** PostHog (privacy-conscious config, disabled without key) + Sentry init (disabled without DSN), both env-gated and environment-tagged.
- **Files/dirs:** `packages/observability` Sentry wiring, PostHog client init in `apps/web`.
- **Dependencies:** Tasks 10, 5.
- **Required checks:** app runs with analytics/errors disabled when keys absent; enabled when present.
- **Tests:** Vitest: no network calls when keys unset; correct env tag when set.
- **Completion criteria:** observability skeletons ready; **audit remains separate** from both.
- **Infra?** Later (accounts). **Founder?** Later — create Sentry + PostHog projects.

## Task 18 — Documentation indexes, AGENTS.md, CLAUDE.md, onboarding
- **Objective:** `docs/README.md` index linking product + architecture; finalize `/AGENTS.md` and `/CLAUDE.md`; `docs/runbooks/` stub; developer onboarding in root `README.md` (setup on Windows + Linux, commands, env, "read these docs first").
- **Files/dirs:** `/AGENTS.md`, `/CLAUDE.md`, `/docs/README.md`, `/docs/runbooks/README.md`, updated `/README.md`.
- **Dependencies:** all prior tasks (documents the real setup).
- **Required checks:** links resolve; onboarding steps reproduce a working local env.
- **Tests:** a docs-link check (optional CI) verifying internal links.
- **Completion criteria:** a new developer/agent can go from clone → running app + tests using only the docs, on either OS.
- **Infra?** No. **Founder?** Review/approve guardrails.

## Task 19 — Phase-2 exit review (gate)
- **Objective:** Verify the foundation against the architecture's validation checklist; produce a short readiness report. **Do not start Phase 3.**
- **Files/dirs:** `docs/architecture/phase-2-exit-review.md` (created by Codex).
- **Dependencies:** Tasks 1–18.
- **Required checks:** full CI green; all validation items (no prod data in non-prod, no client path to service-role, RLS/audit seams, large-file plan present, idempotent job seam, audit≠logs≠analytics, AI-can't-approve seam, no integration required to run) confirmed.
- **Tests:** the complete test suite green.
- **Completion criteria:** signed exit review; explicit statement that **no business/feature tables or flows were created**.
- **Infra?** No. **Founder?** Approve to proceed to Phase 3.

---

## What this plan deliberately does NOT do
- No authentication UI/flows (Supabase Auth wired conceptually via env/seams only; **Phase 4** builds auth).
- No `organizations`, `memberships`, `projects`, `requirements`, `documents`, or any business tables (baseline migration only).
- No document upload/processing features (seam only; **Phase 8**).
- No reviews, packages, notifications-as-features (seams only).
- No billing, integrations, or public API.

**The foundation ends where Phase 3 (design system + application shell for features) and Phase 4 (auth/org/permissions) begin.**

---

*Continue to [open-decisions.md](./open-decisions.md).*

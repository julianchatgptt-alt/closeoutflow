# Phase 2C Audit

> **Auditor role:** Independent senior architecture & security reviewer.
> **Subject:** Codex Phase 2B foundation on branch `codex/phase-2b-foundation` (commits `8835ab8`, `c58bf9f`, `9f5465d`, `baa979c`).
> **Method:** Independent inspection of the actual repository and Git history + reproduction of the validation suite. The Codex completion summary was **not** trusted without verification.
> **Boundary honored:** No implementation code, migrations, packages, features, or Tasks 14–18 were changed. This audit added exactly one file: this document. No commits were made.

---

## 1. Executive verdict

The Phase 2B foundation is **genuine, disciplined, and closely matches the approved Phase 2 architecture and the scope boundary**. Tasks 0–13 are implemented; Tasks 14–18 and all Phase 3 / business-domain work are correctly absent. The dangerous invariants the blueprint cares about are enforced *structurally* — deny-by-default authz, `server-only` service client (proven by a real negative build), private-only storage keys with traversal guards, AI typed as non-authoritative, immutable audit enforced by a DB trigger, and a tooling guard that fails the build if a business table appears in a migration.

I reproduced **9 of 10** validation commands green in the audit environment. The tenth (`test:db` / pgTAP) could not run **only** because Docker is unavailable in this audit sandbox; the pgTAP files and migrations were reviewed statically and are sound.

**No CRITICAL or HIGH findings.** Findings are 2 MEDIUM, 8 LOW, and several OBSERVATIONS — all addressable in Phase 2D without architectural change. **No finding hard-blocks Phase 3**, though P2C-001 and P2C-002 should be fixed early in 2D.

**Verdict: READY FOR PHASE 2D REMEDIATION.**

---

## 2. Repository and Git state

| Check | Result |
|-------|--------|
| Current branch | `codex/phase-2b-foundation` (expected) ✅ |
| Working tree | Clean before this audit doc ✅ |
| Branches present | `codex/phase-2b-foundation`, `main`, `remotes/origin/main` |
| Four Phase 2B commits present | `8835ab8`, `c58bf9f`, `9f5465d`, `baa979c` ✅ |
| Total tracked files | 139 (133 Phase 2B + 6 Phase 1 product docs) ✅ |
| Files added across the 4 commits | **133** — matches Codex's claim exactly ✅ |
| Phase 1 baseline commit | `ea23757` (6 product docs, 2 744 lines) intact ✅ |
| Founder/prior work preserved | Untracked architecture docs + `AGENTS.md`/`CLAUDE.md` were **committed unchanged** in `baa979c` (line counts match the authored originals); Task 0 note confirms preservation ✅ |
| Build artifacts committed | None — `node_modules`, `.next`, `.turbo`, `dist`, `*.tsbuildinfo`, `coverage` all gitignored ✅ |
| Secrets committed | None found (see §5) ✅ |
| `.env` tracked | Only `.env.example` (placeholders) ✅ |

**Commit boundaries are logical and match their messages:** `8835ab8` workspace/config, `c58bf9f` Supabase + audit, `9f5465d` app shell + packages + tests, `baa979c` docs/progress. Phase 1 and prior architecture history are intact.

---

## 3. Scope-compliance review

**Tasks 0–13 implemented; stopped at the correct boundary.** Verified by direct inspection, generated types, and a tooling guard.

| Prematurely-implemented feature? | Present? | Evidence |
|----------------------------------|----------|----------|
| Authentication flows | ❌ absent | No auth routes/UI; Supabase Auth only referenced via env/seams |
| Organizations / memberships / projects / contacts / subs | ❌ absent | `public.Tables = [_ in never]: never` in generated types; `validate-migrations.mjs` forbids these tables |
| Requirements / submissions / documents / reviews | ❌ absent | Same as above |
| Upload portal / document workflows | ❌ absent | `packages/storage` is interface + local stub only |
| Notifications / billing / owner portal | ❌ absent | `packages/notifications`, no billing, no owner routes |
| AI business processing | ❌ absent | `packages/ai` is a suggestion-only interface + no-op |
| Phase 3 app-shell / feature UI | ❌ absent | Only a neutral placeholder + a local-gated component playground |
| Tasks 14–18 cloud wiring | ❌ absent | No CI workflows, no Inngest function route, no real email/analytics wiring |

**Infrastructure seams vs. premature features:** every provider package (`storage`, `email`, `jobs`, `notifications`, `search`, `ai`, `authz`) is a **narrow typed interface + local/no-op implementation** — genuine seams, not features. `packages/db/src/types.generated.ts` confirms an empty `public` schema and a real `audit` schema.

---

## 4. Architecture-compliance review

### Repository architecture ✅
- **pnpm workspaces** (`apps/*`, `packages/*`) + **Turborepo** (`build`/`dev`/`typecheck` pipeline). Node pinned `>=24 <25` (`.nvmrc` `24`; runtime `v24.14.1`), pnpm pinned `10.33.0` via `packageManager`. Lockfile committed (6 175 lines).
- **Dependency direction correct & enforced twice:** `scripts/check-boundaries.mjs` (packages↛apps, UI↛db/authz/@supabase, no `@closeoutflow/*/src/*` deep imports) **and** ESLint `no-restricted-imports`. No circular architecture observed.
- Tree matches `repository-structure.md` (feature/worker dirs correctly deferred to their phases).
- **Cross-platform:** all scripts are Node (`spawnSync` on `process.execPath`, no shell strings); `.gitattributes` forces LF. Ran clean on this Windows host.

### Web application architecture ✅
- Next.js App Router, strict TS, RSC. Route Handler `/api/health` is `dynamic = "force-dynamic"`. Security headers applied globally via `next.config.ts` `headers()`. `poweredByHeader:false`, `reactStrictMode:true`.

### TypeScript & build quality ✅ (strong)
- `tsconfig.base.json` is genuinely strict: `strict`, **`noUncheckedIndexedAccess`**, **`exactOptionalPropertyTypes`**, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `isolatedModules`, `allowJs:false`.
- **Zero** `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, or skipped tests in tracked source (excluding generated types). Error handling is explicit (scripts return exit codes; audit writer throws).

### Data architecture ✅ (see §6)

### AI seam ✅
- `AiSuggestion.authoritative: false` is a **literal type** — the type system forbids an authoritative AI result. `AiAdapter` exposes only `suggest()`; no approve path. `noopAiAdapter` returns `[]`.

### File-storage seam ✅
- `StorageAdapter` exposes only signed `createUploadUrl`/`createDownloadUrl`; `SignedStorageUrl.visibility` is the literal `"private"`. `privateStorageKey()` **rejects non-`org/`-prefixed keys and any `..`** (traversal). No public bucket in `config.toml`; no public-URL concept anywhere.

### Background-job / email / notification seams ✅
- `JobEnvelope` mandates `idempotencyKey` + `correlationId`. Email/notification/search adapters are typed no-ops that **cannot send/dispatch without real wiring** (return `skipped`). Inngest/Resend/React Email correctly not wired (Task 16 deferred).

---

## 5. Security review

### Highest-risk paths (this product) and their foundation defenses

| Path | Foundation state |
|------|------------------|
| Cross-tenant leak | Deferred-but-enabled: audit table has `enable`+`force` RLS, deny-by-default; `authz.can()` denies everything until Phase 4; org-scoped storage keys. Business RLS arrives with business tables. ✅ readiness |
| Service-role exposure to client | **Proven impossible for the current path:** `db/server.ts` uses `import "server-only"`; `test:server-only` builds a client component importing it and **the Next build fails as required**. E2E asserts the health body contains no service-role string. ✅ |
| Secure-link abuse | Not yet implemented (Phase 4/7); no insecure precedent introduced. Deferred. |
| Malicious file upload | Storage seam is signed/private/traversal-safe; scan/quarantine deferred to Phase 8. ✅ readiness |
| Audit tampering | Immutable via trigger (see §6). ✅ |

### Secrets & environment ✅
- `.env.example` is placeholders only; **no** JWT/`sk-`/`AKIA`/private-key/`xox`-patterns in tracked files. `serverSecretKeys` never `NEXT_PUBLIC_`; `env.test.ts` asserts this and that production requires Supabase values.
- Clean server/client env split via `@t3-oss/env-nextjs`; `emptyStringAsUndefined:true`; production/staging fail fast without required values while local stays optional (unblocks foundation).

### Web-attack posture
- CSP present with `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, HSTS(preload), `nosniff`, `X-Frame-Options: DENY`, restrictive `Permissions-Policy`. CSP is **enforced** (Playwright showed React dev-mode `eval()` blocked — the CSP correctly omits `unsafe-eval`). **Gap:** `script-src`/`style-src` include `'unsafe-inline'` (finding **P2C-002**).
- `allowedDevOrigins` limited to loopback; dev-only.
- Health endpoint leaks no secrets/DB errors (catches and logs; returns booleans).

### Logging ✅ with gaps
- pino `base:null`, redacts `password/token/authorization/cookie/*.serviceRoleKey`. **Gaps:** hardcoded `level:"info"` ignores `LOG_LEVEL` (**P2C-005**); redaction list is shallow/incomplete (**P2C-007**). Sentry is env-gated no-op with `sendDefaultPii:false`. Audit is separate from logs and analytics ✅.

---

## 6. Database and RLS-readiness review

**Migrations (`0000_baseline.sql`, `0001_audit_foundation.sql`) — infrastructure only, high quality:**
- Naming/ordering enforced by `validate-migrations.mjs`; append-only convention documented.
- `pgcrypto` in `extensions` schema. `audit` schema created; `revoke all ... from public, anon, authenticated`; `grant usage ... to service_role`.
- **Both SQL functions use the secure pattern** `security invoker` + `set search_path = ''` — no search-path injection surface, no unnecessary `SECURITY DEFINER`.
- `audit.audit_events` matches the architecture field set (actor_type/source `check` constraints, `ip inet`, jsonb before/after/metadata). `enable` **and** `force row level security`. Grants limited to `insert, select` for `service_role`; **no** update/delete grant to anyone.
- **Immutability is trigger-enforced** (`before update or delete → raise P0001`), which correctly survives `BYPASSRLS`/ownership. pgTAP (`0001_audit_immutability.test.sql`) asserts UPDATE and DELETE both throw.
- **No business tables** — `public.Tables` is `[_ in never]: never` in the generated types; a tooling guard blocks business tables in migrations.

**Findings:** audit immutability does not cover `TRUNCATE` (**P2C-003**); the `audit` schema is exposed on the PostgREST API surface (**P2C-004**, currently safe via grants but a design tension because the JS audit writer needs it exposed).

**Service-role / RLS discipline:** service client server-only (proven); anon client carries no secret; `db` package exports `./server` but **not** `./client` publicly (asserted in `client.test.ts`). Generated types are reproducible (`db:types` deterministic; progress doc reports identical SHA-256 across two runs).

---

## 7. Package and dependency review

- Placement correct: test/build tooling in root `devDependencies`; runtime deps local to each package (`@supabase/supabase-js` + `server-only` in `db`; `zod` + `@t3-oss/env-nextjs` + `server-only` in `env`; `pino` in `observability`; `@radix-ui/react-toast` in `ui`; `next/react` in `web`).
- **Exact, pinned versions** throughout; no broad ranges; single committed lockfile. `onlyBuiltDependencies` limited to `esbuild`, `sharp`, `supabase` (controls install scripts).
- No duplicate-functionality or abandoned packages spotted. No deferred provider SDKs prematurely added (no Inngest/Resend/PostHog/Upstash SDKs yet — correct).
- **Observations:** Next.js 16 / React 19 / Node 24 are very new majors (intentional; monitor stability). `@sentry/node` (not `@sentry/nextjs`) is fine for server/worker; revisit when client/edge capture is wired. Static review only — cloud dependency scanning is correctly deferred to Task 15.

---

## 8. Test and quality review

- **17 Vitest files / 24 tests** — matches Codex exactly; reproduced green. Tests are **meaningful**: deny-by-default authz; storage traversal rejection; env production-required + secret-server-only; db anon-has-no-secret + server-only marker; audit immutability (unit + pgTAP); header/health safety; primitive axe scan.
- **Playwright 6 tests** (3 × chromium + mobile-chrome), **2 `@a11y`** — reproduced green; includes a **negative secret-leak assertion** on the health body.
- **pgTAP 2 files / 6 assertions** — files reviewed and sound; **not reproduced live** (no Docker here).
- `vitest.config.ts` aliases `server-only` to a stub for jsdom (correct; the *real* boundary is proven by the Next build in `test:server-only`).
- **Gaps:** E2E matrix is Chromium-family only (no WebKit/Firefox) (**P2C-010**); ESLint uses `recommended` not `recommendedTypeChecked` (OBSERVATION).
- No skipped/`.only`/flaky/vacuous tests found.

---

## 9. Documentation review

- `AGENTS.md` (40 lines) and `CLAUDE.md` (37 lines) are concise, route to the detailed docs, and encode the non-negotiables (isolation, RLS, private files, version integrity, human-only approvals, one authz source, append-only audit/migrations, stop-and-report). ✅
- `phase-2-implementation-progress.md` is accurate against reality (I verified the Toast primitive it claims **does** exist; empty public schema; server-only proof; etc.). Deferred Tasks 14–18 are clearly listed with founder requirements.
- Documentation commands match actual scripts (`package.json`); no doc claims an unimplemented feature exists.
- **Finding:** progress-doc task numbering (0–18) diverges from the approved `phase-2-implementation-plan.md` (0–19) — plan Task 19 (exit review) is unrepresented and Task 18 scope differs (**P2C-008**, traceability only).

---

## 10. Findings summary

| ID | Severity | Area | Title | Phase 3 blocker | Recommended owner |
|----|----------|------|-------|-----------------|-------------------|
| P2C-001 | MEDIUM | Audit / correctness | Health GET writes an immutable audit row on every request | No (fix early in 2D) | Codex |
| P2C-002 | MEDIUM | Security / CSP | CSP allows `script-src 'unsafe-inline'` vs. mandated nonce-based CSP | No (fix before authenticated UI) | Codex |
| P2C-003 | LOW | Database | Audit immutability trigger doesn't cover `TRUNCATE` | No | Codex |
| P2C-004 | LOW | Database / attack surface | `audit` schema exposed on PostgREST API surface | No | Codex + founder |
| P2C-005 | LOW | Observability | Logger hardcodes `level:"info"`, ignoring `LOG_LEVEL` | No | Codex |
| P2C-006 | LOW | Security / config | Playground gate resolves at build time (static prerender) | No | Codex |
| P2C-007 | LOW | Security / logging | Redaction paths shallow/incomplete | No | Codex |
| P2C-008 | LOW | Documentation | Progress-doc task numbering diverges from plan | No | Codex |
| P2C-009 | LOW | PWA | Manifest has no `icons`; theme_color mismatch | No | Codex |
| P2C-010 | LOW | Testing | E2E matrix is Chromium-family only | No | Codex |
| P2C-011 | OBSERVATION | Lint | ESLint not type-checked variant | No | Codex |
| P2C-012 | OBSERVATION | Health | Top-level `status:"ok"` even when DB unreachable | No | Codex |
| P2C-013 | OBSERVATION | Tooling | `validate-migrations.mjs` misses `if not exists`/quoted-identifier business tables | No | Codex |

---

## 11. Detailed findings

### P2C-001 — MEDIUM — Health endpoint writes an immutable audit event on every request
- **Evidence:** `apps/web/app/api/health/route.ts:17-27` calls `writeAuditEvent(..., action: system.health_checked)` whenever Supabase env is present; the endpoint is `force-dynamic` and is the Playwright/uptime probe target (`playwright.config.ts` `webServer.url`).
- **Architecture/requirement violated:** `security-and-operations.md` §Audit — audit is an immutable, retained legal store, **distinct from operational telemetry**; Phase 1 keeps audit separate from logs/analytics.
- **Why it matters:** uptime monitors poll `/api/health` frequently (e.g., every 30 s). Each hit appends a permanent, un-deletable row (the immutability trigger blocks pruning) to the legal audit table — ~10³–10⁶ noise rows/year that can never be removed, bloating the store and blurring the audit/telemetry boundary.
- **Recommended remediation:** make the DB-reachability probe a lightweight read (e.g., `select 1` / a cheap RPC) and **remove the audit write from the public health path**. If a "health checked" audit is genuinely wanted, emit it from an authenticated/internal, non-polled path.
- **Tests required after fix:** health-route test asserting **no** audit row is written on GET; retain a DB-reachability assertion; keep the no-secret-leak assertion.
- **Blocks Phase 3:** No — fix early in 2D for audit hygiene.

### P2C-002 — MEDIUM — CSP permits `unsafe-inline` scripts instead of nonce-based CSP
- **Evidence:** `apps/web/next.config.ts` `securityHeaders` → `script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'`.
- **Architecture violated:** `security-and-operations.md` §5 mandates **nonce-based scripts**.
- **Why it matters:** `'unsafe-inline'` in `script-src` largely defeats CSP's XSS mitigation — material for a platform that will render user- and subcontractor-supplied content in later phases.
- **Recommended remediation:** implement a nonce-based CSP via `middleware.ts` (per-request nonce, `script-src 'self' 'nonce-…' 'strict-dynamic'`), removing `'unsafe-inline'` for scripts; keep `style-src` pragmatic if Tailwind/Next requires it, or move to nonced styles. Add a `report-to`/`report-uri` when reporting is wired.
- **Tests required after fix:** header test asserting `script-src` contains a nonce and **not** `'unsafe-inline'`; E2E smoke still green under the stricter CSP.
- **Blocks Phase 3:** No — but resolve before authenticated/user-content phases (Phase 4).

### P2C-003 — LOW — Audit immutability does not cover `TRUNCATE`
- **Evidence:** `supabase/migrations/0001_audit_foundation.sql` trigger is `before update or delete`; no `before truncate` statement-level trigger.
- **Why it matters:** `TRUNCATE` bypasses row-level triggers, erasing the immutable log without firing the guard. `service_role` lacks TRUNCATE (only `insert, select` granted), so exposure is limited to owner/superuser — hence LOW — but defense-in-depth for a legal store is warranted.
- **Remediation:** add a `before truncate on audit.audit_events for each statement` trigger raising the same exception.
- **Tests:** pgTAP `throws_ok` on `truncate audit.audit_events`.
- **Blocks Phase 3:** No.

### P2C-004 — LOW — `audit` schema exposed on the PostgREST API surface
- **Evidence:** `supabase/config.toml` `[api].schemas = ["public","graphql_public","audit"]`; `packages/audit/src/index.ts` writes via `client.schema("audit").from("audit_events")` (requires the schema exposed to PostgREST).
- **Why it matters:** the immutable legal store is reachable through the REST surface. It is currently safe (anon/authenticated `revoke`d; only `service_role` granted), but a future accidental `GRANT` would expose it, and it widens attack surface.
- **Remediation:** document the deliberate reliance on grants; add a test/CI assertion that anon/authenticated have no `audit.audit_events` privileges; consider writing audit via a `SECURITY DEFINER` RPC in `public` (or a direct privileged connection) so `audit` need not be API-exposed.
- **Tests:** pgTAP `table_privs_are(...)` already covers `authenticated`; add `anon`.
- **Blocks Phase 3:** No.

### P2C-005 — LOW — Logger ignores `LOG_LEVEL`
- **Evidence:** `packages/observability/src/logger.ts` hardcodes `level:"info"`; `LOG_LEVEL` is validated in `env` but never consumed.
- **Remediation:** pass `LOG_LEVEL` into `createLogger` (default `info`).
- **Tests:** unit test asserting level reflects the configured value.
- **Blocks Phase 3:** No.

### P2C-006 — LOW — Playground gate resolves at build time
- **Evidence:** `apps/web/app/(marketing)/playground/page.tsx` calls `notFound()` unless `APP_ENV ∈ {local,test}`, but the route builds as static (`○ /playground`), so the gate is evaluated during build, not per request. `APP_ENV` defaults to `local` in the schema.
- **Why it matters:** a production build performed without `APP_ENV=production` would statically expose the playground (harmless primitives, but an unintended surface).
- **Remediation:** add `export const dynamic = "force-dynamic"` to the playground route (or guard in middleware), so the gate is runtime; ensure prod builds set `APP_ENV`.
- **Tests:** E2E asserting `/playground` returns 404 when `APP_ENV=production`.
- **Blocks Phase 3:** No.

### P2C-007 — LOW — Incomplete log redaction
- **Evidence:** `logger.ts` redacts `password/token/authorization/cookie/*.serviceRoleKey` only; misses `apiKey`, `secret`, `set-cookie`, `anonKey`, deep-nested variants, and secure-link tokens (relevant later).
- **Remediation:** expand redaction paths (incl. `req.headers.*`, `*.apiKey`, `*.secret`, `*.set-cookie`, token/link fields) before request/response logging is introduced.
- **Tests:** unit test asserting representative sensitive fields are `[Redacted]`.
- **Blocks Phase 3:** No.

### P2C-008 — LOW — Progress-doc task numbering diverges from the plan
- **Evidence:** `phase-2-implementation-progress.md` uses Tasks 0–18; `phase-2-implementation-plan.md` defines 0–19 (Task 19 = exit review; Task 18 bundles AGENTS/CLAUDE, which already exist).
- **Remediation:** reconcile numbering (or add a mapping note) so future agents trace tasks unambiguously; record an explicit Phase-2B exit-review artifact.
- **Tests:** none (doc).
- **Blocks Phase 3:** No.

### P2C-009 — LOW — PWA manifest incomplete
- **Evidence:** `apps/web/app/manifest.ts` has no `icons`; `theme_color` (`#1d4ed8`) differs from `layout.tsx` `themeColor` (`#0b1120`/`#f8fafc`).
- **Remediation:** add maskable/any icons in `public/` and reference them; align theme colors.
- **Tests:** manifest test asserting `icons.length > 0`.
- **Blocks Phase 3:** No.

### P2C-010 — LOW — E2E browser matrix limited to Chromium-family
- **Evidence:** `playwright.config.ts` projects are `chromium` and `mobile-chrome` only.
- **Architecture:** `testing-and-quality.md` names Chromium/WebKit/Firefox (NFR-BROWSER-001).
- **Remediation:** add WebKit (Safari) and Firefox projects before broad UI phases; CI can shard.
- **Tests:** existing specs run across added projects.
- **Blocks Phase 3:** No.

### P2C-011/012/013 — OBSERVATIONS
- **P2C-011:** ESLint uses `tseslint.configs.recommended` (not `recommendedTypeChecked`); type-aware `no-unsafe-*` rules are off. Consider the type-checked config once packages stabilize.
- **P2C-012:** `/api/health` returns top-level `status:"ok"` even when `database.reachable=false`. Defensible as a liveness probe (monitors can read `database.reachable`); consider a `degraded` status for readiness.
- **P2C-013:** `validate-migrations.mjs` business-table check would miss `create table if not exists <t>` and quoted identifiers. Harden the guard when convenient.

---

## 12. Deferred items confirmed (correctly postponed)

Verified absent and appropriately deferred:
- **Task 14** — Cloud Supabase + Vercel wiring (no cloud project config beyond local `config.toml`; env values are placeholders).
- **Task 15** — GitHub Actions CI, CI secrets, migration CI, Gitleaks/dependency scans, preview E2E, branch protection (no `.github/workflows/`).
- **Task 16** — Full Inngest dev server/function route + Mailpit/Resend/React Email wiring (only typed seams + no-op adapters).
- **Task 17** — PostHog + full Sentry application wiring (env-gated no-ops only).
- **Task 18** — Documentation indexes, runbooks, complete onboarding (progress doc present; `docs/runbooks/` not yet created).
- **All Phase 3+ / business-domain** work (auth, orgs, projects, requirements, documents, reviews, notifications, billing, owner portal, AI processing).

---

## 13. Validation commands and actual results

| Command | Reproduced? | Result |
|---------|-------------|--------|
| `pnpm db:validate` | ✅ | PASS — "ordered, infrastructure-only, includes audit/RLS invariants" |
| `pnpm format:check` | ✅ | PASS — all files match Prettier |
| `pnpm lint` | ✅ | PASS — ESLint clean + "Workspace import boundaries passed" |
| `pnpm typecheck` | ✅ | PASS — 14/14 packages (FULL TURBO) |
| `pnpm test` | ✅ | PASS — **17 files / 24 tests** (matches claim) |
| `pnpm build` | ✅ | PASS — 14/14; `/api/health` dynamic, others static |
| `pnpm test:server-only` | ✅ | PASS — client import of `@closeoutflow/db/server` **fails the Next build as required** |
| `pnpm test:e2e` | ✅ | PASS — **6 tests** (chromium + mobile-chrome) |
| `pnpm test:a11y` | ✅ | PASS — **2 `@a11y`** executions (within e2e; axe clean) |
| `pnpm test:db` (pgTAP) | ⚠️ not reproduced | **Docker unavailable in the audit environment.** pgTAP files + migrations reviewed statically and are sound; Codex reports 2 files / 6 assertions passing with Docker present. |

**Environment:** Node `v24.14.1`, pnpm `10.33.0`, Windows 11 host. Only `test:db` was blocked, and solely by the missing local container runtime — not by any repository defect.

Codex's reported totals (Vitest 17/24, Playwright 6, a11y 2, pgTAP 2/6) are **reproduced** except pgTAP, which is corroborated statically.

---

## 14. Phase 2D remediation order

Safe order for Codex (each is small, isolated, test-backed; no architectural change):

1. **P2C-001** — Remove the audit write from `/api/health`; use a lightweight reachability read. *(Highest value: protects the immutable audit store; touches one route + its tests.)*
2. **P2C-003** — Add a `before truncate` guard trigger + pgTAP assertion. *(Same audit-integrity theme; migration-append only — new migration, do not edit applied ones.)*
3. **P2C-004** — Add anon/authenticated no-privilege assertions for `audit`; document/rework API exposure. *(Complements 1–3.)*
4. **P2C-002** — Implement nonce-based CSP in `middleware.ts`; drop `script-src 'unsafe-inline'`; update header tests. *(Security hardening before authenticated UI.)*
5. **P2C-005** and **P2C-007** — Wire `LOG_LEVEL`; expand redaction. *(Observability package, one PR.)*
6. **P2C-006** — Force-dynamic the playground route + 404-in-prod test.
7. **P2C-009** — Add PWA icons + align theme colors.
8. **P2C-010** — Add WebKit/Firefox Playwright projects.
9. **P2C-008** and **P2C-013** — Reconcile task numbering; harden migration guard. *(Docs/tooling.)*
10. OBSERVATIONS (**P2C-011/012**) — adopt at discretion.

Each remediation must keep all existing checks green and add the test named in its finding. Migrations remain **append-only** (new files only).

---

## 15. Final checklist

| Item | Verdict | Basis |
|------|---------|-------|
| Tasks 0–13 implemented | ✅ Confirmed | Inspection + reproduced validation |
| Tasks 14–18 deferred | ✅ Confirmed | No CI, no cloud wiring, no real providers |
| No Phase 3 implementation | ✅ Confirmed | Only placeholder + local-gated playground |
| No business-domain schema | ✅ Confirmed | `public.Tables = never`; tooling guard |
| RLS strategy preserved | ✅ Confirmed | audit `enable`+`force` RLS, deny-by-default; authz denies all |
| Service-role server-only | ✅ Confirmed | `server-only` + **negative build test passes** |
| No public document storage | ✅ Confirmed | No public bucket; private-only keys + traversal guard |
| Audit / logs / analytics separate | ✅ Confirmed | Postgres audit vs pino vs (deferred) PostHog; **caveat P2C-001** |
| AI suggestion-only | ✅ Confirmed | `authoritative: false` literal; no approve path |
| Database tests passed | ⚠️ Static-only | pgTAP sound on review; not run live (no Docker here) |
| Generated types reproducible | ✅ Confirmed | Deterministic `db:types`; empty public + real audit |
| Windows and Linux readiness | ✅ Confirmed | Node scripts only; ran clean on Windows; LF enforced |
| Documentation consistent | ✅ Mostly | Accurate; minor numbering divergence (P2C-008) |
| No critical secrets committed | ✅ Confirmed | Only `.env.example`; no secret patterns found |

---

*Audit complete. No repository files were modified except the creation of this document. No commits were made.*

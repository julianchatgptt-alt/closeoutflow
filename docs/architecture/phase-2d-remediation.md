# Phase 2D audit remediation

> **Scope:** Remediation of the Phase 2C MEDIUM and LOW findings on `codex/phase-2b-foundation`.
> **Source audit:** [phase-2c-audit.md](./phase-2c-audit.md), preserved unchanged.
> **Boundary:** Tasks 14–18 remain deferred. No Phase 3 feature, authentication flow, business table, cloud wiring, provider wiring, or production secret was added.

## Outcome

All two MEDIUM and eight LOW findings from the Phase 2C audit are resolved. The optional observations were reviewed; P2C-013 was fixed because it was narrow and explicitly included in the audit's remediation order. P2C-011 and P2C-012 remain observations for the reasons recorded below.

## Finding remediation

### P2C-001 — MEDIUM — Health endpoint wrote immutable audit events

- **Root cause:** `/api/health` used an audit insert as its database reachability probe, conflating operational telemetry with the permanent legal audit store.
- **Files changed:** `apps/web/app/api/health/route.ts`, `route.test.ts`, `supabase/migrations/0002_phase_2d_audit_hardening.sql`, `supabase/tests/0002_phase_2d_audit_hardening.test.sql`.
- **Fix:** Removed the audit dependency and write from the health route. Added a service-role-only, stable, read-only `public.database_health_check()` RPC. The route returns only a reachability boolean and logs a generic warning without raw database errors.
- **Tests:** Unit tests prove the route source has no audit import/write and invokes only `database_health_check`. pgTAP and a live five-request probe prove repeated health checks do not change the audit row count.
- **Status:** Resolved.

### P2C-002 — MEDIUM — CSP used `script-src 'unsafe-inline'`

- **Root cause:** CSP was a static `next.config.ts` header, so it could not carry a request-specific nonce and allowed inline scripts.
- **Files changed:** `apps/web/proxy.ts`, `proxy.test.ts`, `app/layout.tsx`, `app/api/health/headers.test.ts`, `next.config.ts`, `e2e/foundation.spec.ts`.
- **Fix:** Added a Next.js 16 request proxy that creates a cryptographically random 128-bit nonce, forwards the CSP into the rendering request, and returns the same CSP in the response. HTML routes are dynamic so Next.js can apply the request nonce to rendered framework scripts. Production `script-src` contains `'self'`, the nonce, and `'strict-dynamic'`; it contains neither `'unsafe-inline'` nor `'unsafe-eval'`. Development alone permits `'unsafe-eval'` for framework debugging/HMR. Existing non-CSP security headers remain global.
- **Framework note:** `style-src 'unsafe-inline'` remains because the audit finding and approved requirement concern nonce-based scripts, and the current Next/Tailwind foundation emits styles that require the pragmatic style policy. It does not weaken `script-src`.
- **Tests:** Unit tests verify nonce randomness, production directives, and request/response forwarding. Cross-browser E2E verifies every server-rendered script tag has the response nonce and that separate requests receive distinct nonces. Production build passes with dynamic HTML routes.
- **Status:** Resolved.

### P2C-003 — LOW — Audit `TRUNCATE` was unguarded

- **Root cause:** The original row trigger covered UPDATE and DELETE only; PostgreSQL TRUNCATE bypasses row triggers.
- **Files changed:** append-only migration `0002_phase_2d_audit_hardening.sql`, pgTAP remediation test, audit migration unit test.
- **Fix:** Added a statement-level `BEFORE TRUNCATE` trigger using the existing immutable-audit rejection function. Forced RLS remains enabled.
- **Tests:** pgTAP and direct live PostgreSQL attempts prove UPDATE, DELETE, and TRUNCATE each fail with `audit events are immutable`.
- **Status:** Resolved.

### P2C-004 — LOW — Audit schema was exposed through PostgREST

- **Root cause:** The JavaScript writer inserted through `.schema("audit")`, requiring `audit` in `[api].schemas`.
- **Files changed:** `supabase/config.toml`, migration `0002_phase_2d_audit_hardening.sql`, `packages/audit/src/index.ts` and tests, generated database types.
- **Fix:** Removed `audit` from the exposed API schemas. Added `public.write_audit_event(...)`, a service-role-only `SECURITY DEFINER` RPC with an empty search path. Anonymous and authenticated roles have no audit table privileges and cannot execute the RPC. The audit package now writes through this typed RPC.
- **Tests:** pgTAP proves role privileges and a live service-role RPC insert. A live service-role PostgREST request with `Accept-Profile: audit` receives HTTP 406 after a full stack restart.
- **Status:** Resolved.

### P2C-005 — LOW — Logger ignored `LOG_LEVEL`

- **Root cause:** `createLogger` hardcoded `info` even though environment validation accepted a log level.
- **Files changed:** `packages/env/src/index.ts`, env tests, `packages/observability/src/logger.ts`, observability tests, health route.
- **Fix:** Environment validation now provides a useful `debug` default for local/test and a safe `info` default elsewhere, while rejecting invalid values. `createLogger` accepts the validated level, and the health route passes it.
- **Tests:** Environment tests cover defaults, overrides, and invalid values; logger tests assert effective level selection.
- **Status:** Resolved.

### P2C-006 — LOW — Playground gate was build-time only

- **Root cause:** The route could be statically prerendered while `APP_ENV` defaulted to local.
- **Files changed:** playground `page.tsx`, `access.ts`, and `access.test.ts`.
- **Fix:** Forced dynamic request rendering and isolated the allow rule to local/test only.
- **Tests:** Table-driven unit tests cover all environments. A live server started with `APP_ENV=production` returned 404 for `/playground` while `/` returned 200.
- **Status:** Resolved.

### P2C-007 — LOW — Sensitive log redaction was shallow

- **Root cause:** Pino paths covered only a small fixed set of top-level and one-level keys.
- **Files changed:** observability logger and tests.
- **Fix:** Added recursive, cycle-safe redaction with normalized case/separator matching for authorization, cookies/set-cookie, access/refresh/secure-link tokens, service-role keys, passwords, API keys, secrets, signed URLs, and sensitive request/document/file body fields. Errors, dates, and typed-array metadata keep safe serializer behavior; entire request bodies and file contents are censored.
- **Tests:** Nested-object tests prove realistic secrets never appear while safe context remains.
- **Status:** Resolved.

### P2C-008 — LOW — Progress task numbering diverged from the plan

- **Root cause:** The progress record described the local Tasks 0–13 run and deferred 14–18, but omitted the plan's Task 19 exit gate.
- **Files changed:** `phase-2-implementation-progress.md` and this remediation record.
- **Fix:** Added an explicit 0–19 traceability note, preserved the original history, distinguished deferred Tasks 14–18 from the exit gate, and recorded Phase 2C/2D as the local foundation audit/remediation evidence for Task 19.
- **Tests:** Documentation inspection and Git diff checks.
- **Status:** Resolved.

### P2C-009 — LOW — PWA manifest lacked icons and had mismatched color

- **Root cause:** The foundation manifest omitted icons and used a theme color inconsistent with the light viewport theme.
- **Files changed:** `apps/web/app/manifest.ts`, `manifest.test.ts`, and neutral SVG assets under `apps/web/public/icons/`.
- **Fix:** Added valid `any` and `maskable` icon references and aligned the manifest theme color to `#f8fafc`. Assets remain neutral foundation artwork for Phase 3 replacement.
- **Tests:** Manifest test verifies both referenced files exist, have correct SVG metadata/purposes, and use the aligned theme color.
- **Status:** Resolved.

### P2C-010 — LOW — Browser coverage was Chromium-only

- **Root cause:** Playwright projects included desktop Chromium and mobile Chromium only.
- **Files changed:** `playwright.config.ts` and the existing foundation E2E spec.
- **Fix:** Added desktop Firefox and WebKit projects while keeping the suite small. The same four foundation checks cover all projects without duplicating specs.
- **Tests:** 16 E2E executions pass across Chromium, mobile Chromium, Firefox, and WebKit; four axe executions pass.
- **Status:** Resolved.

## Observations reviewed

- **P2C-011 — Type-aware ESLint:** No change. The audit says to consider this once packages stabilize. Adopting a different lint regime across all packages is broader than the Phase 2D findings and is not required for the current strict TypeScript foundation.
- **P2C-012 — Health top-level status:** No change. `status: "ok"` remains the liveness signal while `database.reachable` is the explicit readiness detail. Changing monitor semantics without Task 14 infrastructure is not warranted.
- **P2C-013 — Migration guard variants:** Resolved as a discretionary tooling hardening. The guard now detects `IF NOT EXISTS`, quoted/schema-qualified identifiers, and unlogged business tables, and runs built-in regression cases.

## Validation results

| Command / check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS — all 15 workspace projects, lockfile unchanged |
| `pnpm format:check` | PASS after formatting one new test file |
| `pnpm lint` | PASS — ESLint and workspace boundaries |
| `pnpm typecheck` | PASS — 14/14 packages |
| `pnpm test` | PASS — 20 files, 38 tests |
| `pnpm db:start` | PASS — Docker/Supabase healthy |
| `pnpm db:reset` | PASS — migrations 0000, 0001, and 0002 applied from empty |
| `pnpm db:types` | PASS — live generated types updated |
| `pnpm db:lint` | PASS — no schema errors |
| `pnpm db:validate` | PASS — ordered, infrastructure-only, required audit/RLS invariants |
| `pnpm test:db` | PASS — 3 pgTAP files, 18 assertions |
| `pnpm test:server-only` | PASS — client import fails its Next.js build as required |
| `pnpm build` | PASS — 14/14 packages; nonce-protected HTML routes dynamic |
| `pnpm test:e2e` | PASS — 16 cross-browser executions |
| `pnpm test:a11y` | PASS — 4 cross-browser axe executions |
| Generated-type determinism | PASS — consecutive SHA-256 hashes identical |
| Live health/audit isolation | PASS — five health requests; audit count unchanged |
| Live audit mutation protection | PASS — UPDATE, DELETE, TRUNCATE blocked |
| Live PostgREST audit exposure | PASS — service-role request receives HTTP 406 |
| Runtime playground gate | PASS — production 404, root 200 |
| CSP nonce tests | PASS — unit and rendered cross-browser verification |
| Live production CSP | PASS — nonce on every rendered script; no script `unsafe-inline` or `unsafe-eval`; playground 404 |
| Nested log redaction | PASS — unit test with nested credentials/payloads |
| Package/boundary checks | PASS through `pnpm lint` |
| Secret scan | PASS — Gitleaks 8.28.0 container scanned staged Phase 2D changes; no leaks |
| Pre-commit staged-file probe | PASS — lint-staged formatted/linted malformed temporary JavaScript; probe removed and index reset |
| Git diff check | PASS — no whitespace errors |

`pnpm audit --audit-level high` was attempted, but pnpm 10.33.0 received HTTP 410 from both npm audit endpoints because those endpoints are being retired. This is an external registry/tool incompatibility, not a repository test failure. Task 15 remains the approved place for CI dependency scanning.

## Architectural completion check

- No CRITICAL or HIGH finding exists.
- Both MEDIUM and all eight LOW findings are resolved.
- Audit, logs, analytics, and operational health remain separate.
- Audit UPDATE, DELETE, and TRUNCATE are blocked; forced RLS remains enabled.
- The audit schema is absent from PostgREST; audit writing remains server-role-only.
- Production scripts use request nonces without inline/eval fallbacks.
- Service-role credentials remain behind `server-only` and no public storage bucket exists.
- AI remains suggestion-only.
- No business table or Phase 3 feature exists.
- Tasks 14–18 remain deferred.

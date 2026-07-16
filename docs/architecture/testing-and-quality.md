# FILE: /docs/architecture/testing-and-quality.md

> **Document status:** Phase 2 architecture — test pyramid, tools, gates.
> **Related:** [architecture-overview.md](./architecture-overview.md), [auth-and-permissions.md](./auth-and-permissions.md), [environments-and-delivery.md](./environments-and-delivery.md).
> Commands below are consistent with the selected tooling (**pnpm + Turborepo + Supabase CLI + Vitest + pgTAP + Playwright + GitHub Actions**) and run on **Windows and Linux** (Node scripts, no bash-only steps).

---

## 1. Test pyramid

```
        ▲ fewer, slower
        │  E2E / smoke (Playwright)           - critical journeys
        │  Integration / API (Vitest)         - actions, route handlers, jobs
        │  DB + RLS + permission (pgTAP+Vitest)- isolation & authz (HEAVILY weighted)
        │  Component (Vitest + Testing Library)- UI units
        │  Unit (Vitest)                       - pure logic, authz policy, schemas
        │  Static: types + lint + format       - every save/commit
        ▼ many, fast
```

CloseoutFlow deliberately **over-weights the DB/RLS/permission layer** relative to a typical app, because tenant isolation and the closeout permission model are the highest-risk areas.

---

## 2. Tools

| Layer | Tool |
|-------|------|
| Type checking | `tsc --noEmit` (strict) |
| Linting | ESLint (shared config in `packages/config`) + import-boundary rules |
| Formatting | Prettier |
| Unit / component / integration | Vitest + Testing Library |
| DB / RLS / constraints | **pgTAP** (in-database) + a Vitest harness that connects as different roles/contexts |
| API / route handlers / actions | Vitest (with a test DB) |
| Background jobs | Vitest + Inngest test utilities (invoke handlers directly; assert idempotency) |
| Email | Vitest + email adapter in test mode (assert payloads); Mailpit in local/e2e |
| File upload | Vitest (signing/validation) + Playwright (resumable upload against local Supabase) |
| E2E | Playwright (Chromium/WebKit/Firefox + mobile emulation) |
| Accessibility | `@axe-core/playwright` + CI axe checks |
| Security regression | Targeted Vitest/Playwright specs + CI scanners (gitleaks, `pnpm audit`, Dependabot/Renovate) |
| Migrations | Supabase CLI apply against ephemeral DB in CI + pgTAP |

---

## 3. Test locations

| Test kind | Location |
|-----------|----------|
| Unit/component/integration | Colocated `__tests__/` next to source; `packages/*/src/__tests__/` |
| `authz` policy tests | `packages/authz/src/__tests__/` |
| RLS/constraint (pgTAP) | `supabase/tests/` |
| API/route-handler/job tests | `apps/web/src/**/__tests__/`, `apps/worker/src/**/__tests__/` |
| E2E + a11y | `apps/web/e2e/` |
| Test fixtures/factories | `packages/*/testing/` or `apps/web/e2e/fixtures/` |

---

## 4. Required coverage areas (must have tests before a feature ships)

1. **RLS isolation** — no cross-org read/write/delete; external grants scoped; service-role confined.
2. **Authorization** — full role×action matrix from [user-roles.md §B](../product/user-roles.md): deny-by-default, inheritance, narrowing, explicit deny, most-specific-wins, sensitive-action gates.
3. **authz↔RLS parity** — representative actions allowed by `authz` are allowed by RLS and vice-versa; divergence fails.
4. **Secure links** — expiry, revocation (fail-closed), rotation, scope limitation, no-PII-in-URL, rate limiting.
5. **File** — signing authorization, MIME/extension/size validation, checksum, quarantine-never-served, version immutability (approved versions cannot be overwritten), resumable upload happy-path.
6. **Jobs** — idempotency (double-delivery safe), retry/dead-letter behavior, re-authorization inside jobs.
7. **Email/notifications** — correct payloads, idempotent sends, suppression respected, webhook idempotency, delivery-status transitions.
8. **Status lifecycles** — only legal transitions from [statuses.md](../product/statuses.md) succeed; illegal transitions rejected.
9. **AI-approval impossibility** — no code path (action or job) lets an AI actor reach an approved terminal (validation item #9).
10. **Accessibility** — WCAG 2.1 AA on core internal + external flows (portal, review, owner).

---

## 5. RLS & permission testing (detail)

- **pgTAP suite** runs inside the database against a freshly migrated + seeded ephemeral DB. It sets the session as: an internal user of Org A, an internal user of Org B, an external grant, and service-role, then asserts exactly which rows each can/can't touch.
- **Cross-tenant matrix:** for each tenant table, assert Org B identity gets zero rows of Org A, for SELECT/UPDATE/DELETE/INSERT.
- **authz unit tests** are table-driven from the role matrix; adding a role/action requires adding cases.
- **Parity harness** exercises the same action through both `authz.can(...)` and a real RLS-scoped query and asserts agreement.

---

## 6. Migration tests

- Every PR that changes `supabase/migrations/` runs: apply all migrations from empty → success; regenerate types → **no diff** (types committed and current); pgTAP passes; expand/contract safety reviewed.
- A "migrations are append-only" check flags edits to already-applied migration files.

---

## 7. Local commands (cross-platform via pnpm/Turbo)

```
pnpm install                 # install workspace
pnpm dev                     # run web app (+ Inngest dev server, Mailpit) locally
pnpm db:start                # supabase start (local Postgres/Storage/Auth via Docker)
pnpm db:reset                # reset + migrate + seed (Node script, Win/Linux safe)
pnpm db:types                # supabase gen types typescript -> committed file
pnpm typecheck               # tsc --noEmit across workspace (turbo)
pnpm lint                    # eslint + import-boundary rules
pnpm format                  # prettier --write
pnpm test                    # vitest (unit/component/integration)
pnpm test:db                 # pgTAP RLS/constraint tests against local db
pnpm test:e2e                # playwright (spins local stack)
pnpm test:a11y               # axe checks (subset of e2e)
pnpm check                   # typecheck + lint + format:check (fast pre-push bundle)
```

Exact script names are finalized in the Phase-2 plan; all are Turbo tasks so they cache and run consistently in CI.

---

## 8. What runs where (gates)

| Stage | Runs | Blocking? |
|-------|------|-----------|
| **On save (editor)** | Type hints, ESLint, Prettier | non-blocking feedback |
| **Pre-commit (husky + lint-staged)** | Prettier + ESLint on staged files, quick typecheck | yes (fast) |
| **Pre-push (optional)** | `pnpm check` + affected unit tests | recommended |
| **Pull request (CI)** | typecheck, lint, format check, unit/component/integration, **pgTAP RLS**, **authz**, migration apply + type-diff, build, gitleaks, `pnpm audit`/Renovate, Playwright **smoke** + a11y on preview | **required** |
| **Merge to main → staging** | Full E2E, full a11y, migration apply to staging | required |
| **Production promotion** | Smoke tests post-deploy, migration ordering check, manual approval | required |

Pre-commit stays fast (staged files only); the heavy suites live in CI so local commits aren't painful for two founders.

---

## 9. Release gates

Before production deploy:
- All required CI checks green on the release commit.
- Migrations validated and ordered (expand/contract) — schema deploys **before** dependent app code.
- E2E smoke of critical journeys passes against staging.
- No open Sentry release-blocking regressions.
- Security scanners clean (no leaked secrets, no high-severity known vulns unaddressed).

---

## 10. Test-data strategy

- Deterministic, clearly-fake fixtures; **never production data** in any test/local/preview/staging environment (validation requirement).
- pgTAP builds isolated per-test fixtures; E2E uses `supabase/seed` + factory helpers.
- Emails route to Mailpit locally; the email adapter runs in test/no-send mode in CI.
- Fake files (small fixtures) exercise upload/scan/quarantine paths; a known-benign EICAR-style test string validates the quarantine path without real malware.

---

## 11. Deferred testing (planned, not at foundation)

- **Load/performance testing** (k6 or similar) — added before scaling to the first large customers; targets the file pipeline, dashboards, and search.
- **Security penetration testing** — external pen test in Phase 16 before launch.
- **Chaos/DR drills** — restoration testing runbook exercised periodically.

---

*Continue to [security-and-operations.md](./security-and-operations.md).*

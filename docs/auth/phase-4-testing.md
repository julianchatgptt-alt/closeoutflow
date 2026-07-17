# FILE: /docs/auth/phase-4-testing.md

> **Document status:** Phase 4A specification — the Phase 4 test plan. **Specification only.**
> **Grounding:** builds on the existing suite (Vitest 26 files, pgTAP, Playwright 5 browser projects, server-only build test, `db:validate`, boundary checks) per [testing-and-quality.md](../architecture/testing-and-quality.md). **Tests must not depend on production OAuth accounts.**

---

## 1. Test pyramid (Phase 4 emphasis)

```
  E2E (Playwright) — critical auth/org journeys, 5 browsers + mobile
  Integration (Vitest + local Supabase) — server actions, route handlers, /auth/callback, functions
  DB / RLS / permission (pgTAP) — HEAVILY weighted: isolation, policies, functions, parity
  Component (Vitest + TL) — auth/account/settings forms & states
  Unit (Vitest) — authz matrix, zod schemas, token hashing, redaction, redirect allowlist
  Static — types + lint + format + boundaries + server-only build
```

As in Phase 2/3, the **DB/RLS/permission layer is over-weighted** — it is the authoritative isolation boundary.

---

## 2. Coverage areas (each must exist before merge)

| Area | Tool | Key assertions |
|------|------|----------------|
| **authz matrix** | Vitest | full role×permission (permissions-and-rls §3); deny-by-default; sensitive gates; suspended denial; owner-target/last-owner guards; forged-metadata grants nothing |
| **RLS isolation (per table)** | pgTAP | Org B identity gets **zero** Org A rows for SELECT/INSERT/UPDATE/DELETE on `user_profiles, user_preferences, organizations, organization_memberships, organization_invitations, organization_ownership_transfers, platform_roles, user_security_events` |
| **authz⇔RLS parity** | Vitest+pgTAP harness | representative (role,permission) allowed by authz ⇔ permitted by RLS; divergence fails |
| **Policy safety** | pgTAP | no recursion / infinite policy; SECURITY DEFINER helpers fixed `search_path`; grants revoked from anon/authenticated where required |
| **Functions** | pgTAP | `create_organization_with_owner` atomic; `accept_invitation` **idempotent** (double-accept = one membership); last-owner guards block; ownership swap atomic; suspended-org blocks invite/accept |
| **Invitation lifecycle** | Vitest+pgTAP | hash-at-rest (raw never stored/logged); expiry; revoke fail-closed; single-use; email mismatch rejected; dedupe; enumeration-resistant (no client SELECT) |
| **Ownership** | pgTAP+Vitest | ownerless impossible (remove/suspend/downgrade/leave sole owner all blocked); transfer requires target accept; MFA gate present |
| **Sessions** | Vitest+Playwright | `getUser()` gate; password change revokes others; global sign-out; stale/tampered cookie denied |
| **MFA** | Vitest+Playwright | enroll/challenge/remove; recovery codes hashed; AAL2 required for sensitive/platform/ownership |
| **Rate limits** | Vitest (Upstash mock/local) | limits enforced; keys are **hashed** (no raw email/token); generic over-limit response |
| **Email rendering** | Vitest (React Email) | Closeout branding; no “CloseoutFlow”; plain-text present; **no token/secret in body**; correct CTA/expiry copy |
| **Auth callback** | Vitest+Playwright | code exchange; **redirect allowlist** (open-redirect rejected: `//evil`, `https://evil`, `/\evil`) |
| **Protected routes** | Playwright | direct nav to `(app)`/`/account`/`/platform` without/with tampered session redirects correctly; not client-only |
| **Cross-tenant E2E** | Playwright | user in Org A cannot see/act on Org B via UI or crafted requests; switching cookie to Org B denies |
| **Onboarding/switching** | Playwright | register→verify→profile→create/join→dashboard; multi-org switch; no-org state |
| **Accessibility** | axe + Playwright | auth/account/settings pages: labels, focus-to-error, dialog focus trap, contrast (light+dark) |
| **Mobile** | Playwright (Pixel 7, iPhone 15) | forms stack; dialogs→sheets; team table→cards; touch targets |
| **Cross-browser** | Playwright (Chromium/Firefox/WebKit) | auth journeys smoke |
| **Security regressions** | Vitest+Playwright | service-role import fails build (extend to `@closeoutflow/auth` server module); no secret in logs; no `NEXT_PUBLIC_` secret; CSP unchanged (nonce, no unsafe-inline) |
| **Audit events** | Vitest+pgTAP | every sensitive action writes the expected event; audit-failure rolls back a sensitive txn; **no token/secret** in any event; immutability holds |

---

## 3. Local test data & users

- **Seed** (`supabase/seed`, non-prod): deterministic test users (with known passwords for local sign-in), a couple of organizations, memberships across all six roles, a pending invitation, a suspended member, a second org for isolation tests, and a platform-admin. Clearly fake emails (`@example.com`) routed to **Mailpit**.
- **Helpers:** a `createTestUser()`/`signInAs()` utility (local Supabase Admin API via service-role in tests only) to provision/clean auth users per test; pgTAP builds isolated fixtures per test and rolls back.
- **No production OAuth:** OAuth code paths are unit/integration tested with a **stubbed provider**; E2E OAuth is skipped locally (documented skip) and validated in staging with founder creds. Email/password + TOTP fully exercised locally.
- **Cleanup:** each test tears down created auth users/orgs; pgTAP uses transactions with rollback.

---

## 4. Where tests run (gates — CI wiring is later)

| Stage | Runs |
|-------|------|
| Pre-commit | format + lint (staged) + quick typecheck (existing) |
| PR (required) | typecheck, lint+boundaries, unit/component, **pgTAP RLS+parity+functions**, migration apply(empty→head)+types-diff=0+append-only, server-only build, email render, build, gitleaks/audit, Playwright **smoke**+axe on preview |
| Merge→staging | full E2E (5 browsers), full a11y, migrations to staging, OAuth smoke (staging creds) |
| Prod promotion | smoke, migration-order check, manual approval |

## 5. Definition of done (Phase 4)

- All coverage areas (§2) green; the 22 validation checks in [phase-4-overview.md](./phase-4-overview.md)/the prompt satisfied.
- **pgTAP proves zero cross-tenant access** on every Phase 4 table; **ownerless impossible**; **invitation acceptance idempotent+transactional**; **suspended member/org denied**.
- authz⇔RLS parity green; no `getSession()`-only gate; redirects allowlisted; service-role confined (build test extended).
- Every sensitive action audited (blocking) with **no secret/token** in events.
- No project/document/requirement tables created; `validate-migrations.mjs` still blocks the forbidden business set.
- a11y (light+dark) + mobile + cross-browser green; visible brand **Closeout** (brand test extended to new pages).

---

*Continue to [phase-4-implementation-plan.md](./phase-4-implementation-plan.md).*

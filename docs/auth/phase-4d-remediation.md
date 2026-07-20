# Phase 4D authentication and tenant-security remediation

> **Status:** complete locally on 2026-07-19.
> **Branch:** `codex/phase-4d-auth-remediation`
> **Audit source:** [Phase 4C audit](./phase-4c-audit.md)
> **Scope:** remediation only. No Phase 5 table, API, workflow, billing,
> integration, external portal, or AI behavior was added.

## Outcome

All six MEDIUM findings are resolved. Six LOW findings are resolved; P4C-L1 is
closed by retaining the intentional fail-fast environment boundary and documenting
why a malformed deployment must not silently render with partial security
configuration. Both Phase 4C observations remain valid.

The append-only migration `0011_phase_4d_auth_remediation.sql` removes
authenticated invitation-table `SELECT`, introduces a permission-checked
administration RPC, minimizes the anonymous invitation preview, carries validated
application-boundary request IDs into audit writes, versions recovery hashes, and
derives audit `actor.reauthenticated` from verified JWT `auth_time`.

## Finding register

| Finding | Severity | Root cause and files | Exact remediation and security/user impact | Regression evidence | Status and remaining risk |
| --- | --- | --- | --- | --- | --- |
| P4C-M1 | MEDIUM | Ownership completion in `apps/web/actions/members.ts` used the general organization-view permission before the authoritative RPC. | The action now loads `to_user`, status, expiry, and verified claims; `canAcceptOwnershipTransfer` requires the exact target, pending/unexpired state, fresh `auth_time`, and AAL2 before the RPC. Users receive a generic recovery message, not transfer internals. | `ownership-transfer.test.ts`; pgTAP ownership target, AAL2, freshness, atomicity, and competing-pending tests. | **Resolved.** The database remains authoritative and repeats every invariant. |
| P4C-M2 | MEDIUM | TypeScript `rolePermissions` and SQL `has_org_permission` were independent hand-maintained matrices without a cross-diff. | `sql-parity.test.ts` independently parses the production migration and compares all non-platform permission names, all roles, and every role-permission mapping with `packages/authz`. | Vitest parity test plus pgTAP active/suspended/unknown/wrong-organization checks. | **Resolved.** Future permission changes fail unless both sources stay aligned. |
| P4C-M3 | MEDIUM | Authenticated clients had invitation-table `SELECT` and relied solely on RLS. | Migration 0011 revokes direct `SELECT`. `get_organization_invitations(uuid)` returns only unexpired pending invitations to active members with `membership.invite`. Team reads and resend/revoke context now use that RPC. | pgTAP proves no authenticated table grant, direct non-admin denial, non-admin zero-row RPC, admin access, fixed grants, and cross-tenant zero rows. | **Resolved.** Defense no longer depends on a single policy edit. |
| P4C-M4 | MEDIUM | The anonymous preview returned the full invited email and distinguishable invalid states. | The preview now returns rows only for usable pending invitations, exposes a masked delivery hint, and gives invalid, expired, revoked, accepted, and suspended cases the same zero-row shape. Exact email matching stays inside transactional acceptance. Sign-up is no longer prefilled from unauthenticated data. | pgTAP privacy/state tests and live browser invitation journeys. | **Resolved.** A valid bearer link still reveals organization name and role by design, but no full address. |
| P4C-M5 | MEDIUM | Sensitive app authorization and audit metadata needed explicit proof that freshness was server-derived. | Organization authorization and transfer acceptance use verified Supabase claims. MFA removal now requires verified AAL2 plus fresh `auth_time`. Password/email changes reauthenticate with the current credential; account deletion and ownership functions enforce DB freshness. `record_identity_event` overwrites `actor.reauthenticated` from JWT `auth_time`, ignoring client flags. | Fresh/stale audit pgTAP, ownership unit tests, authz tests, and security workflow tests. | **Resolved.** Supabase remains the verified claims issuer. |
| P4C-M6 | MEDIUM | Mutation coverage was incomplete and production outage behavior was not explicit enough. | Added distinct limits for reset completion, MFA enrollment/removal, recovery use, session revocation, sensitive organization actions, membership changes, and transfer acceptance. All keys combine operation, request IP, and subject before hashing. Store failure is allowed only in `local`/`test`; preview/staging/production fail closed and staging/production require Upstash. | 21-action static coverage matrix, threshold/hash tests, Upstash outage test, and production environment validation. | **Resolved.** Provider capacity and tuning remain deployment operations. |
| P4C-L1 | LOW | Eager validated environment import returns a deployment error when public Supabase values are malformed. | Retained intentionally: authentication code must not render with a partially valid deployment contract. Public routes render in the correctly configured production-like probe, while malformed staging/production configuration fails before serving an insecure partial app. | Environment schema tests and production-like route probe. | **Justified/closed.** Operational risk is a visible deployment failure rather than silent security degradation. |
| P4C-L2 | LOW | Database workflows generated unrelated random audit request IDs. | Proxy overwrites caller correlation headers with a server UUID. Audit writes prefer the validated `x-closeout-request-id`; direct caller IDs are bounded fallbacks and never authorization evidence. General request-ID helpers now accept only UUIDs. | Proxy forgery test, pgTAP correlation test, and production response probe. | **Resolved.** Direct database maintenance may still use an explicit bounded correlation ID. |
| P4C-L3 | LOW | Recovery codes used fast salted SHA-256. | New codes use versioned HMAC-SHA-256 with a purpose-specific 32+ character pepper. Verification is timing-safe and accepts legacy v1 salted hashes only during the migration window; all newly stored hashes must be v2. | Unit tests for v2, wrong pepper, malformed values, legacy compatibility, and pgTAP consume-once behavior. | **Resolved.** Staging/production must supply `RECOVERY_CODE_PEPPER`. |
| P4C-L4 | LOW | Windows/OneDrive could hold `.next` entries while the server-only probe cleaned them. | The probe removes stale build output before running and uses bounded native `rmSync` retries for both fixture and build cleanup. Cleanup failures still make the check fail. | `pnpm test:server-only` passed both negative builds and cleanup on Windows. | **Resolved.** Repository-owned stale Next processes were also removed before validation. |
| P4C-L5 | LOW | The migration validator had only two prohibited-table self-test variants and no extension note. | Expanded self-tests across every forbidden Phase 5 table and common quoted/schema-qualified forms. Added the explicit Phase 5 allowlist-extension instruction. | `pnpm db:validate`. | **Resolved.** Phase 5 must deliberately update the guard when authorized. |
| P4C-L6 | LOW | MFA QR rendering was visually reviewed but lacked a regression assertion against HTML injection. | Kept Supabase’s QR data URI in an `<img>` and added a source regression test forbidding `innerHTML`/`dangerouslySetInnerHTML`. | `mfa-enrollment.security.test.tsx`, CSP tests, and browser security-route coverage. | **Resolved.** Data URIs remain limited to the existing image CSP source. |
| P4C-L7 | LOW | Owner uniqueness was structurally tested without a competing transfer case. | pgTAP now creates one pending transfer and verifies a competing pending insert is rejected by the partial unique constraint; application completion tests cover target/AAL/freshness. | `0007_phase_4d_auth_remediation.test.sql`. | **Resolved.** Atomic swap and ownerless prevention remain in the original workflow tests. |

P4C-O1 remains an honest product deferral: the sessions page supports current and
global sign-out without inventing a provider-independent device inventory.
P4C-O2 remains confirmed: distributed rate-limit failure is fail-closed outside
local/test.

## Database and grant changes

- Added migration `0011_phase_4d_auth_remediation.sql`; migrations 0001–0010 were
  not edited.
- Revoked `authenticated` `SELECT` on `organization_invitations`.
- Added authenticated-only `get_organization_invitations(uuid)` with fixed empty
  search path and permission/status/expiry checks.
- Replaced `get_invitation_preview(text)` with a masked, generic, non-enumerable
  result while retaining anon/authenticated execution.
- Replaced the central audit writer without exposing the `audit` schema or
  widening its execute grant.
- Replaced recovery-hash and identity-event functions with narrow compatible
  definitions and unchanged authenticated execute boundaries.
- Regenerated `packages/db/src/types.generated.ts`; deterministic SHA-256:
  `5B3F84F3260D30F9CC40317F37B76E8CDBE3E72B2B9379071592CC8E5503D36F`.

Forced RLS remains enabled. Platform administrators receive no implicit tenant
membership or RLS bypass. Service-role usage remains server-only and limited to
the existing health/operational seams.

## Focused commercial usability review

The real Phase 4 routes were reviewed in desktop, Pixel 7, and iPhone 15 projects.
No second visual language or broad redesign was introduced.

- Registration, verification, sign-in, reset, onboarding, switching, profile,
  preferences, MFA, recovery, sessions, team, and organization settings retain
  their existing plain-language requirements, generic security errors, recovery
  links, success messages, responsive layouts, and action labels.
- Invitation preview now identifies the organization and role plus a masked
  destination hint without exposing the full email. Invalid, expired, revoked,
  accepted, and suspended invitations share the same useful “ask an
  administrator to resend it” recovery state.
- Authenticated users can attempt acceptance without the UI making a privacy-
  leaking client email comparison; the transactional database check supplies the
  final generic denial.
- Recovery codes retain the prominent one-time warning and text rendering. MFA QR
  remains an image with accessible alternative text and a manual-secret fallback.
- Ownership and organization lifecycle screens retain their consequence text,
  exact-name deletion confirmation, MFA explanation, and ownerless safeguards.
- Long organization names, email truncation, mobile scrolling, keyboard behavior,
  route errors, empty states, and suspended/no-organization states passed the
  wired browser and accessibility suites.

## Validation harnesses

### Local browser and accessibility harness

`scripts/run-playwright.mjs` is used by both `pnpm test:e2e` and
`pnpm test:a11y`. It starts local Supabase, resets migrations and deterministic
seed users, reads local credentials from `supabase status` without writing them,
configures Mailpit/test environment variables only in the child process, starts a
fresh Next server, runs all five configured projects, and removes Playwright auth
state. It works from a Windows OneDrive checkout and leaves no Next process
running.

### Production-like harness

`pnpm test:production-probe` starts the already-built app on loopback with
`APP_ENV=staging`, local Supabase, test-only non-production provider values, a
distributed-store configuration, and no production credential. It refuses a
non-loopback Supabase URL. It checks:

- `/sign-in`, `/sign-up`, `/forgot-password`, and a safe invalid `/invite/[token]`;
- protected `/dashboard` redirect and hostile `next` normalization;
- production `/design` 404;
- Closeout metadata and `closeoutflow.com` canonical URL;
- unique nonce CSP with no script `unsafe-inline`/`unsafe-eval`;
- security headers and server-generated request IDs;
- repeated health requests create zero audit rows.

Environment tests separately prove missing production Upstash/configuration fails
validation and a distributed-store outage cannot select the local fallback.

### Live database harness

`pnpm test:live-security` refuses non-local Supabase, creates a local audit probe
row, confirms `UPDATE`, `DELETE`, and `TRUNCATE` all fail, and verifies the audit
schema is unavailable through PostgREST.

## Validation results

| Check | Phase 4D result |
| --- | --- |
| Frozen install | Pass; lockfile unchanged |
| Formatting / lint / types | Pass; boundaries included, 15 packages |
| Vitest | Pass; 35 files / 145 tests |
| Database reset / types / lint / validation | Pass; 0000–0011 + seed, no schema lint findings |
| pgTAP | Pass; 8 files / 149 tests |
| Generated type determinism | Pass; identical hash before/after regeneration |
| Server-only negative builds | Pass for DB and auth imports; Windows cleanup passed |
| Production build | Pass |
| E2E | Pass; 151 passed / 55 intentional capability skips |
| Accessibility | Pass; 71 passed |
| Browsers | Pass: Chromium, Firefox, WebKit, Pixel 7, iPhone 15 |
| Mailpit | Pass: verification, reset, existing/new-user invitation flows |
| Production-like runtime | Pass for routes, metadata, redirect, CSP, headers, design gate, request ID, health/audit separation |
| Live database security | Pass for audit immutability and PostgREST schema exclusion |

Intentional Playwright skips are capability-scoped: stateful mutation/email flows
run once in Chromium, while cross-browser authentication/protected-shell smoke and
all applicable accessibility checks run in every configured browser.

## Environment ownership and remaining risks

No founder action is required for the local suite.

Staging/production still require founder-managed hosted Supabase URLs, provider
redirects, OAuth credentials if enabled, Resend/SMTP and domain records, Upstash,
application domain/cookie scope, an independent `RECOVERY_CODE_PEPPER`, platform
administrator provisioning, and the approved break-glass runbook.

Production account/organization deletion remains gated by legal review. Provider
availability, mail deliverability, OAuth consent, rate-limit capacity/tuning, and
the intentionally deferred rich session inventory cannot be proven locally.
No known local security, accessibility, or browser validation risk remains.

## Boundary confirmation

The eight approved Phase 4 identity/tenancy tables remain the complete application
schema. No projects, documents, requirements, billing, AI, external portal, public
bucket, approval automation, or Phase 5 behavior was added. The Phase 3E design is
preserved, the public brand remains **Closeout**, and canonical metadata remains
`closeoutflow.com`.

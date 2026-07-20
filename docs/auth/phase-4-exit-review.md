# Phase 4B exit review

> **Decision:** Phase 4B implementation satisfies the local definition of done and
> is ready for an independent Phase 4C audit.
> **Reviewed branch:** `codex/phase-4b-auth`
> **Base:** Phase 3E closeout `0abfcb5`
> **Review date:** 2026-07-19

## Scope confirmation

Phase 4B implements authentication, identity profiles and preferences,
organizations, memberships, six organization roles, invitations, secure
organization selection, account security, TOTP MFA/recovery codes, platform-role
separation, email adapters, rate-limit seams, security events, and immutable audit
integration.

The public brand remains **Closeout**. Internal package and repository identifiers
remain `closeoutflow` where already established.

The migration validator and a direct schema review confirm that the implementation
stops at eight approved identity/tenancy tables. Phase 5 business entities, APIs,
integrations, billing, search, AI processing, and approval automation were not
started.

## Security review

- Identity decisions use verified Supabase server retrieval; no security gate
  relies on `getSession()` alone.
- Auth metadata and client-submitted roles or organization identifiers do not
  authorize actions.
- `packages/authz` is the deny-by-default application permission source; server
  actions invoke it before organization mutations, while RLS provides the
  authoritative database boundary.
- All eight Phase 4 tables have RLS enabled and forced. Cross-tenant visibility,
  suspended access, wrong-email invitation acceptance, and suspended-organization
  cases are denied in pgTAP.
- Default `anon`/`authenticated` table privileges were explicitly revoked and
  replaced with narrow table, column, and function grants.
- Security-definer functions use fixed safe search paths and controlled execute
  grants.
- The `cof-active-org` cookie is a preference only and is revalidated against an
  active membership.
- Invitation and recovery secrets are high-entropy, hashed at rest, scoped,
  expiring/single-use, and excluded from logs and audit metadata.
- An organization cannot become ownerless through role change, suspension,
  removal, leave, deletion handling, or ownership transfer.
- Ownership transfer is two-step, target-accepted, expiring, reauthenticated,
  AAL2-gated, atomic, and audited.
- Platform roles are stored separately, evaluated server-side, require AAL2, and
  do not grant automatic tenant RLS bypass.
- Service-role code is server-only; normal tenant operations use the authenticated
  RLS client. Negative Next.js builds prove client imports of both privileged DB
  and auth modules fail.
- Audit events remain immutable and distinct from operational logs, analytics, and
  user-facing security events.
- Nonce-based CSP remains request-specific with no `unsafe-inline` or
  `unsafe-eval` in `script-src`.
- No public storage bucket or service-role credential was introduced.

## Functional review

The local application supports:

- registration, email confirmation, password sign-in/sign-out, and password reset;
- secure callback/continuation handling with an internal redirect allowlist;
- profile completion and persisted preferences;
- atomic organization creation with an active owner;
- multi-organization membership and server-validated switching;
- existing-user and new-user invitation acceptance;
- invitation create/resend/revoke and team role/lifecycle management;
- guarded ownership transfer;
- account password, TOTP MFA, one-time recovery-code, security-event, and
  current/global session controls;
- server-enforced no-organization, suspended, MFA, and platform route states.

Google and Microsoft OAuth foundations are implemented and locally stubbed/gated.
Live provider login remains intentionally deferred until founder-managed staging
credentials exist, exactly as allowed by the Phase 4A plan.

## Database review

Migrations are append-only additions after the completed Phase 2 history:

| Migration | Purpose |
| --- | --- |
| `0003_identity_extensions_and_helpers.sql` | identity types and shared helpers |
| `0004_profiles_and_preferences.sql` | profiles, preferences, trigger/fallback support |
| `0005_organizations.sql` | organization identity and status |
| `0006_memberships_and_permissions.sql` | memberships, roles, permissions, isolation helpers |
| `0007_organization_invitations.sql` | hashed invitation lifecycle |
| `0008_organization_workflows.sql` | atomic organization, membership, invitation, and ownership workflows |
| `0009_platform_roles_and_security_events.sql` | platform separation, MFA recovery, security events |
| `0010_phase_4_seed_contract.sql` | local seed contract and final grants |

The local database resets from empty to head, generated types are deterministic
(SHA-256 `F7E207C58F04C6EDD36E8A5A8AD440CAB5DAA69A79A85E1C2725B16739280070`),
schema lint is empty, and migration validation still rejects Phase 5 tables.

## Validation evidence

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass; 16-project workspace lockfile unchanged |
| `pnpm format:check` | Pass |
| `pnpm lint` | Pass; ESLint and workspace boundary checks |
| `pnpm typecheck` | Pass; 15 packages |
| `pnpm test` | Pass; 31 files, 117 tests |
| `pnpm db:start` | Pass; local Supabase stack running |
| `pnpm db:reset` | Pass; migrations `0000`–`0010` and seed applied |
| `pnpm db:types` | Pass; two consecutive generations byte-identical |
| `pnpm db:lint` | Pass; no schema errors |
| `pnpm db:validate` | Pass; ordered allowlisted migrations and audit/RLS invariants |
| `pnpm test:db` | Pass; 7 files, 126 pgTAP tests |
| `pnpm test:server-only` | Pass; privileged DB and auth client imports fail client builds |
| `pnpm build` | Pass; optimized Next.js production build |
| `pnpm test:e2e` | Pass; 151 passed, 55 intentional skips across 5 projects |
| `pnpm test:a11y` | Pass; 71 passed |
| Cross-browser smoke | Pass; Chromium, Firefox, WebKit, mobile Chrome, mobile Safari |
| Live auth email journeys | Pass; verify/reset and invitation continuation through Mailpit |
| Production route gate probe | Pass; protected redirects; `/design` and `/playground` return 404 |
| CSP nonce probe | Pass; unique request nonces, 22/22 scripts nonced, no unsafe script source |
| Health/audit separation | Pass; 5 health requests created 0 audit rows |
| Audit immutability | Pass; live `UPDATE`, `DELETE`, and `TRUNCATE` all blocked |
| PostgREST exposure | Pass; `audit` schema unavailable (HTTP 406), including service-role probe |
| Secret scan | Pass; see final repository check |
| `git diff --check` | Pass |
| Pre-commit staged-file probe | Pass; see final repository check |

Intentional skips are capability/project scoped, not ignored failures: stateful local
auth journeys execute once in Chromium; OAuth provider E2E requires external
credentials; browser-independent assertions are not duplicated where the
Playwright configuration marks them inapplicable. Cross-browser auth and protected
shell smoke still execute in every configured browser project.

## Problems found and remediated

1. Supabase local email confirmation was disabled. The checked-in local config now
   requires confirmation and enables double-confirmation for email changes.
2. Callback redirects trusted the request URL host. Redirect construction now uses
   the validated application URL.
3. Invitation, reset, MFA, and reauthentication continuations were absent from the
   internal redirect allowlist. They are now validated and regression-tested.
4. App-layer membership/org mutations did not consistently invoke the central
   authorization matrix. A server-only adapter now derives database-backed context
   and calls `packages/authz`.
5. Phase 4 tables inherited overly broad authenticated grants. Migrations now
   revoke defaults and grant only required tables, columns, and functions.
6. Initial database coverage did not exercise enough lifecycle edge cases. A new
   20-test pgTAP suite covers all eight table boundaries, invitation failure modes,
   organization suspension, duplicate pending invitations, and token rotation.
7. The generated public client key in the ignored app-local environment did not
   match the running local stack. The ignored developer environment was corrected;
   no credential was added to Git.
8. Two safe-redirect tests expected encoded query text after URL canonicalization.
   Their expected values now match the deliberately canonical internal URL.

## Remaining external risks and founder actions

No founder action is required to reproduce the local green suite. Before staging or
production, complete the decisions in [open-decisions.md](./open-decisions.md):

- create hosted staging/production Supabase projects and configure Site/redirect
  URLs;
- provide Google and Microsoft OAuth credentials if those providers will ship;
- configure Resend/Supabase SMTP and verify SPF, DKIM, and DMARC for the Closeout
  mail domain;
- confirm the application domain and cookie scope;
- provide production Upstash credentials and decide CAPTCHA posture;
- confirm production MFA, session, invitation, and transfer policies;
- obtain legal approval before enabling production account/organization deletion;
- provision platform administrators and approve the MFA-protected break-glass
  runbook.

These are deployment governance/infrastructure gates, not local implementation
failures.

## Exit decision

Phase 4B meets the approved local definition of done without weakening RLS, CSP,
audit immutability, service-role protections, owner safeguards, or the Phase 5
boundary. The implementation may proceed to the independent Phase 4C audit. Phase
5 must not begin until that audit is accepted.

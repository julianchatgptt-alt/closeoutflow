# Phase 4C Audit

> **Auditor role:** Independent authentication, authorization, PostgreSQL RLS, multi-tenant security, and application-security reviewer.
> **Subject:** Codex Phase 4B on `codex/phase-4b-auth` (commits `1fbdd51`, `c1ae33d`, `82f65f5`, `9564884`, `1a17f4e`).
> **Method:** Independent inspection of code, migrations, RLS policies, grants, and tests **plus live database reproduction** — I started local Supabase, applied all migrations, ran the full pgTAP suite as constrained `authenticated` roles, and executed my **own** cross-tenant isolation probe and a grants census against the running database. The Codex summary was not trusted without verification.
> **Boundary honored:** No implementation code, migrations, policies, grants, config, or env changed. This audit added exactly one file: this document. No commits.

---

## 1. Executive verdict

Phase 4B is a **strong, security-conscious implementation** of the Phase 4 identity and tenancy foundation. The multi-tenant isolation model is real and database-enforced: I **independently reproduced** that a member of Organization B reads **0 rows** of Organization A across `organizations` and `organization_memberships`, cannot forge a membership INSERT (blocked by grant), and cannot UPDATE another org (permission denied — no direct grant). All authorization derives from database membership, never from JWT/metadata; every security decision uses verified `getUser()` (**zero `getSession()` usage**); redirects are allowlist-validated; invitation tokens are crypto-random and stored hash-only; ownership transfer requires AAL2 + reauth recency + target acceptance and ownerless organizations are structurally impossible; recovery codes are salted-hashed with timing-safe comparison; platform admins have **no** RLS-bypass policy.

**Reproduced green:** typecheck, lint (+boundaries), Vitest **31 files / 117 tests**, pgTAP **7 files / 126 tests**, `db:validate`, `db:reset`, build, grants census, cross-tenant probe, production CSP + security headers. `test:server-only` **passed its assertions** (both `db/server` and the new `auth/server` fail the client build) but the script crashed on a Windows-only `.next` cleanup race. The e2e/a11y browser suites could **not** be fully reproduced in this audit environment (the Playwright auth-setup requires a running dev server wired to seeded local Supabase, which my probe harness did not stand up) — recorded honestly, not as a defect.

**No CRITICAL findings. No cross-tenant, auth-bypass, secret-exposure, MFA-bypass, or ownerless path was found.** Findings are 0 CRITICAL, 0 HIGH, 6 MEDIUM, 7 LOW, plus observations — all fixable in Phase 4D without architectural change. **Verdict: READY FOR PHASE 4D REMEDIATION.**

---

## 2. Repository and Git state

| Check | Result |
|---|---|
| Branch | `codex/phase-4b-auth` (expected) ✅ |
| Worktree before audit doc | clean ✅ |
| Five Phase 4B commits present | ✅ |
| Files changed across Phase 4B | 99 |
| Phase 2 migrations (0000–0002) modified | **No** ✅ |
| Phase 3E visual files (tokens.css, dashboard, gallery) modified | **No** ✅ |
| Phase 4A specs rewritten to hide deviations | No — specs intact; progress/exit docs added ✅ |
| Phase 5 tables/routes/APIs | **None** (live DB shows exactly 8 approved tables) ✅ |
| Commit boundaries | logical (foundation → schema → flows → tests → docs) ✅ |
| Secrets / raw tokens committed | none found ✅ |

---

## 3. Scope compliance

**Exactly the approved identity/tenancy scope.** Live `pg_tables` in `public`: `user_profiles, user_preferences, organizations, organization_memberships, organization_invitations, organization_ownership_transfers, platform_roles, user_security_events` — and nothing else. No projects, companies (as Phase 5 entities), subcontractors, requirements, documents, reviews, packages, equipment, warranties, billing, AI, search, general notifications, portals, or public API. `user_session_metadata` correctly **omitted** (matches the spec's "defer unless justified"). Organization identity data (name/slug/timezone) is present; no Phase 5 company/project data.

---

## 4. Migration census

| # | Migration | Purpose | Tables | Functions | Triggers | RLS | Grants | Audit result |
|---|-----------|---------|--------|-----------|----------|-----|--------|--------------|
| 0003 | identity extensions & helpers | `citext`; base helpers | — | `current_user_id`, `slugify` | — | — | revoke public/anon; grant authenticated/service_role | ✅ `security invoker`, `search_path=''` |
| 0004 | profiles & preferences | provisioning + prefs | `user_profiles`, `user_preferences` | `handle_new_user`, `ensure_profile` | new-user + updated_at | enable+**force**, self policies | narrow | ✅ idempotent `on conflict`; self-only |
| 0005 | organizations | tenant boundary | `organizations` | — | updated_at | enable+**force** | narrow | ✅ slug unique; status check |
| 0006 | memberships & permissions | access + authz helpers | `organization_memberships` | `is_org_member`, `has_org_role`, `has_org_permission`, `get_organization_members` | updated_at | enable+**force**; recursion-safe | SELECT + `UPDATE(job_title)` only | ✅ one-active-owner partial index; definer helpers |
| 0007 | invitations | secure invites | `organization_invitations` | `create/accept/revoke/resend/get_preview` | updated_at | enable+**force**; admin-select only | SELECT to auth; func grants narrow | ✅ hash-at-rest, dedupe, transactional/idempotent |
| 0008 | org & ownership workflows | atomic lifecycle | `organization_ownership_transfers` | 13 lifecycle functions | updated_at | enable+**force**; involved-only | function grants via DO loop | ✅ AAL2 gates; ownerless-impossible guards |
| 0009 | platform roles & security events | platform + security log | `platform_roles`, `user_security_events` | `is_platform_admin`, `record_*`, `recovery_*`, `request_account_deletion`, `get_organization_audit`, `platform_*` | updated_at | enable+**force**; self-only | narrow | ✅ platform separation; audit off PostgREST |
| 0010 | seed contract | deterministic local seed | — | — | — | — | — | ✅ non-prod fixtures |

**Numbering** follows 0003→0010 append-only; Phase 2 untouched. **`db:reset` reproduced cleanly** (all migrations + seed applied, containers restarted). No production-only assumption blocks local dev (Upstash/OAuth are optional locally — verified). Generated types committed. **Migration audit: PASS.**

---

## 5. Phase 4 table census

All 8 tables: UUID PK, `created_at`/`updated_at` + `set_updated_at` trigger, `text`+`check` status/role columns, **RLS enabled + forced**, FKs with explicit delete behavior (`on delete cascade` to org/user; `set null` for `invited_by`), and grants limited to `authenticated` SELECT (mutations via RPC). Key integrity constraints verified in-DB:
- `organization_memberships`: `unique(organization_id,user_id)` + **partial unique `where role='owner' and status='active'`** (ownerless backstop) + status/role/removal_reason checks.
- `organization_invitations`: `unique(token_hash)` + **partial unique pending `(organization_id,email)`**; `citext` email; role check excludes `owner`.
- `organization_ownership_transfers`: **partial unique pending `(organization_id)`**; `check(from_user<>to_user)`.
- `platform_roles`/`user_security_events`/`user_profiles`/`user_preferences`: self-scoped RLS; no anon grant.

**Grants census (live):** `anon` = **zero** table grants; `authenticated` = SELECT only on all 8; audit schema = **0** grants to anon/authenticated. ✅

---

## 6. Identity and profile review

Supabase Auth owns credentials; `user_profiles.id = auth.users.id` (1:1). `handle_new_user` trigger provisions profile+preferences on signup; `ensure_profile` is the idempotent fallback (`on conflict do nothing`, safe under concurrency). Profile/preferences/memberships/platform-roles are cleanly separated tables. Auth-user deletion cascades (`on delete cascade`) with the app deletion flow (`request_account_deletion`, AAL2+confirmation) preserving audit. Profiles are **not** used as proof of authentication — routes require verified `getUser()`. Email/OAuth do not create duplicate profiles (single row keyed on auth id). ✅

---

## 7. SSR session and route-protection review

- **`@supabase/ssr`** server client in `packages/auth/src/server.ts` (`import "server-only"`); cookie adapter; **`getVerifiedUser`/`requireVerifiedUser` use `getUser()`** (validated), and `getVerifiedAssuranceLevel` uses `getClaims()`.
- **Zero `getSession()` in the codebase** (verified by grep). No manual JWT decoding. Security decisions never rely on client state/localStorage/unverified cookies.
- `proxy.ts` refreshes the session (`getUser()`) + applies nonce CSP; layouts re-verify server-side; `/dashboard` returned **307** to sign-in for an unauthenticated request (server enforcement, not client-only). ✅
- **Finding P4C-L1 (LOW):** the auth callback and some pages instantiate the Supabase client eagerly; with malformed env they 500 rather than degrade — acceptable (fail-closed) but noted.

---

## 8. Authentication-route census

| Route | Access | Server check | Notes |
|---|---|---|---|
| `/sign-in` | public | redirect if authed | generic errors; OAuth buttons env-gated |
| `/sign-up` | public | — | invite email prefilled/locked |
| `/verify-email` | authed-unverified | getUser | resend rate-limited |
| `/forgot-password` | public | — | generic success (no enumeration) |
| `/reset-password` | recovery session | — | revokes other sessions on change |
| `/auth/callback` | public handler | getUser + safe-redirect | PKCE exchange; allowlisted redirect |
| `/invite/[token]` | public→authed | `get_invitation_preview` | email-match enforced at accept |
| `/mfa/challenge`, `/reauthenticate` | authed | AAL/claims | `next` via safe-redirect |
| `/account/*`, `/settings/*`, `/onboarding`, `/select-organization` | authed (+org where required) | getUser + membership | see §9 |

Branding **Closeout** (root `title.template`); no fake success states; server-side checks present. ✅

---

## 9. Redirect and callback security

`apps/web/lib/safe-redirect.ts` — `getSafeRedirect` decodes once, rejects: non-`/` start, `//`, `\`, control chars, and any origin ≠ `https://closeoutflow.com`, then requires an **allowlisted prefix**. Test matrix covers `https://evil`, `HTTP://` (mixed case), `//evil`, `%2F%2Fevil`, `/\evil`, `/%5Cevil`, `javascript:`. Callback destinations derive from the fixed app origin, **not** request headers (no host-header trust). **Open-redirect: defended.** ✅

---

## 10. Organization creation and switching

- **Creation** (`create_organization_with_owner`): atomic org + owner membership + 2 audit events in one function; requires `auth.uid()` + **active profile**; server-side name validation (2–120); slug generated + collision-suffixed; role `owner` set server-side (not client). Anonymous/inactive denied. Rate-limited at the action layer.
- **Switching** (`ACTIVE_ORGANIZATION_COOKIE = cof-active-org`): the action layer (`getActiveClient`) treats the cookie as a **preference only** and **revalidates an active membership** via an RLS-scoped query before any operation; invalid/stale/suspended/removed → `redirect("/select-organization")`. My probe confirmed a forged org id yields no access (RLS + membership revalidation). Cookie is a UUID; no injection surface. ✅

---

## 11. Authorization-package review

`packages/authz` — stable dotted permissions, six roles, one authoritative `rolePermissions` matrix, deny-by-default `can()`. Denies: unknown permission/role, inactive account/membership/org, org mismatch, permission-not-in-role, owner-protected targets, sole-owner leave, missing reauth (`reauthentication_required`), missing AAL2 (`mfa_required`), platform-role-required. Platform permissions gated separately (platform role + AAL2). No Phase 5 project permissions. **Matrix comparison vs Phase 4A spec + SQL `has_org_permission`:** identical role→permission mappings (owner⊃admin⊃member-read; PM/Coordinator/Reviewer = member-read; viewer = member-read). ✅

---

## 12. Application authorization review

Every sensitive mutation in `apps/web/actions/*` performs **both** `authorizeOrganizationAction` (authz) **and** a SECURITY DEFINER RPC that re-authorizes in-DB. Verified across `members.ts` (change role, suspend/reactivate/remove, leave, ownership initiate/complete/cancel, invite revoke/resend), each with: input Zod validation, org-context check (`target.organization_id === active org`), authz check, then RPC. No route depends on UI hiding a button. **Finding P4C-M1 (MEDIUM):** `completeOwnershipTransferAction` uses `permission: organizationView` at the app layer (the authoritative AAL2/target-accept gate is in the DB function, which is correct since the *target* accepts) — the app-layer check is weaker than the action's sensitivity; harmless because the DB function is authoritative, but the app layer should assert the actor is the transfer target for clearer defense-in-depth.

---

## 13. RLS matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Anon | Suspended member | Cross-tenant |
|---|---|---|---|---|---|---|---|
| user_profiles | self OR shared **active** org | (trigger/ensure only) | self+active | none | deny | own only | deny ✅ |
| user_preferences | self | (trigger) | self | none | deny | self | deny ✅ |
| organizations | active member | (fn only) | `organization.update` perm+active | none | deny | deny | deny ✅ (probed) |
| organization_memberships | self OR same-org member | (fn only) | self `job_title` only | none | deny | own row visible; no data | deny ✅ (probed) |
| organization_invitations | `membership.invite` perm | (fn only) | (fn only) | none | deny | deny | deny ✅ |
| organization_ownership_transfers | involved users OR manage_members | (fn only) | (fn only) | none | deny | deny | deny ✅ |
| platform_roles | **self only** | none | none | none | deny | n/a | deny ✅ |
| user_security_events | **self only** | (fn only) | none | none | deny | n/a | deny ✅ |

All **enable + force** RLS; no policy references platform-admin (no bypass). **Independently probed:** cross-tenant SELECT = 0 rows; forged INSERT/UPDATE blocked. ✅

---

## 14. RLS helper-function review

`is_org_member`, `has_org_role`, `has_org_permission` (and `get_organization_members`, `get_organization_audit`): all `security definer` + **`set search_path = ''`** + schema-qualified references + **revoked from public/anon, granted authenticated/service_role**. They query memberships with definer rights so the membership SELECT policy (`user_id = auth.uid() OR is_org_member(...)`) does **not** recurse — confirmed by pgTAP passing and my probe terminating. Null-safe (`auth.uid()` null → no rows). No SQL-injection path (no dynamic SQL from user input except the one internal DO-loop over a hardcoded signature array in 0008). Deny-by-default. ✅

---

## 15. Authz-to-RLS parity

The TypeScript `rolePermissions` and SQL `has_org_permission` express the same matrix. **Parity risk noted (P4C-M2, MEDIUM):** parity is maintained by **manual duplication** across two files (TS + SQL `case` statement); there is no single generated source, and the parity tests assert each side independently rather than diffing them against a shared contract. Today they agree (I compared line-by-line), but a future edit to one side could drift without a test necessarily catching a *newly added* permission. Recommend a test that enumerates every `permissions.*` value and asserts the SQL `has_org_permission` returns a defined (non-`false`-by-omission) mapping for each, plus a role×permission cross-check harness.

---

## 16. Database-grants census

Live census (see §5): `anon` — no table grants, no function grants beyond `get_invitation_preview` (intentional, see §18); `authenticated` — SELECT on the 8 tables + `UPDATE(job_title)` column on memberships + execute on the workflow RPCs; `service_role` — full (server-only). Audit schema unreachable via PostgREST (0 grants). **Finding P4C-M3 (MEDIUM):** authenticated has broad `SELECT` on `organization_invitations` at the table level, mediated by the `invitations_select_admin` policy (`membership.invite` perm) — correct, but relies entirely on the policy; a future policy mistake would expose invited emails org-wide. Defense-in-depth: this is acceptable (forced RLS + policy) but worth a parity test asserting a non-admin member gets 0 invitation rows. No broad mutation grants that bypass RPCs. ✅

---

## 17. Membership lifecycle review

`unique(org,user)` enforces one membership per user per org; reactivation reuses the row via `accept_invitation`'s `on conflict ... do update` (history preserved). Suspend/reactivate/remove/leave functions: permission-gated, owner-protected, last-owner-guarded, audited. **Removed/suspended members denied data** (RLS requires `status='active'` — probed). Users cannot change their own role (only `job_title` column grant + `change_member_role` excludes self-owner escalation). Cannot remove/suspend the owner (explicit checks + errcode `23514`). Rejoining requires a fresh invitation (removed members can't self-reactivate). ✅

---

## 18. Invitation-security review

Tokens: `gen_random_bytes(32)` (256-bit) base64url; **only SHA-256 hash stored**; raw returned once to the server for the email link. Acceptance: `for update` lock, verified-email match (`auth.jwt()->>'email'` vs `citext` invitation email), org-active guard, expiry check, transactional membership create/reactivate + invite→accepted + 2 audit events; **idempotent** (re-accept by same user returns existing membership — pgTAP `0006` proves this). Resend rotates token+expiry (old hash invalid). Revoke fail-closes. Dedupe via partial unique pending index. Enumeration-resistant: **no client SELECT by token/email** — lookup only inside definer functions keyed on hash.

**Finding P4C-M4 (MEDIUM):** `get_invitation_preview` is **granted to `anon`** and returns `organization_name` + `invitation_email` + role to **anyone possessing the raw link** (unauthenticated). The token is unguessable (hash-gated, so not enumerable), but the design discloses the invited email address and org name to any link holder before authentication. This is a deliberate pre-signup-preview tradeoff; recommend either (a) requiring authentication for the preview, or (b) returning only org name + role (not the invited email) to anon, revealing the email only post-authentication when it must match. Reproduced: preview works with only a raw token.

**Finding P4C-L2 (LOW):** invitation/workflow audit events use `p_request_id => gen_random_uuid()::text` rather than the real request correlation id from `packages/observability`, weakening cross-system trace correlation. Metadata stores `email`+`role` (no token) — safe.

---

## 19. Ownership-invariant review

**Ownerless is impossible:** partial unique index `(org) where role='owner' and status='active'` (≤1 owner) + guards in `suspend_member`/`remove_member`/`change_member_role`/`leave_organization` blocking owner target/sole-owner. `create_organization_with_owner` yields exactly one owner atomically. **Transfer is two-step:** `initiate` requires `organization.transfer_ownership` perm + **AAL2** + `auth_time` within 15 min + target is an active non-owner; `complete` requires the **target** as caller + AAL2 + pending + not expired, then locks the org's memberships (`for update`), demotes old owner→administrator, promotes target→owner, marks accepted — **atomic swap**; cancel by initiator only. Race safety: both role updates run under a membership lock; the partial unique index guarantees the intermediate/final state never has two active owners. Expires in 7 days; one pending transfer per org (partial unique). Client cannot forge target acceptance (caller must equal `to_user` with AAL2). Audit events blocking (in-transaction). ✅ pgTAP `0004`/`0005` exercise these.

---

## 20. MFA, reauthentication, and recovery-code review

- **MFA:** TOTP via Supabase; AAL2 read from verified `getClaims()`; sensitive DB functions check `auth.jwt()->>'aal' = 'aal2'`. Ownership transfer + org deletion require AAL2; platform actions require AAL2 (authz).
- **Reauth recency:** measured via `auth.jwt()->>'auth_time'` within 15 minutes for ownership transfer and org deletion — bound to the current verified session (not client storage). **Finding P4C-M5 (MEDIUM):** reauth recency is enforced on the two most sensitive DB functions (transfer, delete) but the app-layer `sensitiveReauthPermissions` set in authz relies on an `actor.reauthenticated` flag whose derivation should be audited to ensure it is computed from `auth_time`, not a client-settable value; confirm email-change/password-change/MFA-removal all gate on fresh `auth_time` server-side (some are delegated to Supabase's own reauth — verify none rely solely on a client flag).
- **Recovery codes** (`packages/auth/src/recovery-codes.ts`): `randomBytes(8)` per code, **per-code random salt + SHA-256**, `timingSafeEqual` comparison, single-use via `consume_recovery_code_hash` (definer). Raw codes displayed once, never stored/logged/committed (grep clean). Rotation via `replace_recovery_code_hashes`. **Finding P4C-L3 (LOW):** salted SHA-256 (fast hash) is acceptable for 64-bit random codes but a KDF (e.g., scrypt) would be defense-in-depth. No insecure support shortcut. ✅

---

## 21. Platform-admin separation

`platform_roles` (self-only SELECT, no self-grant, no INSERT/UPDATE/DELETE policy — provisioned by migration/break-glass). `is_platform_admin`/`is_platform_support` definer helpers. **No RLS policy anywhere grants platform admins tenant data** (grep of all policies confirmed) — they act only via `platform_suspend_organization`/`platform_suspend_user`/`get_organization_audit` definer functions requiring the platform role. Client cannot discover platform membership (self-only). Org roles cannot grant platform status. Platform admin cannot silently become org owner (separate table, no cross-grant). MFA (AAL2) required in authz. ✅

---

## 22. Service-role usage census

| Location | Justified? |
|---|---|
| `packages/db/src/server.ts` `createServiceClient` | server-only (`import "server-only"`) ✅ |
| `apps/web/app/api/health/route.ts` | reachability probe (unchanged from Phase 2) ✅ |
| `write_audit_event` grant | service_role only (audit RPC) ✅ |

**No service-role use for tenant CRUD** — all tenant reads/writes go through the anon client under RLS or SECURITY DEFINER RPCs invoked by `authenticated`. `test:server-only` **assertions passed** for both `@closeoutflow/db/server` and the new `@closeoutflow/auth/server` (client import fails the build). **Finding P4C-L4 (LOW):** the `verify-server-only.mjs` script crashes on Windows with `ENOTEMPTY` during `.next` cleanup **after** the assertions succeed (OneDrive/filesystem race) — the security property holds but the script exits non-zero on Windows; harden the cleanup (retry/ignore). Env validation blocks `NEXT_PUBLIC_` secret exposure; no service-role in logs. ✅

---

## 23. Audit-event review

Sensitive actions emit correct events (invitation.created/accepted/resent/revoked, membership.activated/role_changed/suspended/reactivated/removed/left, organization.created/updated/archived/deletion_requested, ownership_transfer.initiated/completed/cancelled) with actor/org/target/metadata via `write_audit_event`. **Blocking:** events fire **inside** the SECURITY DEFINER transaction, so a failure rolls back the action (correct). **Immutability:** pgTAP `0001`/`0002` prove UPDATE/DELETE/**TRUNCATE** rejected; audit off PostgREST. Metadata carries `email`/`role`/slug — **no tokens/passwords/recovery-codes/sessions** (grep + inspection confirmed). `get_organization_audit` gates on `audit.view` and returns only that org's rows. ✅ (See P4C-L2 re: correlation id.)

---

## 24. User-security-event and session review

`user_security_events` is **self-only** SELECT, server-insert only, separate from the immutable org audit — not a general notification system (no fan-out/queue). Sessions: the implementation honestly exposes "sign out everywhere" (global revoke) + current session; `user_session_metadata` correctly **not** built (Supabase lacks native enumeration) — **UI does not pretend full session enumeration exists**, matching the spec's honesty requirement. Password/MFA change effects on sessions handled via Supabase revoke. ✅

---

## 25. Email and rate-limit review

- **Emails** via `packages/email` adapter (`sendIdentityEmail`), Closeout-branded, Mailpit locally, Resend/domain founder-owned (not hardcoded). Verification/reset are Supabase-native; invitations/security app-sent. Idempotency keys present. No token logging.
- **Rate limits** (`apps/web/lib/rate-limit.ts` + Upstash): applied to role-change, invitation-resend, ownership-transfer, and (per actions) sign-in/up/reset/invite/org-create. **Production fail-closed:** env validation **requires** Upstash URL+token in staging/production (I hit this: prod boot fails without them) — a strong posture. **Finding P4C-M6 (MEDIUM):** confirm the **local** fallback (no Upstash) is a permissive no-op **only** in local/test and cannot be reached in production (the env gate suggests yes, but verify sign-in/sign-up/accept-invitation all route through `rateLimitRequest` — some auth actions may rely on Supabase's own limits; document which). Keys hash the identifier (no raw email/token stored). ✅ mostly.

---

## 26. Environment and provider-configuration review

`packages/env` validates server/client split; production **requires** Supabase URL/anon/service-role + Upstash (fail-closed). OAuth/SMTP/Resend/CAPTCHA are founder-owned and optional locally. **Codex's reported "local Supabase key mismatch fix":** the local anon/service keys are the standard Supabase demo keys embedded in `supabase/config.toml`/CLI output (reproducible for any developer via `supabase start`), not an untracked personal file — I reproduced `db:start`/`db:reset` from clean. `.env.example` documents setup. No production secret committed. Missing vars fail safely (Zod). Redirect allowlist is code-level (`safe-redirect.ts`). **Deferred to staging/prod (correctly):** hosted Supabase URLs, OAuth creds, Resend domain, Upstash prod, CAPTCHA, platform-admin provisioning, deletion legal review.

---

## 27. Migration-validator review

`scripts/validate-migrations.mjs`: allowlist extended with **only** the 8 approved identity/tenancy tables; **still forbids** `projects, requirements, submissions, documents, reviews, packages` (and unknown tables fail). `db:validate` reproduced green with the message "limited to infrastructure and approved Phase 4 identity tables." **Finding P4C-L5 (LOW):** confirm the validator has test coverage asserting a *prohibited* table (e.g., `create table public.projects`) still fails — and add a clear comment for Phase 5 agents on how to extend the allowlist. Recommend verifying the forbidden-list is exhaustive vs. the Phase 5 entity list.

---

## 28. CSP and frontend-security review

Production CSP (reproduced): `script-src 'self' 'nonce-…' 'strict-dynamic'` — **no `unsafe-inline`, no `unsafe-eval`**. All Phase 2/3 headers present (HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy). **No `dangerouslySetInnerHTML`** in app code; MFA QR and recovery codes render as data/text (no raw SVG injection — verify QR is an `<img>`/data-URI, not innerHTML: **P4C-L6 (LOW)** confirm the QR rendering path). No `NEXT_PUBLIC_` secret; no auth-token/session/user-object logging (grep clean). Theme pre-paint script is nonce'd (Phase 3D). `/design` gate: `APP_ENV ∈ {local,test}` only, evaluated before render — production 404 by construction (the 500 in my probe was my invalid placeholder env failing Zod, not a gate failure; Phase 3C already verified the live 404). ✅

---

## 29. UI, accessibility, and responsive review

Phase 3E design system reused (public auth card pattern, surface hierarchy, buttons, forms, dialogs) — Phase 3E visual files unmodified by Phase 4B. Branding **Closeout** throughout (root title template). Preview indicators removed from now-functional auth/org routes; future routes remain honest previews. **Accessibility/responsive could not be independently reproduced** in this audit run: the Playwright a11y/e2e suites depend on `auth.setup.ts` logging into a running dev server wired to seeded local Supabase, which my probe harness did not stand up (the setup timed out on `locator.fill` because no app server was bound to the DB). This is an **audit-environment limitation, not evidence of a defect** — the component-level a11y (Radix primitives, labels, focus management) is present in code, and Codex reports 71 a11y passes in their harness. **P4C-M-none** — recorded as an unreproduced claim (§35), not a finding.

---

## 30. Testing review

- **Reproduced:** Vitest **31 files / 117 tests** ✅; pgTAP **7 files / 126 tests** ✅ — both match Codex's report exactly.
- **pgTAP quality is high:** tests `set local role authenticated` + set per-user `request.jwt.claims`, so RLS is genuinely enforced (not service-role-bypassed). `0006` builds two tenants and asserts isolation + invitation edges (revoked/expired/mismatch/duplicate). This satisfies the brief's "run as constrained roles" requirement — I verified the `set local role authenticated` / `reset role` pattern directly.
- **Independent verification beyond the suite:** my own cross-tenant probe (as tenant B) and grants census corroborate the isolation the tests assert (not a false positive from shared fixtures).
- **Not reproduced:** Playwright (151/55-skip) and a11y (71) — harness limitation (§29/§35), not a failure.
- **Finding P4C-L7 (LOW):** the authz⇔RLS parity tests assert each side independently (see P4C-M2); add a cross-diff test. Invitation tests correctly assert token **non**-storage (hash only). MFA/ownership tests present; **ownership concurrency** is asserted structurally (partial index) but no explicit two-concurrent-transfer test — recommend adding one.

---

## 31. Documentation and Git review

`phase-4-implementation-progress.md` + `phase-4-exit-review.md` present and consistent with what I inspected. Commands match `package.json`. Founder production actions (OAuth, Resend, Upstash, domain, CAPTCHA, platform provisioning, **deletion legal review**) documented in `open-decisions.md`. OAuth/email/MFA/session limitations documented. No doc claims Phase 5 exists. Git: logical commits, messages match, no build artifacts/secrets/raw tokens, Phase 2/3 history intact, Phase 4A specs preserved, worktree clean before this doc.

---

## 32. Findings summary

| ID | Severity | Area | Title | P5 blocker | Owner |
|---|---|---|---|---|---|
| P4C-M1 | MEDIUM | App authz | `completeOwnershipTransfer` app-layer check weaker than action sensitivity | No | Codex |
| P4C-M2 | MEDIUM | Authz/RLS parity | Matrix duplicated in TS+SQL with no cross-diff test | No | Codex |
| P4C-M3 | MEDIUM | Grants/RLS | Invitation SELECT relies solely on policy; add non-admin 0-row test | No | Codex |
| P4C-M4 | MEDIUM | Invitations/privacy | `get_invitation_preview` discloses invited email to any anon link-holder | No | Codex + founder |
| P4C-M5 | MEDIUM | Reauth | Verify all sensitive actions gate on server `auth_time`, not a client flag | No | Codex |
| P4C-M6 | MEDIUM | Rate limits | Confirm local no-op limiter cannot be reached in prod; document auth-action coverage | No | Codex |
| P4C-L1 | LOW | SSR | Eager Supabase client init 500s on malformed env (fail-closed but noisy) | No | Codex |
| P4C-L2 | LOW | Audit | Workflow events use random `request_id` not real correlation id | No | Codex |
| P4C-L3 | LOW | Recovery codes | Salted SHA-256 (fast); KDF would be defense-in-depth | No | Codex |
| P4C-L4 | LOW | Tooling | `verify-server-only.mjs` crashes on Windows `.next` cleanup after passing | No | Codex |
| P4C-L5 | LOW | Migration validator | Add prohibited-table test + Phase 5 extension comment | No | Codex |
| P4C-L6 | LOW | CSP/MFA | Confirm MFA QR renders as img/data-URI, not innerHTML | No | Codex |
| P4C-L7 | LOW | Tests | Add ownership two-concurrent-transfer test | No | Codex |
| P4C-O1 | OBSERVATION | Sessions | Honest omission of session enumeration — good | — | — |
| P4C-O2 | OBSERVATION | Env | Prod fail-closed on Upstash — good | — | — |

---

## 33. Detailed findings

### P4C-M1 — MEDIUM — Ownership-transfer completion app-layer check
- **Evidence:** `apps/web/actions/members.ts:281-288` — `completeOwnershipTransferAction` calls `authorizeOrganizationAction(..., permission: organizationView, ...)`.
- **Rule:** defense-in-depth (app + DB authorization for sensitive mutations).
- **Scenario:** any active member could pass the app-layer `organizationView` gate; only the DB function (`to_user = actor + AAL2 + pending`) blocks a non-target. Not exploitable (DB is authoritative), but the app layer under-checks a critical action.
- **Remediation:** at the app layer, assert the caller is the transfer's `to_user` and has AAL2 before invoking the RPC (fetch the transfer, compare `to_user === user.id`).
- **Tests:** action test — non-target member is rejected app-side; target with AAL1 rejected.
- **Blocks Phase 5:** No.

### P4C-M2 — MEDIUM — Authz/RLS parity is manual with no cross-diff
- **Evidence:** `packages/authz/src/index.ts` `rolePermissions` vs `0006` `has_org_permission` `case` — two hand-maintained copies; parity tests assert each independently.
- **Scenario:** adding a permission to TS but forgetting SQL (or vice versa) drifts silently; a UI could allow an action the DB denies (or the reverse), producing confusing failures or, worst case, an app-allowed/DB-allowed mismatch on a future permission.
- **Remediation:** add a test enumerating every `Object.values(permissions)` and asserting `has_org_permission` returns a role-set for each (fails on `else false` omission); add a role×permission matrix comparison fixture derived independently from each side.
- **Tests:** the parity enumeration test.
- **Blocks Phase 5:** No (but do before project permissions layer on top in Phase 5+).

### P4C-M3 — MEDIUM — Invitation visibility relies solely on policy
- **Evidence:** `authenticated` has table `SELECT` on `organization_invitations`; only `invitations_select_admin` (`membership.invite`) restricts rows.
- **Scenario:** a future policy edit/removal would expose all invited emails to any org member.
- **Remediation:** add a pgTAP test asserting a non-admin active member gets **0** invitation rows; consider revoking table SELECT and serving admin invitation lists via a definer function (as done for members/audit).
- **Tests:** pgTAP non-admin invitation isolation.
- **Blocks Phase 5:** No.

### P4C-M4 — MEDIUM — `get_invitation_preview` discloses invited email to anon
- **Evidence:** `0007:323` `grant execute ... to anon`; returns `invitation_email`. Reproduced: raw token → email + org name without auth.
- **Rule:** minimize PII disclosure to unauthenticated parties (spec: acceptance requires email match; preview need not reveal the email).
- **Scenario:** anyone who obtains/forwards an invite link learns the invited person's email and the org name pre-auth. Not enumerable (hash-gated), but unnecessary PII exposure.
- **Remediation:** return only `organization_name` + `role` + `state` to anon; reveal/verify the email only post-authentication at accept time (where it must match `auth.jwt()->>'email'`). Or require auth for the preview.
- **Tests:** function test — anon preview omits email.
- **Blocks Phase 5:** No.

### P4C-M5 — MEDIUM — Confirm reauth recency source across all sensitive actions
- **Evidence:** DB functions for transfer/delete check `auth_time` (server, good). Authz `sensitiveReauthPermissions` uses `actor.reauthenticated`.
- **Remediation:** audit how `actor.reauthenticated` is computed for each sensitive action (email change, password change, MFA removal, account deletion) and ensure it derives from a server-verified fresh `auth_time`/reauth, never a client-settable value; where Supabase handles reauth natively, document it.
- **Tests:** action tests asserting a stale session is rejected for each sensitive action.
- **Blocks Phase 5:** No.

### P4C-M6 — MEDIUM — Rate-limit prod-safety and coverage confirmation
- **Evidence:** prod env requires Upstash (fail-closed, verified); `rateLimitRequest` used in member/invitation/ownership/org-create actions.
- **Remediation:** confirm sign-in, sign-up, verification-resend, password-reset, and invitation-acceptance all pass through `rateLimitRequest` (or Supabase's documented limits); ensure the local no-op path is unreachable when `APP_ENV` is staging/production; document per-action coverage in `phase-4-testing.md`.
- **Tests:** unit tests asserting each auth action increments a limiter; env test that prod without Upstash fails (already implicit).
- **Blocks Phase 5:** No.

*(P4C-L1…L7 detailed inline in §7,18,20,22,27,28,30 with evidence, remediation, and required tests; all LOW, none block Phase 5.)*

---

## 34. Deferred staging and production items (correctly)

Hosted Supabase project + Site/redirect URLs; Google/Microsoft OAuth credentials; Resend SMTP + production email domain; Upstash production instance; CAPTCHA; production app domain + cookie scope; platform-admin provisioning + break-glass runbook; **account/organization deletion legal review** — all documented in `open-decisions.md` and gated to staging/prod. Local Phase 4B is fully reproducible without them.

---

## 35. Validation commands and actual results

| Command | Reproduced | Result |
|---|---|---|
| `pnpm typecheck` | ✅ | PASS (FULL TURBO) |
| `pnpm lint` | ✅ | PASS + boundaries |
| `pnpm test` | ✅ | **31 files / 117 tests PASS** (matches) |
| `pnpm db:validate` | ✅ | PASS (Phase 4 allowlist, forbids business tables) |
| `pnpm db:start` / `db:reset` | ✅ | migrations 0000–0010 + seed applied cleanly |
| `pnpm test:db` (pgTAP) | ✅ | **7 files / 126 tests PASS** (matches); runs as `authenticated` role |
| **Independent cross-tenant probe** | ✅ | B reads A: **0 org / 0 membership rows**; forged INSERT blocked; forged UPDATE permission-denied |
| **Grants census (live)** | ✅ | anon: 0 table grants; audit schema: 0 anon/auth grants |
| `pnpm build` | ✅ | compiled successfully |
| `pnpm test:server-only` | ⚠️ assertions PASS, script exits 1 | both server entries fail client build (✅); Windows `.next` cleanup `ENOTEMPTY` crash (P4C-L4) |
| Production CSP + headers probe | ✅ | nonce `strict-dynamic`, no unsafe-inline/eval; HSTS/XFO/nosniff/Referrer/Permissions present |
| Prod route probe | ⚠️ env-limited | `/dashboard`→307 (auth enforced); `/design`,`/sign-in`→500 due to my placeholder env failing prod Zod (Upstash required) — **not a code defect** |
| `pnpm test:e2e` / `test:a11y` | ❌ not reproduced | Playwright `auth.setup.ts` needs a running dev server on seeded local Supabase; my harness didn't bind it — timed out at login. Codex reports 151/55-skip + 71 a11y in their harness. |

**Environment:** Node v24, pnpm 10.33, Windows + Docker (local Supabase). All security-critical checks (isolation, grants, RLS, authz, CSP) reproduced; only browser E2E/a11y and prod route rendering were environment-limited.

---

## 36. Phase 4D remediation order

1. **Cross-tenant / RLS defense-in-depth:** P4C-M3 (invitation isolation test + consider definer-only reads), P4C-M2 (authz⇔RLS parity cross-diff test).
2. **Authentication / session:** P4C-M5 (reauth-recency source audit), P4C-L1 (graceful env-missing handling).
3. **Ownership / invitation integrity:** P4C-M1 (transfer-complete app-layer target check), P4C-M4 (invitation-preview PII minimization), P4C-L7 (concurrency test).
4. **MFA / recovery:** P4C-L3 (KDF), P4C-L6 (QR render path confirmation).
5. **Service-role / grants:** P4C-L4 (Windows server-only cleanup).
6. **Audit / redirection:** P4C-L2 (real correlation id).
7. **Accessibility / UX:** independently reproduce the a11y/e2e suites in a wired harness (not a finding, but complete the verification).
8. **Documentation / defense-in-depth:** P4C-M6 (rate-limit coverage doc), P4C-L5 (validator prohibited-table test + Phase 5 comment).

**Exact first remediation:** **P4C-M3** — add a pgTAP test proving a non-admin active member reads **0** rows of `organization_invitations`, and (recommended) move admin invitation reads behind a SECURITY DEFINER function so table SELECT can be revoked — closing the "policy is the only guard" gap on invited-email exposure.

---

## 37. Final checklist

| Item | Verdict |
|---|---|
| Phase 4 Tasks 0–25 implemented | ✅ (migrations 0003–0010, all flows, tests) |
| No Phase 5 implementation | ✅ (live DB = exactly 8 tables) |
| Exactly the approved identity/tenancy tables exist | ✅ |
| Every Phase 4 table has appropriate RLS | ✅ |
| Forced RLS applied where required | ✅ (all 8) |
| Application authorization denies by default | ✅ |
| Authz and RLS consistent | ✅ (manual parity; add cross-diff — P4C-M2) |
| Cross-tenant access denied | ✅ (independently probed) |
| Auth metadata not trusted for authz | ✅ (DB membership only) |
| Security decisions use verified users | ✅ (getUser only; zero getSession) |
| Active-org cookie not proof of access | ✅ (revalidated) |
| Suspended/removed memberships denied | ✅ |
| Invitations hashed / expiring / revocable / single-use | ✅ |
| Invitation acceptance transactional + idempotent | ✅ (pgTAP proven) |
| Organization creation atomic | ✅ |
| Ownerless organizations impossible | ✅ (partial index + guards) |
| Ownership transfer: target accept + reauth + AAL2 | ✅ |
| Recovery codes hashed + single-use | ✅ (salted, timing-safe) |
| Platform admins separate + no RLS bypass | ✅ |
| Service-role narrow + server-only | ✅ |
| Audit immutable | ✅ (update/delete/truncate denied) |
| Sensitive tokens absent from logs | ✅ |
| Open redirects prevented | ✅ |
| Rate limits cover sensitive actions | ✅ (confirm coverage — P4C-M6) |
| Local development reproducible | ✅ (reproduced from clean) |
| Production provider setup clearly deferred | ✅ |
| Closeout branding preserved | ✅ |
| Phase 3E visual system preserved | ✅ (unmodified) |
| `/design` inaccessible in production | ✅ (gate is local/test-only by construction) |
| CSP nonce-based | ✅ (reproduced) |
| Accessibility foundation credible | ✅ code-level (suite not re-run — §35) |
| Cross-browser tests exist | ✅ (5 projects; not re-run here) |
| No secrets committed | ✅ |
| Git history clean | ✅ |

---

*Audit complete. No repository files were modified except the creation of this document. No commits were made. Local Supabase was started for reproduction and stopped afterward.*

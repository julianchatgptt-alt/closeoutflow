# FILE: /docs/auth/audit-events.md

> **Document status:** Phase 4A specification — the identity & organization audit catalog. **Specification only.**
> **Grounding:** events are written via the existing service-role-only `public.write_audit_event(...)` RPC into the immutable `audit.audit_events` table (append-only; update/delete/truncate blocked; off PostgREST). Fields: `organization_id`, `actor_type` ∈ {`internal_user`,`external_grant`,`platform_admin`,`system`}, `actor_id`, `project_id`(null in Phase 4), `target_type`, `target_id`, `action`, `before`/`after` jsonb, `request_id`, `session_id`, `ip`, `user_agent`, `source` ∈ {`web`,`worker`,`api`}, `metadata`.
> **Related:** [permissions-and-rls.md](./permissions-and-rls.md), [phase-4-data-model.md](./phase-4-data-model.md), [account-security-and-lifecycle.md](./account-security-and-lifecycle.md).

---

## 1. Principles

- **Audit ≠ logs ≠ analytics ≠ user_security_events.** `audit.audit_events` is the **immutable legal record**; `user_security_events` is a user-facing convenience log; pino logs are operational; PostHog is product analytics. A sensitive action may write to several, but the legal record is the audit table.
- **Actor:** `actor_id` = `auth.uid()` for user actions; `platform_admin` for staff; `system` for automated (e.g., invitation expiry sweep). `actor_type` set accordingly. **No AI approval events exist** (unchanged principle).
- **Redaction:** `before`/`after`/`metadata` store only what's needed for traceability — **never** passwords, tokens (invitation/reset/session), MFA secrets, recovery codes, or full PII dumps. Email may be stored for identity actions; invitation events store `email` + `role` but **never the token or its hash beyond an opaque invitation id**.
- **Blocking vs non-blocking:** for **sensitive, state-changing** actions the audit write is **inside the transaction** — if it fails, the action **rolls back** (blocking). For **high-volume, low-severity** signals (successful sign-in, failed-login) the audit is **best-effort** (failure logged, action not blocked) to avoid a self-inflicted DoS; security-critical failures (repeated) still surface via monitoring.
- **Severity:** `info` (routine), `notice` (sensitive/admin), `warning` (security-relevant failure), `critical` (ownership/deletion/platform/break-glass).
- **Retention:** all identity/org audit events retained long-term (legal); partition-by-month later.

---

## 2. Catalog

Columns: **Event id** · **Trigger** · **Actor** · **Org ctx** · **Target** · **Required metadata** · **Prohibited metadata** · **Severity** · **Blocks?** · **User notification**.

### Authentication
| Event | Trigger | Actor | Org | Target | Required meta | Prohibited | Sev | Blocks | Notify |
|-------|---------|-------|-----|--------|---------------|-----------|-----|:------:|--------|
| `auth.registered` | account created | internal_user (self) | — | user | method (password/oauth) | password | info | no | verify email |
| `auth.email_verified` | email confirmed | self | — | user | — | — | info | no | — |
| `auth.signed_in` | successful sign-in | self | — | user | method, ip, user_agent | password | info | **no** (best-effort) | new-sign-in (opt) |
| `auth.sign_in_failed` | failed auth (throttled/aggregated) | system/self | — | email-hash | reason(coarse), ip | raw password/email | warning | no | — |
| `auth.signed_out` | sign-out | self | — | user | scope(current/global) | — | info | no | — |
| `auth.password_reset_requested` | reset requested | self/system | — | email-hash | ip | token | notice | no | — |
| `auth.password_changed` | password set/changed | self | — | user | via(reset/settings) | password | notice | **yes** | password-changed |
| `auth.email_changed` | email changed | self | — | user | old_hash,new_hash | full emails? store minimal | notice | yes | both addresses |
| `auth.mfa_enrolled` | TOTP added | self | — | user | factor_type | secret,codes | notice | yes | mfa-changed |
| `auth.mfa_removed` | TOTP removed | self | — | user | — | secret | notice | yes | mfa-changed |
| `auth.session_revoked` | global/other revoke | self | — | user | scope | tokens | notice | no | session-revoked (opt) |

### Profile
| Event | Trigger | Actor | Org | Target | Meta | Prohibited | Sev | Blocks | Notify |
|-------|---------|-------|-----|--------|------|-----------|-----|:------:|--------|
| `profile.updated` | profile change | self | — | user | changed_fields | full PII values (store keys/diff summary) | info | no | — |

### Organizations
| Event | Trigger | Actor | Org | Target | Meta | Prohibited | Sev | Blocks | Notify |
|-------|---------|-------|-----|--------|------|-----------|-----|:------:|--------|
| `organization.created` | org + owner created | self | org | org | display_name, slug | — | notice | **yes** | — |
| `organization.updated` | settings change | Owner/Admin | org | org | changed_fields | — | notice | yes | — |
| `organization.archived` | archive/unarchive | Owner | org | org | new_status | — | notice | yes | members (opt) |
| `organization.suspended` | platform suspend/unsuspend | platform_admin | org | org | reason, new_status | — | critical | **yes** | owner |
| `organization.deletion_requested` | deletion requested | Owner | org | org | grace_until | — | critical | **yes** | members |
| `organization.deletion_cancelled` | cancel within grace | Owner | org | org | — | — | notice | yes | members |
| `organization.deletion_completed` | purge after grace | system | org | org | — | — | critical | yes | — |

### Memberships & invitations
| Event | Trigger | Actor | Org | Target | Meta | Prohibited | Sev | Blocks | Notify |
|-------|---------|-------|-----|--------|------|-----------|-----|:------:|--------|
| `invitation.created` | invite sent | Owner/Admin | org | invitation | email, role, invited_by | token/hash | notice | **yes** | invitee |
| `invitation.resent` | resend | Owner/Admin | org | invitation | email | token | info | yes | invitee |
| `invitation.revoked` | revoke | Owner/Admin | org | invitation | email | token | notice | yes | invitee (opt) |
| `invitation.accepted` | accepted | self (invitee) | org | invitation | role | token | notice | **yes** | inviter/admins |
| `invitation.expired` | TTL sweep | system | org | invitation | — | token | info | no | — |
| `membership.activated` | membership becomes active | system/self | org | membership | role, via(invite/create) | — | notice | **yes** | admins (opt) |
| `membership.role_changed` | role change | Owner/Admin | org | membership | from_role,to_role | — | notice | **yes** | member |
| `membership.suspended` | suspend | Owner/Admin | org | membership | — | — | notice | **yes** | member |
| `membership.reactivated` | reactivate | Owner/Admin | org | membership | — | — | notice | yes | member |
| `membership.removed` | remove | Owner/Admin | org | membership | — | — | notice | **yes** | member |
| `membership.left` | self leave | self | org | membership | — | — | notice | yes | admins (opt) |

### Ownership
| Event | Trigger | Actor | Org | Target | Meta | Prohibited | Sev | Blocks | Notify |
|-------|---------|-------|-----|--------|------|-----------|-----|:------:|--------|
| `ownership_transfer.initiated` | owner initiates | Owner | org | transfer | to_user | — | critical | **yes** | target |
| `ownership_transfer.completed` | target accepts (swap) | self (target) | org | transfer | from_user,to_user | — | critical | **yes** | both + admins |
| `ownership_transfer.declined` | target declines | self | org | transfer | — | — | notice | yes | initiator |
| `ownership_transfer.cancelled` | owner cancels | Owner | org | transfer | — | — | notice | yes | target |
| `ownership_transfer.expired` | TTL | system | org | transfer | — | — | info | no | — |

### Platform / security-sensitive support
| Event | Trigger | Actor | Org | Target | Meta | Prohibited | Sev | Blocks | Notify |
|-------|---------|-------|-----|--------|------|-----------|-----|:------:|--------|
| `platform.user_suspended` | staff suspends user | platform_admin | — | user | reason | — | critical | **yes** | user (opt) |
| `platform.org_suspended` | (alias of organization.suspended) | platform_admin | org | org | reason | — | critical | yes | owner |
| `platform.security_events_viewed` | staff views security data | platform_admin/support | (org?) | scope | reason | — | notice | no | — |
| `platform.break_glass_used` | emergency access/ownership recovery | platform_admin | org | org/user | justification | — | critical | **yes** | founders alert |
| `platform.role_granted`/`revoked` | platform role change | platform_admin | — | user | role | — | critical | yes | — |

---

## 3. Which events block their action

**Block (audit in the same transaction):** all `organization.*`, `membership.*` (state changes), `invitation.created/accepted/resent/revoked`, `ownership_transfer.*` (state changes), `auth.password_changed/email_changed/mfa_*`, `platform.*` sensitive. **Do not block (best-effort):** `auth.signed_in`, `auth.sign_in_failed`, `auth.signed_out`, `auth.session_revoked`, `profile.updated` (low-severity), `*.expired` sweeps, `invitation.resent`(optional block).

*Rationale:* legally/operationally significant mutations must be provably recorded (roll back if not); high-frequency signals must not let an audit outage block sign-in.

## 4. User-facing notification mapping

Events flagged “Notify” dispatch a **security notification** (email/in-app) via the `packages/email`/`packages/notifications` seams — **not** the Phase 10 system. See [invitations-onboarding-and-email.md §6](./invitations-onboarding-and-email.md) for templates. The notification is a **separate** artifact from the audit row.

## 5. Implementation notes

- Server actions/functions call `write_audit_event` (service-role) — or write inside the SECURITY DEFINER transactional function that performs the change (preferred for atomicity). Provide a typed `packages/audit` action map extension (`authActions`, `orgActions`, …) so `action` strings are constants, not literals.
- `request_id` from `packages/observability`; `ip`/`user_agent` from the request (server); `session_id` coarse (never the token).
- **Redaction is enforced at the call site:** helpers accept only whitelisted metadata keys per event; tests assert no token/secret/password ever appears in a written event.

---

*Continue to [phase-4-testing.md](./phase-4-testing.md).*

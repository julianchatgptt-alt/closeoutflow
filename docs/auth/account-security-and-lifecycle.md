# FILE: /docs/auth/account-security-and-lifecycle.md

> **Document status:** Phase 4A specification — account settings, security, lifecycle, edge states, privacy. **Specification only.**
> **Related:** [identity-and-authentication.md](./identity-and-authentication.md), [organizations-and-memberships.md](./organizations-and-memberships.md), [audit-events.md](./audit-events.md), [routes-and-screens.md](./routes-and-screens.md).

---

## 1. Profile & preferences

- **Profile** (`/account/profile`): display name (required), first/last/preferred name, avatar, phone. Server action + `profile.updated` audit + unsaved-changes guard. Avatar image upload may be a **later small slice** (private bucket + signed URL); Phase 4 can ship initials-avatar + a deferred upload ([open-decisions.md](./open-decisions.md)).
- **Preferences** (`/account/preferences`): theme, density, timezone, locale → persisted in `user_preferences`. **Phase 3 continuity:** unauthenticated users keep the `cof-theme`/`cof-density` localStorage behavior; on authentication, DB prefs hydrate and update the local values (no visual regression, no flash — the nonce'd pre-paint init still runs; the server injects the user's stored theme into the initial dataset when known).

## 2. Password changes

- `/account/security`: current password (**reauth**) → new password (policy) → confirm. On success: **revoke other sessions**, write `auth.password_changed` audit + `user_security_events` + notify by email. Failed reauth → generic error, rate-limited.

## 3. Email changes

- Supabase email-change flow: request new email → confirmation to **new** address (and notice to **old**) → `/auth/callback` confirms → email updated. Requires reauth. Audit `auth.email_changed`; notify both addresses. If the user has pending invitations tied to the old email, they are unaffected (invites are org+email scoped; a new invite would target the new email).

## 4. MFA (TOTP)

- Enroll: QR + verify → factor active → **recovery codes** shown once (hashed at rest). Challenge on sign-in when enrolled. Remove: reauth + confirm. Reauth for sensitive actions requires AAL2 when enrolled. Mandatory for platform admins + ownership transfer. Lost factor → recovery codes → support break-glass (identity-verified, audited). **No insecure self-service MFA reset.** Audit `auth.mfa_enrolled` / `auth.mfa_removed`.

## 5. Sessions & revocation

- Current session visible; **“sign out of all other devices”** (global revoke) always available. Rich per-device listing is best-effort (`user_session_metadata`, optional). Suspension/removal triggers best-effort session revocation; DB access is denied immediately by RLS regardless. Password change revokes other sessions. Audit `auth.session_revoked`.

## 6. Security alerts (user-facing; distinct from immutable audit)

Emails/in-app for: new sign-in (optional/config), password changed, email changed, MFA changed, session revoked, invitation accepted, role changed, membership suspended, ownership transferred. Sent via the `packages/email`/`packages/notifications` seams (not the Phase 10 system). Recorded in `user_security_events`; the security-relevant subset **also** writes immutable audit.

## 7. Account suspension

- **User suspension** (`account_status='suspended'`): platform-admin action (abuse/security). Blocks sign-in/data access (RLS + server); sessions revoked (best-effort). Reversible. Audit `platform.user_suspended`. Distinct from **membership** suspension (org-scoped).

## 8. Account deletion (privacy)

- **Flow:** `/account/security` → “Delete account” → reauth + MFA + typed confirm → **request** (`account_status='deleted'` pending, `deleted_at` set) → **grace period (default 30 days)** → purge/anonymize.
- **Owned organizations:** the user **must transfer ownership or delete** each owned org before account deletion completes (blocked otherwise — prevents ownerless orgs). Surface the list of blockers.
- **On completion:** memberships → `removed(account_deleted)`; `user_profiles` **anonymized** (name/email/phone/avatar cleared or tombstoned) but **row retained** so audit/history references resolve; `user_preferences` deleted; sessions revoked; OAuth identities unlinked; Supabase auth user deleted/banned.
- **Audit retention:** `audit.audit_events` referencing the user are **retained** (legal); they reference the anonymized id. **Immediate vs delayed:** delayed (grace) by default; immediate hard-delete only via support with legal basis.
- **Email reuse:** after deletion, the email may be reused for a **new** account (new `auth.users` id); prior audit stays under the old id.
- **Data export readiness:** a user/organization export capability is **reserved** (a later job) — Phase 4 stores data in exportable, structured tables.
- **Legal-review items (flagged):** retention periods, anonymization vs. erasure obligations (GDPR/CCPA), audit-retention minimums, breach-notification timelines, cross-border data. **Attorney review required** before production deletion goes live.

## 9. Organization deletion (recap)

Owner-only; reauth+MFA+typed confirm; grace → purge; audit retained; members notified; owner-portal/export continuity is a later concern (no portals yet). See [organizations-and-memberships.md §1](./organizations-and-memberships.md).

## 10. Audit retention

Immutable `audit.audit_events` retained long-term (never below legal minimums; partition-by-month later). `user_security_events` retained per policy (user-facing, prunable). Deletion/anonymization never removes audit rows.

## 11. Privacy considerations

Collect minimal PII (name, email, optional phone). No PII/tokens in URLs, logs, or analytics (pino redaction; NFR-PRIV-002). Preferences are user-scoped. Cross-org name visibility requires shared **active** membership. Support access is audited; platform admins have no blanket data access.

## 12. Incident & edge-state scenarios (UX + behavior)

| Scenario | Behavior |
|----------|----------|
| Invalid credentials | Generic inline “Email or password is incorrect”; rate-limited; no user existence leak. |
| Unverified email | Route to `/verify-email`; resend (rate-limited). |
| Expired reset link | “This link has expired — request a new one.” |
| Expired/revoked/accepted invitation | Generic “no longer valid — ask an admin to resend.” |
| Invitation email mismatch | “This invitation is for another email; sign out to accept.” |
| Organization suspended | Members see suspended banner; mutations denied; owner sees appeal path (later). |
| Membership suspended | “Your access to {Org} is suspended”; can switch orgs; contact admin. |
| User removed from org | Removed from switcher; if last org → onboarding/no-org. |
| Owner transfer pending | Owner can’t leave/delete until resolved; target sees accept CTA. |
| No organizations | `/onboarding` create/join. |
| Last owner attempts to leave/delete self | Blocked: “Transfer ownership first.” |
| OAuth account conflict | “An account already exists for this email — sign in with your original method.” No silent merge. |
| Deleted/banned auth account | Sign-in fails generically; app records anonymized. |
| Stale cookies / invalid active-org | Server re-validates; drop cookie; `/select-organization`; **never grants access**. |
| Network interruption | Actions are idempotent where possible; retry-safe; optimistic UI reconciles; no partial membership. |
| DB rejection / RLS denial | Generic “You don’t have permission” (`PermissionDenied`); details logged server-side only. |
| Rate limit | “Too many attempts, try again later.” |
| Repeated reset requests | Throttled; generic success each time. |
| Open-redirect attempt (`next=//evil`) | Rejected; fall back to `/dashboard`. |
| Session expired mid-sensitive-action | Reauth prompt; action re-verified; no partial state committed. |

---

*Continue to [audit-events.md](./audit-events.md).*

# FILE: /docs/auth/routes-and-screens.md

> **Document status:** Phase 4A specification — routes, screens, protected-route architecture, error states. **Reuse the Phase 3 design system; do not redesign the product.**
> **Related:** [identity-and-authentication.md](./identity-and-authentication.md), [organizations-and-memberships.md](./organizations-and-memberships.md), [invitations-onboarding-and-email.md](./invitations-onboarding-and-email.md); Phase 3 [application-shell.md](../design/application-shell.md), [navigation-and-routes.md](../design/navigation-and-routes.md), [patterns.md](../design/patterns.md), [accessibility-and-responsive.md](../design/accessibility-and-responsive.md), [components.md](../design/components.md).
> **Branding:** visible **Closeout**; metadata via the Phase 3D root `title.template` (`%s · Closeout`), so each page sets only its page name. Domain `closeoutflow.com`.
> **Reuse (Phase 3 components):** `AppShell`, `PageHeader`, `Card`, `Field`/`Input`/`Select`/`Checkbox`/`Switch`, `Button`/`IconButton`, `Alert`/`Banner`, `Dialog`/`AlertDialog`/`Sheet`, `DropdownMenu`, `Toast`, `EmptyState`/`ErrorState`/`PermissionDenied`, `DataTable`, `StatusBadge`, `Avatar`, `Skeleton`. Forms use `react-hook-form` + `zod` per [patterns.md §forms](../design/patterns.md).

---

## 1. Route map

### Public authentication (no session; a public layout, not `(app)`)
| Route | Purpose |
|-------|---------|
| `/sign-in` | Email+password + OAuth buttons; link to reset/sign-up. |
| `/sign-up` | Register (email+password) + OAuth; email prefilled+locked when arriving from an invite. |
| `/verify-email` | Post-sign-up state; resend; change email; sign out. |
| `/forgot-password` | Request reset (email). |
| `/reset-password` | Set new password (requires recovery session). |
| `/auth/callback` | **Route Handler** — PKCE exchange for OAuth/verify/recovery/email-change; allowlisted redirect. |
| `/invite/[token]` | Resolve invitation; route to sign-in/sign-up/accept. |

### Authenticated account (session required; org **not** required)
| Route | Purpose |
|-------|---------|
| `/account/profile` | Name, preferred name, avatar, phone. |
| `/account/security` | Password change, MFA enroll/remove, recovery codes, security-event list, sign out everywhere. |
| `/account/sessions` | Current session + “sign out of all other devices” (+ best-effort recent activity). |
| `/account/preferences` | Theme, density, timezone, locale (persisted; supersedes Phase 3 localStorage). |

### Onboarding / org selection (session required)
| Route | Purpose |
|-------|---------|
| `/onboarding` | Guided: complete profile → create org or accept invite. |
| `/select-organization` | Choose among memberships + pending invites (multi-org / no active org). |

### Organization settings (session + **active org** required; reuse Phase 3 `/settings`)
| Route | Purpose |
|-------|---------|
| `/settings/organization` (= Phase 3 `/settings/general`, now real) | Org display name, slug, timezone, locale; archive/delete (Owner). |
| `/settings/team` (= Phase 3 `/settings/members` / `/team`) | Member list, roles, statuses; invite/suspend/reactivate/remove/change-role; transfer ownership. |
| `/settings/invitations` | Pending invitations (resend/revoke). *(May be a tab within `/settings/team` — see [open-decisions.md](./open-decisions.md).)* |
| `/settings/roles` | **Reference-only** in Phase 4 (view the fixed role→capability matrix). Custom roles are Enterprise-later; **do not build a role editor now.** |

### Platform admin (separate surface; platform role required)
| Route | Purpose |
|-------|---------|
| `/platform/*` | Out-of-tenant admin surface (suspend org/user, view security events). Minimal in Phase 4; all actions audited + MFA. |

> Phase 3 already ships `/settings/general|members|team`; Phase 4 **wires them to real data** and adds `/account/*`, `/onboarding`, `/select-organization`, the public auth routes, `/auth/callback`, `/invite/[token]`, and a minimal `/platform`.

---

## 2. Route-access decision table

Legend: **Pub** public · **Auth** session required · **Org** active org required · **Plat** platform role. States handled by the guard (§3).

| Route | Access | Unauthenticated | Unverified email | No org | Suspended membership (active org) | Suspended org | MFA challenge pending | Notes |
|-------|--------|-----------------|------------------|--------|-----------------------------------|---------------|----------------------|-------|
| `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email` | Pub | show | show (`/verify-email`) | show | show | show | show | if already authed+verified → `/dashboard` (except `/verify-email`, `/reset-password`) |
| `/auth/callback` | Pub (handler) | process | process | process | process | process | process | allowlisted redirect only |
| `/invite/[token]` | Pub→Auth | prompt sign-in/up | prompt verify | accept flow | n/a | reject (org suspended) | complete MFA first | binds to invite email |
| `/account/*` | Auth | → `/sign-in?next=` | → `/verify-email` | allowed (no org needed) | allowed | allowed | → MFA challenge | account works without an org |
| `/onboarding` | Auth | → `/sign-in` | → `/verify-email` | **primary target** | if only-org suspended → onboarding | → onboarding | → MFA | |
| `/select-organization` | Auth | → `/sign-in` | → `/verify-email` | show (empty → create/join) | list (suspended shown disabled) | list | → MFA | |
| `/settings/*`, `/dashboard`, all `(app)` | Auth+Org | → `/sign-in?next=` | → `/verify-email` | → `/onboarding` | → “access suspended” state | → “organization suspended” state | → MFA challenge | RLS is the real gate |
| `/platform/*` | Plat | → `/sign-in` | → `/verify-email` | n/a | n/a | n/a | **MFA required** | not org-scoped |

**Server-authoritative:** every protected route re-derives this table server-side via `getUser()` + DB membership + `authz`. Middleware (`proxy.ts`) provides only a fast coarse redirect; it is never the sole gate.

---

## 3. Protected-route architecture

- **Public layout** wraps auth routes (no session read beyond “already authed? → dashboard”).
- **`(app)` layout** (server): `getUser()` → require verified email → resolve active org (cookie validated vs memberships) → require active membership → render shell. Missing steps redirect per §2.
- **`/account` layout** (server): `getUser()` + verified email; **no org** required.
- **`/platform` layout** (server): `getUser()` + `is_platform_admin()` + **AAL2**; else 404/redirect (don’t reveal existence to non-admins).
- **Guard states** produce distinct, honest screens: *no-org* → onboarding; *suspended user* → “Your account is suspended” (sign-out only); *suspended membership* → “Your access to {Org} is suspended” (switch org / contact admin); *suspended org* → “{Org} is suspended” banner (read-limited); *email-unverified* → `/verify-email`; *MFA-challenge* → challenge screen. All reuse `Banner`/`EmptyState`/`PermissionDenied`.

---

## 4. Screen specifications (fields, validation, states)

For each screen: **server vs client** noted; validation via zod; loading = `Skeleton`; error = inline `Field` error + page `ErrorState`; empty/success as noted; a11y per [accessibility-and-responsive.md](../design/accessibility-and-responsive.md) (labels, `aria-describedby`, focus-to-first-error, `role="alert"`, 44px targets); responsive per [patterns.md](../design/patterns.md) (single-column mobile, sticky primary action).

**`/sign-in`** — *client form, server action.* Fields: email, password, “remember” (session length), OAuth buttons (Google/Microsoft; hidden/disabled if provider env absent). Validation: email format, required password. States: loading (button), invalid credentials → generic inline alert (“Email or password is incorrect”), unverified → link to `/verify-email`, rate-limited → “Too many attempts.” Success → `next` (allowlisted) or `/dashboard`/onboarding.

**`/sign-up`** — email, password (strength meter, min policy), optional display name, OAuth. Invite arrival: email **prefilled + read-only**. Success → `/verify-email` (or accept flow). Duplicate email → generic “If this email is available…”/“Sign in instead.”

**`/verify-email`** — informational; “Resend” (rate-limited), “Change email,” “Sign out.” Polls/refreshes on confirmation.

**`/forgot-password`** — email; always generic success (“If an account exists, we’ve sent a link”).

**`/reset-password`** — new password + confirm; requires recovery session (else “link expired”); success → sign-in + “password changed” + other sessions revoked.

**`/invite/[token]`** — server resolves token; shows org name + role; routes to sign-in/sign-up/accept; invalid → generic invalid state.

**`/account/profile`** — display name (required), first/last/preferred, avatar (upload placeholder acceptable; real avatar storage is a small private-bucket task — may defer image upload to a later slice, see [open-decisions.md](./open-decisions.md)), phone. Save = server action + `profile.updated` audit; unsaved-changes guard (SPA-safe, per Phase 3C P3C-010).

**`/account/security`** — password change (reauth), MFA enroll (QR + verify) / remove (reauth), recovery codes (view/regenerate, shown once), security-event list (`user_security_events`), “sign out everywhere.” Each sensitive action requires reauth/AAL2; writes audit + `user_security_events` + notification email.

**`/account/sessions`** — current session details + “sign out of all other devices” (global revoke). Best-effort recent activity if `user_session_metadata` adopted.

**`/account/preferences`** — theme, density, timezone, locale. **Persistence:** on save → `user_preferences` (server action) **and** the existing `cof-theme`/`cof-density` localStorage (fast pre-auth path). On authenticated load, DB prefs hydrate and set the cookie/localStorage so Phase 3 behavior is preserved, not broken.

**`/onboarding`** — stepper-style (or simple sequential) : complete profile → create org (name → slug preview) **or** accept a pending invite. Uses `create_organization_with_owner`/`accept_invitation`. Success → `/dashboard`.

**`/select-organization`** — list of active memberships (name, role, `StatusBadge`) + pending invites (accept); empty → create/join CTA. Selecting sets `cof-active-org` (server action) → `/dashboard`.

**`/settings/organization`** — org display name, slug (edit w/ uniqueness check), timezone, locale (Owner/Admin). Owner-only: **Archive** (confirm) and **Delete** (reauth+MFA+typed confirm+grace). Read-only for non-admins (banner).

**`/settings/team`** — `DataTable` of members (Avatar+name, email, role `StatusBadge`/select, status, joined). Toolbar: **Invite member** (Dialog: email + role) [`membership.invite`]. Row actions (permission-gated): change role (owner-guarded), suspend/reactivate, remove; **Transfer ownership** (Owner; reauth+MFA; target picker). Pending invitations section/tab: resend/revoke. All actions → confirm dialog + audit + notification. Empty (only you) → “Invite your team.”

**`/settings/roles`** — reference table of the six roles → capabilities (read-only). No editor.

**`/platform/*`** — minimal admin: org/user suspend (reason + confirm + MFA), security-event viewer. All audited.

---

## 5. Server vs client responsibility (summary)

- **Server:** `getUser()`, active-org resolution, `authz.can()`, all mutations (Server Actions / SECURITY DEFINER functions), audit, redirects/allowlist, rate limiting. Data reads via RLS-scoped client in Server Components.
- **Client:** form UX (RHF+zod), optimistic toasts, theme/density, dialogs. **No** authorization or org-selection trust in the client.

## 6. Metadata & branding

Each route sets `title` = page name (root template appends `· Closeout`); descriptions customer-appropriate; **no “CloseoutFlow”** in any visible/AT-exposed string (per Phase 3D). Public auth pages get proper `<title>`/description; `/platform` is `noindex`.

## 7. Error & edge states (cross-reference)

Full behavior for invalid credentials, unverified email, expired/revoked/mismatched/accepted invitations, suspended org/membership, removed user, pending owner transfer, no orgs, last-owner-leave attempt, OAuth conflict, deleted account, stale cookies, network interruption, DB/RLS denial, rate limit, repeated reset, open-redirect attempt, and session-expiry-during-sensitive-action is specified in [account-security-and-lifecycle.md §incident/edge states](./account-security-and-lifecycle.md) and enforced per the access table (§2). Each renders a clear, non-leaking message using Phase 3 feedback components.

---

*Continue to [account-security-and-lifecycle.md](./account-security-and-lifecycle.md).*

# FILE: /docs/auth/open-decisions.md

> **Document status:** Phase 4A specification — decisions needing **founder or external (legal) validation**. Everything else is decided in the sibling docs. Each item has a professional default Codex can build on. **Local Phase 4B is not blocked by any of these** unless stated.
> **Format:** Decision · Why it matters · Recommended default · Alternatives · Security/UX impact · Deadline · Blocks local 4B? · Blocks staging? · Blocks production?

---

## AOD-1 — Hosted Supabase project, URLs, redirect/site URLs
- **Why:** Real auth cookies, email, OAuth, and redirects require a hosted project with correct Site URL + redirect allowlist.
- **Recommended:** Founder creates a **non-prod (staging) Supabase project first**, then production; set Site URL = `https://app.closeoutflow.com` (prod) / staging URL; add `/auth/callback` to redirect allowlist per env.
- **Alternatives:** local-only until later (blocks staging/prod).
- **Impact:** wrong redirect config → broken OAuth/verify or open-redirect risk (mitigated by app allowlist).
- **Deadline:** before staging. **Local?** No (local Supabase). **Staging?** **Yes.** **Prod?** **Yes.**

## AOD-2 — Google & Microsoft OAuth credentials
- **Why:** Real OAuth sign-in needs provider client id/secret + consent screens + redirect URIs.
- **Recommended:** Founder registers Google Cloud OAuth + Microsoft Entra (Azure) app; provide creds for staging then prod; keep providers **disabled locally** (code + tests use a stub).
- **Alternatives:** email/password-only at launch (defer OAuth) — acceptable if creds slip.
- **Impact:** misconfigured redirect URIs are a common OAuth failure/redirect risk.
- **Deadline:** before OAuth ships to staging. **Local?** No. **Staging?** Yes (for OAuth). **Prod?** Yes (for OAuth).

## AOD-3 — Transactional email (Supabase SMTP → Resend) + production domain
- **Why:** Verify/reset/invitation/security emails must deliver and be branded **Closeout**.
- **Recommended:** Configure Supabase Auth SMTP to **Resend**; verify sending domain `mail.closeoutflow.com` with SPF/DKIM/DMARC; app-sent emails via the Resend adapter. Locally use **Mailpit** (no real sends).
- **Alternatives:** Supabase default email (rate-limited, unbranded) for early staging only.
- **Impact:** poor deliverability blocks sign-up/invites; unbranded email hurts trust.
- **Deadline:** before staging invites/verification. **Local?** No (Mailpit). **Staging?** Yes. **Prod?** Yes.

## AOD-4 — Production application domain & cookie scope
- **Why:** Session cookies, CSP, email links, and redirect allowlist depend on the final domain(s).
- **Recommended:** `app.closeoutflow.com` for the app; marketing on `closeoutflow.com` later. Cookies scoped to the app host; `/platform` `noindex`.
- **Deadline:** before staging cookies/links. **Local?** No. **Staging?** Yes. **Prod?** Yes.

## AOD-5 — MFA policy: optional vs. required; org-level enforcement
- **Why:** Sets the security/UX baseline; `organizations.requires_mfa` is reserved.
- **Recommended:** **MFA optional for members**, **mandatory for platform admins + ownership transfer** (Phase 4). Org-required-MFA **field exists but enforcement ships later**.
- **Alternatives:** require MFA for all owners/admins at launch (more secure, more friction).
- **Impact:** stronger default reduces takeover risk but raises support load.
- **Deadline:** before production launch. **Local?** No. **Staging?** No. **Prod?** recommended decision, not a hard block.

## AOD-6 — CAPTCHA / bot protection on sign-up/sign-in
- **Why:** Abuse/credential-stuffing resistance beyond rate limits.
- **Recommended:** Enable Supabase’s built-in CAPTCHA (hCaptcha/Turnstile) on sign-up + password reset in **production**; skip locally.
- **Alternatives:** rate-limiting only (weaker).
- **Deadline:** before public production. **Local?** No. **Staging?** optional. **Prod?** recommended.

## AOD-7 — Session lifetime & “remember me”
- **Why:** Balances security and convenience.
- **Recommended:** Supabase defaults (access ~1h refresh-rotated; refresh ~30d) with a shorter “this device only” option; reauth for sensitive actions regardless.
- **Deadline:** before production. **Local?** No. **Staging?** No. **Prod?** confirm.

## AOD-8 — Invitation & transfer TTLs
- **Why:** Security vs. usability of links.
- **Recommended:** invitations **14 days**; ownership-transfer acceptance **7 days**; reset/verify per Supabase defaults.
- **Deadline:** before staging invites. **Local?** No (defaults fine). **Staging?** confirm. **Prod?** confirm.

## AOD-9 — `user_session_metadata` (device/session list)
- **Why:** `/account/sessions` richness vs. build cost (Supabase doesn’t expose a native list).
- **Recommended:** **Defer** the table; ship “sign out everywhere” + current session. Add later if demanded.
- **Deadline:** during Task 20. **Local?** No (default = defer). **Staging?** No. **Prod?** No.

## AOD-10 — Avatar image upload timing
- **Why:** Real avatars need a private bucket + signed URLs (small storage slice).
- **Recommended:** Ship **initials avatars** in Phase 4; **defer** image upload to a small follow-up (keeps Phase 4 identity-focused, no public storage).
- **Deadline:** Task 19. **Local?** No. **Staging?** No. **Prod?** No.

## AOD-11 — Account/organization deletion legal policy (**legal review**)
- **Why:** Retention, anonymization vs. erasure (GDPR/CCPA), audit-retention minimums, breach timelines.
- **Recommended:** 30-day grace; anonymize profile + retain audit; document retention schedule. **Attorney review required** before enabling production deletion.
- **Alternatives:** support-only deletion at launch (defer self-service).
- **Impact:** legal exposure if wrong.
- **Deadline:** before production deletion goes live. **Local?** No (build the flow). **Staging?** No. **Prod?** **Yes (legal sign-off).**

## AOD-12 — Platform-admin provisioning & break-glass process
- **Why:** Who are platform admins, how are they granted, and the emergency ownership-recovery procedure.
- **Recommended:** Seed the initial platform admin via migration/secure manual step (not self-service); document a **break-glass runbook** (MFA + justification + audit + founder alert).
- **Deadline:** before staging platform actions. **Local?** No (seed). **Staging?** Yes (real admins). **Prod?** Yes + runbook.

## AOD-13 — `/settings/invitations` as a page vs. a tab in `/settings/team`
- **Why:** Navigation clarity (echoes Phase 3 OD-7 Team/Members consolidation).
- **Recommended:** **Invitations as a tab within `/settings/team`** (single team surface); keep the route as an alias.
- **Deadline:** Task 16. **Local?** No (default). **Staging?** No. **Prod?** No.

---

## Summary
**Nothing blocks local Phase 4B** — every default lets Codex build and test locally (local Supabase + Mailpit + stubbed OAuth + no-op rate limiter). **Founder cloud actions gate staging/production:** Supabase project/URLs (AOD-1), OAuth creds (AOD-2), Resend/email domain (AOD-3), app domain (AOD-4), and (before public prod) MFA/CAPTCHA posture (AOD-5/6) and platform-admin provisioning (AOD-12). **Legal sign-off (AOD-11) gates production account/org deletion only.** All other items have safe defaults.

Phase 4D adds one deployment secret to the existing MFA posture: staging and
production must provide an independently generated 32+ character
`RECOVERY_CODE_PEPPER`. It is used only for versioned recovery-code HMACs, must
not reuse a Supabase/provider secret, and must be stored as a server-only secret.
Local/test use the documented non-production fallback and require no founder
action.

---

*End of Phase 4A specification. Index: [phase-4-overview.md](./phase-4-overview.md).*

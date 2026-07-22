# FILE: /docs/brand/phase-5e-brand-auth-plan.md

> **Document status:** Phase 5E-A — brand & authentication visual-polish plan. **Planning & visual-direction only; no code, migrations, dependencies, or Phase 6.**
> **Public brand:** **Closeout** · **Domain:** `closeoutflow.com` (`app.closeoutflow.com` app host, marketing on the apex later). Internal identifiers (`@closeoutflow/*`, `cof-*`) unchanged.
> **Grounded in the running app:** the current sign-in was reviewed live (desktop/mobile/dark) — a generic centered card on a flat gray field, a `bg-primary` "C" square mark, and **two disabled "(not configured)" OAuth buttons**. This plan fixes exactly that.
> **Depends on:** [design-direction.md](../design/design-direction.md), [design-tokens.md](../design/design-tokens.md), [phase-3e-visual-direction.md](../design/phase-3e-visual-direction.md) (the workspace design system to stay consistent with), [routes-and-screens.md](../auth/routes-and-screens.md), [invitations-onboarding-and-email.md](../auth/invitations-onboarding-and-email.md), [account-security-and-lifecycle.md](../auth/account-security-and-lifecycle.md), [product-requirements.md](../product/product-requirements.md).
> **Doc note:** `/docs/product/design-principles.md` (in the required-reading list) **does not exist**; brand principles are drawn from `design-direction.md`. Flagged for the founder — no blocker.

---

## 1. Executive visual assessment

The authenticated workspace (projects, overview, directories) reads as a **serious, premium construction SaaS** after Phase 3E/5D. The **public authentication surface does not** — it currently reads as a Supabase/shadcn starter: a centered white card on flat gray, a placeholder **"C"-in-a-square** mark (the exact anti-pattern to avoid), disabled OAuth buttons literally labeled "(not configured)", no brand identity, no trust presentation, and no construction-closeout relevance. Because sign-in, invitation acceptance, and onboarding are the **first impression** for every buyer and every invited subcontractor, this gap directly undercuts "worth paying for." Phase 5E replaces the temporary mark with a real, distinctive Closeout brand system and rebuilds the auth/invite/onboarding surfaces to the workspace's quality bar — **without** touching the authenticated workspace beyond dropping in the finalized logo.

**Scope of change:** brand assets (logo system, favicon, PWA, OG, email header) + public auth/invite/onboarding surfaces + metadata/indexing. **Not** in scope: the project-management workspace redesign, any Phase 6 feature, backend/auth logic.

## 2. Current branding problems (observed live)

| # | Problem | Evidence |
|---|---------|----------|
| B1 | **Temporary "C" square mark** — a bold "C" on a `bg-primary` rounded square (`brand.tsx`, `auth-card.tsx`) — the precise "letter in a box" to avoid; no meaning, not distinctive, not ownable. | live sign-in + sidebar |
| B2 | **Disabled OAuth buttons** show "Continue with Google **(not configured)**" / Microsoft — reads as broken/unfinished. | live sign-in (`oauth-buttons.tsx`) |
| B3 | **Bare centered card** on flat `bg-background` — no brand panel, no trust, no closeout relevance; identical to a starter template. | live sign-in desktop/dark |
| B4 | **Empty auth layout** (`(auth)/layout.tsx` returns `children`) — no shared brand shell, so every auth page is a lone card. | code |
| B5 | **Generic favicon/PWA** — placeholder SVGs (`icon-any.svg`/`icon-maskable.svg`); no real mark, no Apple touch icon, no OG image. | `public/icons`, `manifest.ts` |
| B6 | **Thin trust/security messaging** — only a one-line "Secure identity for your Closeout workspace" footnote; no reassurance for a GC entrusting project data. | live sign-in |
| B7 | **No differentiated invitation/onboarding first impression** — reuses the same bare card (a subcontractor's first Closeout experience). | code |
| B8 | **Inconsistent brand color at auth** — the primary tile is fine, but there's no logo-lockup, no wordmark treatment, no dark-mode logo behavior. | live dark sign-in |

## 3. Brand personality

Closeout's brand voice (consistent with `design-direction.md`): **credible · precise · calm · grounded · operational**. The brand should feel like a **meticulous project engineer**, not a consumer app or an AI startup. Adjectives to design toward: *engineered, organized, trustworthy, finished, structured, dependable*. Adjectives to avoid: *playful, flashy, techno-futuristic, cute, generic-SaaS*. The metaphor from the product ("the well-run closeout binder, made live") is the north star for the symbol: **completion, verified handoff, organized documentation**.

## 4. Logo design principles

1. **Meaning over letter.** The mark must communicate *completion / verified handoff / organized closeout*, not merely form a "C." (A subtle C-structure is allowed only if it is intentionally engineered and unlike the current square.)
2. **Recognizable at 16px.** Must survive favicon and the 28px collapsed-sidebar rail — simple silhouette, few elements, strong negative space.
3. **Monochrome-first.** Design in one color; color is applied after. Must work in a single ink (for email, embossing, dark/light).
4. **Engineered geometry.** Precise, gridded construction (consistent stroke, aligned angles) — signals rigor; avoids organic/hand-drawn or random-geometric looks.
5. **Two-theme integrity.** A light-bg and dark-bg version that keep the same silhouette; never rely on a gradient or a photo to read.
6. **Ownable, not derivative.** Must not resemble Procore/Autodesk/Buildertrend or generic checkmark-in-circle SaaS logos; run a similarity gut-check per concept.
7. **Lockup discipline.** Symbol + wordmark in a fixed horizontal lockup with defined clear-space and a symbol-only compact/favicon form.
8. **Construction-credible without cliché.** Evoke documents/handoff/precision — never hard hats, hazard stripes, blueprint-grid wallpaper, or safety-orange washes.

## 5. Three logo-concept directions

> These are **directions for founder selection**, described precisely enough for Codex to render SVG concept sheets in Phase 5E-B. None is finalized here.

### Concept A — "The Sealed Packet" (recommended)
- **Visual idea:** an abstract, gridded **document packet/binder** whose top-right corner is a **completed corner-fold with an embedded checkmark** — a stack of records, sealed and verified.
- **Meaning:** completion + verified readiness + organized documentation + handoff (the finished closeout package).
- **Shape construction:** a rounded-square envelope of records built on a 24-unit grid; two subtle horizontal lines imply stacked documents; the folded corner (upper-right) doubles as a check tick. Single consistent stroke weight; strong internal negative space.
- **Why it fits Closeout:** it *is* the product — the completed, verified closeout package handed to the owner. Distinctive and domain-true without cliché.
- **Small-size behavior:** at 16px the corner-fold+tick + the packet silhouette remain legible (2 shapes); documents lines drop out gracefully via a "simplified favicon" variant.
- **Light/dark:** primary-blue packet on light; on dark, packet in `--foreground`/white with the fold in primary. Monochrome = solid packet + knockout tick.
- **Weaknesses:** the "document stack" lines can muddy at tiny sizes → mandate the simplified favicon variant.
- **Similarity risks:** low; envelope+check exists in email apps, but the *folded-corner-as-tick on a records packet* is specific. Gut-check vs. generic mail icons.
- **Recommendation:** **lead concept** — most meaning, most ownable, most construction-true.

### Concept B — "The Closeout Check" (progress→done)
- **Visual idea:** a **precise checkmark formed from two calibrated segments** where the up-stroke is built as a **rising bar/step** — motion from in-progress to complete.
- **Meaning:** completion + forward movement + verified readiness.
- **Shape construction:** checkmark on a strict 45°/60° grid; the ascending arm is segmented (2–3 steps) implying progress; corners chamfered for an engineered feel. Sits inside an implied square via clear-space, never an actual box.
- **Why it fits Closeout:** "done/verified" is the product's core promise; the stepped up-stroke adds the closeout-progress story.
- **Small-size behavior:** excellent — a check is the most legible mark at 16px.
- **Light/dark:** primary on light; primary or white on dark; monochrome trivially.
- **Weaknesses:** checkmarks are common → the **stepped construction + engineered geometry** must do the differentiation work, or it risks generic.
- **Similarity risks:** medium (checkmark ubiquity) — mitigate with the distinctive stepped arm and precise geometry; gut-check vs. task/approval apps.
- **Recommendation:** strong, safe, favicon-perfect; slightly less distinctive than A.

### Concept C — "The Keystone Fold" (subtle C, intentional)
- **Visual idea:** an **architectural keystone / folded corner** whose two folds create a subtle open **C** aperture with a small verified notch — structure + completion, using a C-form *intentionally* and nothing like the current square.
- **Meaning:** structured project closeout + completion + a quiet nod to the name (C) done as real design.
- **Shape construction:** a solid keystone/chevron with a precise inner fold; the negative space reads as an open C; a single notch/tick marks "verified." Built on a symmetric grid; heavier, more architectural than A/B.
- **Why it fits Closeout:** construction-architectural credibility + a deliberate, ownable C that is a *shape*, not a letter-in-a-box.
- **Small-size behavior:** good if the inner fold is kept bold; the notch may need to drop at 16px.
- **Light/dark:** solid primary on light; solid white/foreground on dark; monochrome strong.
- **Weaknesses:** the "C read" can feel forced if over-refined; keystone can skew corporate/finance.
- **Similarity risks:** medium — abstract folds are common; ensure it doesn't read as a generic fintech chevron; gut-check vs. Autodesk/finance marks.
- **Recommendation:** the "distinctive but riskier" option; good if the founder wants a stronger architectural signal.

**Cross-concept rule:** each concept ships as a **founder concept sheet** (symbol, horizontal lockup, favicon, collapsed-rail, light/dark, monochrome) so the choice is made on real behavior, not a hero render.

## 6. Recommended concept

**Concept A — "The Sealed Packet."** It best expresses the product (a completed, verified closeout package/handoff), is the most ownable and construction-true, and — with the mandated simplified favicon variant — meets the small-size bar. **Fallback: Concept B** if the founder wants maximum small-size safety and neutrality. **This recommendation is advisory; the founder selects at the §22 checkpoint before any global application.**

## 7. Color and typography usage

- **Color:** reuse the existing token system — **engineered blue `--primary` (`216 68% 36%`)** as the logo/brand ink, amber reserved as a semantic accent only (never in the logo), warm-graphite neutrals for surfaces. The logo introduces **no new brand colors**; it uses `--primary` on light and `--foreground`/white on dark. This keeps the mark consistent with the workspace and avoids a second palette.
- **Typography:** wordmark set in **IBM Plex Sans** (the product face) at 600 weight with slight negative tracking (`-0.01em`), optically aligned to the symbol height — so the wordmark and product UI are one system (avoids a "designed logo, generic app" mismatch). Auth headings use the existing `--text-h1`/display scale; trust/legal copy uses `--text-sm`/`--muted-foreground`. No decorative display font.
- **The lockup** locks symbol + "Closeout" wordmark with defined clear-space = 0.5× symbol height; the compact lockup is symbol-only.

## 8. Logo variants and asset matrix

All delivered as **optimized SVG** (source of truth) + generated PNG/ICO where platforms require raster. Naming: `brand/closeout-{variant}-{theme}.svg`.

| Asset | File(s) | Notes |
|-------|---------|-------|
| Primary logo (horizontal lockup) | `closeout-lockup-light.svg`, `-dark.svg` | symbol + wordmark |
| Symbol only | `closeout-symbol-light.svg`, `-dark.svg` | app rail, avatar |
| Wordmark only | `closeout-wordmark-light.svg`, `-dark.svg` | footers |
| Compact lockup | `closeout-lockup-compact-*.svg` | tight headers |
| Monochrome | `closeout-symbol-mono.svg` | email, single-ink |
| Favicon (simplified) | `favicon.svg` + `favicon.ico` (16/32/48) | simplified silhouette |
| Apple touch icon | `apple-touch-icon.png` (180) | rounded-safe padding |
| PWA icons | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | **replace** current placeholder SVGs; maskable safe-zone |
| Email header | `email-logo.png` (2× retina, light-bg) | ≤ 240px wide, mono-safe fallback |
| Social avatar | `avatar-512.png` | symbol centered, safe padding |
| Open Graph | `og-default.png` (1200×630), optional `og-signin.png` | brand + tagline, no fake proof |
| Sidebar (expanded/collapsed) | uses lockup/symbol SVG | replaces `brand.tsx` "C" |

**Accessibility:** every logo instance carries alt text = "Closeout" (lockup) or "Closeout home"/"Closeout dashboard" (linked marks); decorative repeats use `aria-hidden`.

## 9. Authentication layout direction

**Decision: a refined split-screen on desktop, single premium card on mobile.**

- **Desktop (≥ lg):** a **two-panel split** — left panel (≈ 44%) is a **brand/trust panel** (Closeout lockup, one-line positioning, a small restrained set of trust points, subtle engineered background treatment); right panel (≈ 56%) is the **form** on `--surface` with clear hierarchy. This is the commercially credible structure (used by serious B2B SaaS) and gives Closeout room to present identity + trust without cluttering the form.
- **Tablet (md):** split collapses to a **single centered card** with a compact brand header (lockup + one trust line) above the form.
- **Mobile (< md):** **single card**, brand lockup at top, form below, trust line as a short footer — no split (keyboards + small screens demand a focused single column).
- **Background treatment (restrained):** a very subtle engineered texture on the brand panel only — e.g., a faint large-scale document/packet motif or a low-contrast structural pattern at ≤ 4% contrast — **not** a blueprint grid, gradient wash, or photo. The form panel stays clean `--surface`. Dark mode: graphite panel, no glow.
- **Shared auth shell:** replace the empty `(auth)/layout.tsx` with a `PublicAuthLayout` that renders the split + brand panel once, so every auth/invite/onboarding page inherits identity consistently.

Why not a plain centered card (current): it reads as a starter and wastes the first-impression opportunity. Why not a full contextual illustration/photo: risks cheap stock-illustration / generic-SaaS territory and adds weight; the restrained brand panel is more premium and on-brand.

## 10. Sign-in and sign-up specification

- **Structure:** split layout (§9). Left = brand panel; right = `AuthCard` reworked into a headed form (no box-in-box; the form sits directly on the panel surface with clear `h1` + supporting line).
- **Sign-in:** email + password, "Forgot password?" inline, primary "Sign in", "New to Closeout? Create an account". **OAuth:** per §OAuth decision — **hide** unconfigured providers (no "(not configured)"); when enabled, real provider buttons above an "or continue with email" divider. Autocomplete: `email` / `current-password`; password managers supported; `Enter` submits; button shows a premium loading state (spinner + "Signing in…", not a layout shift).
- **Sign-up:** email + password (with a **live strength/requirements** hint, min 12), optional display name; invite arrivals pre-fill + **lock** the email (with a "Invited as {email}" affordance). Primary "Create account"; clear link to sign-in. Success → verify-email.
- **Errors:** inline field errors + a single non-enumerating summary ("Email or password is incorrect"); rate-limit → "Too many attempts, try again shortly." No raw errors.
- **Trust:** the brand panel carries the restrained trust points (§Public trust); the form stays focused.

## 11. Verification and password-reset specification

- **Verify-email (pending):** brand shell + a focused state — "Confirm your email", the address, a **Resend** (rate-limited, with cooldown copy), "Change email", "Sign out". Premium waiting treatment (calm, not a spinner-only). On confirmation → success state → continue to onboarding/workspace.
- **Forgot-password:** email field; **always** generic success ("If an account exists for that email, we've sent a reset link") to resist enumeration.
- **Reset-password:** requires the recovery session; new password + confirm with the strength hint; on success → "Password updated" success state + note that other sessions were signed out + link to sign-in.
- **Expired/invalid reset link:** honest state — "This reset link has expired" + "Request a new link" CTA.
- All four inherit the split brand shell (desktop) / single card (mobile), consistent headings, and the trust footer.

## 12. Invitation acceptance specification

The **most important external first impression** (a subcontractor/teammate's first Closeout screen). It must make the **organization, inviter, and assigned role** understandable without exposing sensitive data.

**Happy path (progression):**
1. **Opened** (`/invite/[token]`) → brand shell + a distinct **invitation card**: "You've been invited to **{Organization}** on Closeout" + inviter ("Invited by {name}") + **assigned role** badge (e.g., "Project Manager") + org context line. No emails/tokens/sensitive data shown beyond what's needed.
2. **Validity confirmed** server-side (existing `get_invitation_preview`) → shows valid state; loading skeleton while resolving.
3. **Identity:** if unauthenticated → "Sign in to accept" **or** "Create your account" (email pre-filled + locked to the invite email); if authenticated with the **matching** email → single "Accept invitation" CTA; if authenticated as a **different** account → clear "This invitation is for {masked email}. Sign out to accept."
4. **Verify email** where required (new accounts) → verify state, then return to accept.
5. **Org + role explained** on the accept screen (org name, role, what it means in one line).
6. **Accept** → transactional (existing `accept_invitation`) → success state.
7. **Active org selected** → the accepted org becomes active.
8. **Enter workspace** → land on that org's dashboard.
9. **First next action** → a short "You're in — here's where to start" moment (e.g., link to Projects / their assigned project).

**Edge states (each a designed, honest screen — not a generic error):**
- **Expired / revoked / already-accepted:** "This invitation is no longer valid — ask an admin to resend," with a calm illustration-free treatment.
- **Wrong account:** as (3) above; offer sign-out.
- **Suspended organization:** "This organization isn't accepting invitations right now."
- **Permission/other error:** generic, blameless, with retry.
- **Loading/retry:** skeleton + retry affordance; never a raw failure.

**Privacy:** show org display name + inviter display name + role; **never** the invite token, other members' data, or the raw invited email beyond a masked confirmation.

## 13. Onboarding specification

For a user with a verified account and **no organization** (or arriving fresh):
1. **Welcome / brand moment** (brief, in the brand shell).
2. **Complete basic profile** (display name) — one step, minimal.
3. **Create an organization OR accept a pending invitation** (if invites exist, surface them here; else "Create your organization" with name-only).
4. **Land in the workspace** with a clear first action ("Create your first project" / go to an assigned project).

- **Not a locked wizard:** a short, resumable, skippable progression (derived from real state, per the existing onboarding model) — never a dead-end.
- **Org creation** reuses the fast, name-only pattern from the workspace (consistency).
- **Org selection** (`/select-organization`) gets the brand shell + a clean list of memberships + pending invites, premium empty state ("Create or join an organization").
- Mobile: single column, sticky primary action; the same brand header.

## 14. MFA and recovery-code specification

- **MFA setup** (`/account/security` + challenge): the **QR code** presented in a clean framed panel (`--surface-sunken`) with the manual secret as selectable mono text; a clear "Scan with your authenticator" instruction; verify field; premium success on enrollment. Challenge screen: focused code entry, brand shell, "Use a recovery code" link.
- **Recovery codes:** presented **once**, in a clearly-framed, high-legibility mono grid; a strong "Save these now" instruction; **Copy** and **Download (.txt)** affordances; explicit "shown once" warning; a confirm checkbox "I've saved my recovery codes" before dismissal. Accessible: codes are real text (selectable, SR-readable), the QR carries `alt` describing the manual-entry fallback.
- **Copy discipline:** never log/echo codes or the TOTP secret; the plan reiterates the existing security rule (codes are display-once, hashed at rest).
- These surfaces adopt the brand shell for consistency but stay inside the authenticated `/account` area (not public).

## 15. Loading, success, empty, and error states

Reuse Phase 3E patterns, elevated for the auth context:
- **Loading:** button-level spinners with label swap ("Sign in" → "Signing in…"); page-level skeletons for invite-preview resolution; **no layout shift**; reduced-motion → static.
- **Success:** a calm, branded success state (checkmark in `--success` + one line + next action) for verify/reset/accept — not just a redirect.
- **Empty:** org-selection empty ("Create or join an organization"); invite-none states honest.
- **Error:** inline field errors + one non-enumerating summary; page-level honest states for expired/revoked/wrong-account; permission-denied calm ("ask an admin"); all mapped, never raw. Rate-limit messaging generic.

## 16. Mobile and responsive behavior

- **< md:** single-column card, brand lockup top, form, trust footer; sticky primary action above the keyboard; 44px targets; inputs use correct `inputmode`/`autocomplete` so mobile keyboards behave (email keyboard, password managers). Split-screen brand panel **collapses to a compact header** (no wasted vertical space).
- **md:** centered single card with compact brand header.
- **≥ lg:** full split (brand panel + form).
- Long org/inviter names on the invite screen truncate with tooltip/wrap; long emails wrap. Safe-area padding at the bottom. Verified at Pixel 7 + iPhone 15.

## 17. Light and dark behavior

- **Light:** brand panel on a subtle tinted-graphite surface; form on white `--surface`; logo in `--primary`.
- **Dark:** brand panel on deep graphite (Phase 3E dark surfaces), no glow; form on dark `--surface`; logo swaps to the **dark variant** (white/foreground silhouette, primary accent). The theme init (nonce'd pre-paint) already applies before render → **no flash** on auth pages too.
- The background texture (if used) is ≤ 4% contrast in both themes so it never competes with the form. Both themes verified against AA.

## 18. Accessibility requirements

- WCAG 2.2 AA throughout: labelled inputs + `aria-describedby` + focus-to-first-error + `role="alert"` summaries; visible focus rings; dialog/state focus management; 44px targets; reduced-motion honored (no required motion).
- **Logo alt text:** lockups = "Closeout"; linked marks = descriptive ("Closeout home"); decorative background = `aria-hidden`.
- **QR code:** `alt` describing the manual-entry alternative; recovery codes as real selectable text (not an image).
- **OAuth:** if hidden when unconfigured, no empty/ghost controls announced; when shown, real buttons with accessible names.
- **Color-independence:** success/error convey via icon + text, not color alone.
- **Keyboard:** full tab order, `Enter` submit, escape on any overlay; password-manager compatibility (`autocomplete` tokens correct).
- axe (light + dark) on every auth/invite/onboarding surface + manual keyboard/SR pass.

## 19. Email-branding requirements

- Every transactional email (verify, reset, invitation, invitation-reminder, email-changed, password-changed, MFA-changed, ownership-transfer, membership changes, security alerts — per Phase 4) gets a **Closeout-branded header** (`email-logo.png`, ≤ 240px, mono-safe) + a consistent footer ("Closeout · construction closeout software" + a support/`closeoutflow.com` link).
- Constraints (reaffirmed): **plain-text alternative** always; accessible HTML; **no tokens/secrets/PII** in the body beyond the one-time action link; single clear CTA; expiration copy; **Closeout** in all visible copy (never "CloseoutFlow"); prod links to `closeoutflow.com`, local → Mailpit.
- The email logo must render on light email clients and degrade to the monochrome mark; no reliance on dark-mode email support.
- **Founder/provider dependency:** production email domain + Resend/SMTP remains founder-owned (Phase 4 AOD-3) — Phase 5E only supplies the branded template assets, not the sending config.

## 20. Favicon, PWA, and social-asset requirements

- **Favicon:** `favicon.svg` (simplified mark) + `favicon.ico` (16/32/48) — replace placeholders; must read at 16px.
- **PWA (`manifest.ts`):** replace the two placeholder SVG icons with `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (maskable safe-zone respected); keep `name`/`short_name` = "Closeout"; set `theme_color`/`background_color` to the brand surfaces (light + a dark media entry if supported). Apple touch icon (180) added.
- **Open Graph / social:** `og-default.png` (1200×630) with the Closeout lockup + the one-line descriptor ("Construction closeout software") on a brand surface — **no fabricated logos/stats/testimonials**. Optional `og-signin.png`. Twitter/`summary_large_image` card metadata references it.
- All raster assets generated from the SVG source; naming per §8; committed under `apps/web/public/` (icons) and a `brand/` source folder.

## 21. Metadata and SEO-readiness requirements

This is **not** the marketing-SEO phase; it establishes a clean brand/metadata foundation and correct indexing.

- **Canonical naming:** site/app/OG name = **Closeout**; description = "Construction closeout software" (+ a one-line expansion); consistent `%s · Closeout` title template (already in place) extended to auth/invite pages.
- **Metadata scaffold:** add `metadataBase = https://closeoutflow.com`, `applicationName: "Closeout"`, `openGraph` (siteName "Closeout", default OG image), Twitter card. (Some of this was flagged in earlier audits as missing.)
- **Indexing (robots) — decisions:**

  | Surface | Directive |
  |---------|-----------|
  | Sign-in, sign-up, forgot/reset-password, verify-email | **`noindex, follow`** (functional, not landing pages) |
  | `/invite/[token]`, `/auth/callback`, `/mfa`, `/reauthenticate`, `/onboarding`, `/select-organization` | **`noindex, nofollow`** (private/tokenized; never indexed) |
  | Authenticated workspace (`(app)/*`, `/account`, `/settings`, `/platform`) | **`noindex`** (behind auth; `/platform` already noindex) |
  | Future public marketing pages (apex `closeoutflow.com`) | **indexable** (built in the dedicated SEO phase) |

- **Structured-data readiness (assets only, not built now):** reserve `Organization` + `WebSite` structured-data requirements (logo URL = the OG/brand asset, name "Closeout", url `https://closeoutflow.com`, sameAs TBD) for the future marketing site — documented in §26.
- **No fake SEO pages, no keyword stuffing.** Authentication routes must **not** become primary SEO landing pages.

## 22. Founder review checkpoint (mandatory — before any global logo application)

Codex **must not** silently pick the final logo. After building the concept gallery + a mocked auth surface with **each** direction, the founder reviews and selects. The checkpoint packet:
- **Three logo directions** (A/B/C) as concept sheets (symbol, lockup, favicon, collapsed-rail, light/dark, monochrome).
- **Sign-in desktop**, **sign-in mobile**, **sign-in dark mode** (with the recommended concept, plus at least the symbol swapped for each alternative).
- **Invitation acceptance** screen.
- **Onboarding** screen.
- **Sidebar expanded** + **sidebar collapsed** (with the mark).
- **Favicon** (16/32) render.
- **Email-header** branding mock.

**Gate:** the founder selects a direction (and may request tweaks) **before** Phase 5E-B Task 3 (final logo assets) and any global application. Everything up to the checkpoint is exploration; nothing downstream ships until the selection is recorded in `docs/brand/logo-decision.md`.

## 23. Codex implementation plan (Phase 5E-B — focused; not an architecture phase)

Eight controlled steps. Static/visual work only; **no backend/auth logic, no migrations, no deps beyond what's already present** (SVG assets are static). Global per-task: light+dark, mobile+desktop, AA, reduced-motion, existing suites stay green, brand-regression test still passes (visible "Closeout", no "CloseoutFlow"), CSP/`/design`-gate untouched.

1. **Brand concept gallery** — render the 3 logo directions (SVG) as concept sheets in the local-only `/design` gallery (or a gated `/design/brand` section): symbol, lockup, favicon, collapsed-rail, light/dark, monochrome. **No global application yet.** *Screenshot: the gallery.* *Founder: no (built for the checkpoint).*
2. **Founder concept selection** — assemble the §22 packet (gallery + auth mockups per direction); **PAUSE for founder selection**; record the choice in `docs/brand/logo-decision.md`. *Founder: **YES — the gate.***
3. **Final logo assets** — produce the full §8 asset matrix (SVG source + generated favicon/PWA/apple/OG/email PNGs) for the **selected** direction; replace `public/icons` placeholders + `manifest.ts` icons; add favicon/OG/apple metadata. *Screenshot: favicon + PWA + OG.* *Founder: soft confirm.*
4. **Authentication redesign** — new `PublicAuthLayout` (split brand panel), rework `AuthCard`/`auth-*` components, **hide unconfigured OAuth** (remove "(not configured)"), rebuild sign-in/sign-up/verify/forgot/reset with the brand shell + trust panel + premium states; drop in the finalized lockup (replace `brand.tsx` "C"). *Screenshots: sign-in desktop/mobile/dark, sign-up, reset, verify.* *Founder: soft.*
5. **Invitation & onboarding redesign** — invitation-acceptance progression + all edge states (§12), onboarding + org-create + select-organization (§13), all in the brand shell. *Screenshots: invite (valid/expired/wrong-account), onboarding, select-organization.* *Founder: soft (first-impression review).*
6. **Email & browser assets** — apply the branded email header/footer to the existing templates (assets only; no sending config), finalize favicon/PWA/OG wiring + metadata scaffold + robots directives (§21). *Screenshots: email header (Mailpit), tab favicon, OG preview.* *Founder: no.*
7. **Responsive & accessibility validation** — axe (light+dark) on every auth/invite/onboarding surface; keyboard/SR pass; mobile-keyboard + safe-area checks at Pixel 7/iPhone 15; brand-regression + CSP/gate regression green. *Founder: no.*
8. **Focused visual review** — assemble the §24 checklist screenshots; exit review (`docs/brand/phase-5e-exit-review.md`); confirm no workspace redesign crept in and no Phase 6 work started. *Founder: **final sign-off.***

## 24. Screenshot review checklist (Phase 5E-B)

Sign-in desktop light · sign-in desktop dark · sign-in mobile · sign-up desktop · sign-up mobile · forgot-password · reset-password (+ expired) · verify-email pending · verify success · invitation valid · invitation expired · invitation wrong-account · onboarding · organization creation · select-organization · MFA setup (QR) · recovery-code presentation · sidebar expanded (new mark) · sidebar collapsed (new mark) · favicon (16/32 in a tab) · PWA install icon · Open Graph preview · email header (Mailpit) · loading state · error state · permission-denied. **Visual review is not optional for completion.**

## 25. Acceptance criteria

- The temporary "C" square is **gone** everywhere visible (sidebar, mobile drawer, auth, favicon, PWA, email); replaced by the founder-selected logo system.
- Auth/invite/onboarding read as a **premium, distinctive, construction-credible commercial product** — not a Supabase/shadcn starter.
- **No disabled "(not configured)" OAuth buttons** — unconfigured providers are hidden (shown only when enabled).
- Invitation acceptance clearly conveys **org + inviter + role** without sensitive-data exposure; every edge state is a designed, honest screen.
- Restrained, **truthful** trust presentation (no fabricated logos/stats/testimonials/certs).
- Favicon/PWA/OG/email assets present, on-brand, and correct at all sizes; robots directives set (auth `noindex`, workspace `noindex`, marketing reserved).
- Light + dark + mobile all premium and AA-accessible; no theme flash; reduced-motion honored.
- The **founder selected the logo** (recorded); Codex did not auto-finalize.
- The authenticated workspace is **unchanged** except the finalized logo; **no Phase 6** work; existing tests + brand-regression + CSP/gate checks green.

## 26. Explicitly deferred marketing-site & SEO work (NOT this phase)

- The **public marketing site** (apex `closeoutflow.com`) — hero, feature/solution pages, pricing, indexable landing pages.
- **Full SEO:** keyword strategy, indexable content, sitemaps, canonical marketing URLs, `Organization`/`WebSite`/`SoftwareApplication` **structured data implementation** (Phase 5E only reserves the asset requirements), rich-result optimization.
- **Real customer social proof** (logos, testimonials, case studies, metrics, certifications) — only when genuinely earned.
- **Brand guidelines site / full design-language doc**, marketing OG variants per page, blog/resource SEO.
- **Provider config** (Resend production domain, OG hosting/CDN) — founder-owned per Phase 4 AOD-3/AOD-4.
- Recommend a dedicated **Marketing-Site & SEO phase** after launch-readiness; this document's §21 metadata scaffold + §8 assets are its inputs.

---

## Appendix — Founder decisions required
1. **Logo direction** (A "Sealed Packet" recommended / B "Closeout Check" / C "Keystone Fold") — the §22 gate. *(Blocks 5E-B Task 3.)*
2. **OAuth-button treatment** — recommend **hide when unconfigured** (vs. "coming soon" label). *(Default: hide; not a blocker.)*
3. **Split-screen vs. centered auth** — recommend **split on desktop / centered on mobile**. *(Default proceeds; soft.)*
4. **Trust points wording** — approve the restrained set (secure workspaces, private project info, controlled access, documented history, construction-closeout focus). *(Default proceeds.)*
5. **Confirm** the missing `docs/product/design-principles.md` is intentional (brand principles sourced from `design-direction.md`). *(Housekeeping; not a blocker.)*

*Everything except the logo selection has a safe default; only the logo choice hard-gates the final application.*

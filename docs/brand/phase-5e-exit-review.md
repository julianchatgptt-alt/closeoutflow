# Phase 5E exit review

> **Decision:** Phase 5E is complete and ready for Phase 6A.  
> **Date:** 2026-07-22.  
> **Founder-selected direction:** Concept C — The Keystone Fold.

## Closeout decision

The founder selected Concept C and clarified the final geometry with the original visual reference, as recorded in [logo-decision.md](./logo-decision.md). The production mark is a compact, filled, faceted C-frame closing around an angular aperture with balanced inward terminal folds. A dedicated compact cut removes the facet overlays, widens the aperture, and shortens the terminals for 16×16 and 32×32 use.

The final system avoids treating the symbol as a block letter C, enclosed token, hexagonal monogram, finance-only chevron, cryptocurrency glyph, or Autodesk-like A. The symbol remains identifiable without the wordmark, works in brand blue, monochrome, and inverse use, and uses a deliberate 14px standard lockup gap and 10px compact gap.

## Implementation result

- Replaced the temporary application-shell C tile with the final horizontal lockup in expanded navigation and the compact symbol in collapsed navigation and mobile surfaces.
- Rebuilt public authentication as a split-screen desktop experience and a centered premium mobile card, with truthful product framing and no fabricated proof, statistics, logos, testimonials, certifications, or security claims.
- Applied the shared branded experience to sign-in, sign-up, forgot/reset password, email verification, invitation, onboarding, organization selection, MFA challenge, and reauthentication routes.
- Hid OAuth controls unless both required provider configuration values are present; no disabled or “not configured” provider is rendered or announced.
- Preserved invitation privacy: public preview output remains masked, organization and role are shown, the inviter is truthfully identified as an organization administrator, and exact email matching remains enforced inside the existing `accept_invitation` database function.
- Improved authenticator enrollment, QR/manual-secret presentation, MFA challenge, and one-time recovery-code presentation without changing secret storage, audit, or authentication behavior.
- Added canonical Closeout metadata, Open Graph/Twitter assets, manifest/PWA icons, explicit robots rules, and route-level `noindex` coverage for auth, invite, onboarding, account, platform, and private application surfaces.
- Added the Closeout email header asset to the existing secure HTML email template while preserving the plain-text alternative and URL validation.

## Final asset matrix

The committed source and generated assets live in `apps/web/public/brand/`:

| Use | Asset |
| --- | --- |
| Primary symbol | `closeout-symbol.svg` |
| Compact/small symbol | `closeout-symbol-compact.svg` |
| Inverse symbol | `closeout-symbol-inverse.svg` |
| Monochrome symbol | `closeout-symbol-monochrome.svg` |
| Horizontal wordmark | `closeout-lockup.svg` |
| Inverse horizontal wordmark | `closeout-lockup-inverse.svg` |
| Browser/Google favicon | `favicon-48.png` plus compact SVG metadata entry |
| 16×16 favicon | `favicon-16.png` |
| 32×32 favicon | `favicon-32.png` |
| Apple touch icon | `apple-touch-icon.png` (180×180) |
| PWA icons | `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| Social avatar | `social-avatar.png` |
| Open Graph | `opengraph.png` (1200×630) |
| Email header | `email-header.png` (320×80) |

`scripts/generate-phase5e-brand-assets.mjs` generates the raster set from the same geometry. Two consecutive generations produced identical SHA-256 hashes for all 16 files in the brand directory.

## Visual evidence

The deterministic capture harness generated 17 images under `C:\Users\julia\.codex\visualizations\2026\07\22\phase-5e-final`.

| Review area | Evidence file |
| --- | --- |
| Final symbol, lockups, variants, favicons, Apple/PWA icons | `final-logo-system.png` |
| Expanded, collapsed, and mobile shell branding | `shell-expanded-collapsed-mobile.png` |
| Desktop light sign-in | `sign-in--desktop--light.png` |
| Desktop dark sign-in | `sign-in--desktop--dark.png` |
| Mobile centered sign-in | `sign-in--mobile.png` |
| Desktop and mobile sign-up | `sign-up--desktop.png`, `sign-up--mobile.png` |
| Forgot password | `forgot-password.png` |
| Expired reset | `reset-password--expired.png` |
| Pending verification | `verify-email--pending.png` |
| Invitation unavailable | `invitation--invalid.png` |
| Sign-in error | `sign-in--error-state.png` |
| Desktop/mobile auth comparison | `auth-experience-comparison.png` |
| Invitation, onboarding, and organization selection | `invitation-onboarding-org-selection.png` |
| MFA and recovery codes | `mfa-recovery-codes.png` |
| Loading, success, error, and permission states | `loading-success-error-permission.png` |
| Email and Open Graph | `email-open-graph-assets.png` |

The browser-assisted visual review found and corrected three issues before closeout: overly letter-like early symbol refinements, insufficient inverse-label contrast, and an invalid comparison between a full authenticated email and the intentionally masked invitation preview. The final mark and all 17 captures were regenerated and reviewed after those corrections.

## Validation results

| Gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; lockfile current |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, including workspace import boundaries |
| `pnpm typecheck` | Passed, 15/15 workspaces |
| `pnpm test` | Passed, 43 files / 177 tests |
| `pnpm test:server-only` | Passed; privileged DB and auth imports fail client builds as required |
| `pnpm build` | Passed, 15/15 workspaces and all application routes |
| `pnpm test:production-probe` | Passed, including unique nonce CSP, security headers, private-route behavior, `/design` production 404, and zero health-request audit writes |
| `pnpm test:logo-review` | Passed, 12/12 desktop/mobile/tablet visual and axe checks |
| Brand asset determinism | Passed, 16/16 files identical across consecutive generations |
| `pnpm capture:phase5e-final` | Passed, 17/17 required captures generated |
| Targeted invitation regression | Passed, 4/4 setup/branding/existing-user/new-user tests |
| `pnpm test:e2e` | Passed, 306 passed / 107 intentional project skips / 0 failed across seven profiles |
| `pnpm test:a11y` | Passed, 133/133 across seven profiles |

The cross-browser matrix covers desktop Chromium, Firefox, WebKit, Pixel 7/mobile Chrome, iPhone 15/mobile Safari, tablet portrait, and tablet landscape. The full run includes CSP nonce behavior, authenticated and unauthenticated flows, invitation acceptance, responsive behavior, light/dark themes, reduced motion, keyboard operation, and brand/metadata regression checks.

## Security and scope confirmation

- Authentication actions, session handling, exact invitation-email enforcement, CSP nonces, rate limiting, and authorization remain intact.
- RLS, tenant isolation, private storage, service-role boundaries, audit immutability, and append-only migration rules were not changed.
- No secret, service-role credential, token, recovery code, TOTP secret, or private email address was added to public output or committed assets.
- Audit remains separate from logs and analytics.
- Public branding is **Closeout** and the canonical domain is `closeoutflow.com`.
- No requirement, document, review, approval, business-domain table, public bucket, integration, billing, AI behavior, Phase 6 feature, or full marketing page was added.
- AI remains suggestion-only; no approval path was introduced.

## Remaining risks and founder action

Formal trademark clearance remains a founder/legal activity before broad commercial registration or paid brand campaigns. Production email-provider/domain configuration and deployment remain founder-owned infrastructure actions. Neither is required for repository validation or Phase 5E technical closeout.

Automated axe and visual regression coverage cannot replace future assistive-technology or customer usability research, but there is no known blocking visual, responsive, accessibility, security, or repository issue in the completed Phase 5E scope.

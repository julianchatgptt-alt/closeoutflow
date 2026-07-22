# Phase 5E-B1 logo concept review

> Status: ready for founder selection. Date: 2026-07-21. Evidence commit: `85545e3`.

Phase 5E-B1 adds a neutral, development-only founder review to `/design`. It does not choose a logo, create final brand assets, replace the temporary application mark, or modify real authentication, invitation, onboarding, database, or Phase 6 behavior.

## Gallery result

The **Closeout Logo Founder Review** section presents all three directions with the same dimensions, IBM Plex wordmark treatment, engineered-blue token, backgrounds, layout, auth specimen, sidebar specimen, favicon sizes, and explanatory structure. Each direction includes:

- symbol, horizontal wordmark, compact lockup, light, dark, and monochrome variants;
- 16×16 and 32×32 favicon reductions, app icon, email header, and social avatar;
- collapsed sidebar, expanded sidebar, and mobile header;
- desktop, mobile, and dark sign-in mockups;
- invitation-acceptance and onboarding headers;
- meaning, strengths, potential weaknesses, small-size assessment, and similarity-risk assessment.

The gallery provides no selection button or persistence path. The real product continues to use the temporary “C” mark until the founder records a decision in a future `logo-decision.md`.

## Concept A — The Sealed Packet

### Implementation

An offset, angular packet outline establishes a record set rather than a single generic page. Two record strata reinforce organized documentation. The upper-right fold contains the completion seal, moving the verification cue out of the center and preventing a generic file-with-check composition. The compact cut removes record lines while retaining the packet, fold, and seal.

### Visual strengths

- Most directly expresses organized records, verified readiness, and final handoff.
- Offset packet layer and edge geometry connect to closeout documentation without using a binder illustration.
- Works naturally with the existing IBM Plex wordmark and restrained blue/graphite palette.
- Monochrome and inverse forms retain the same silhouette.

### Potential weaknesses

- The detailed version has more strokes than the other concepts.
- At 16px, the mark reads as a sealed packet but the record strata necessarily disappear.
- The fold/seal must remain precisely spaced during any final vector refinement.

### Small-size finding

The 32px mark retains the packet, folded seal, and stack relationship. The 16px compact cut remains identifiable, although Concept B is faster at first glance. It passes the current favicon preview without blur or collapse.

### Similarity-risk finding

**Low, subject to formal trademark clearance.** The offset packet and fold-integrated seal do not directly resemble the orange Procore hexagon, Autodesk’s angular A, Buildertrend’s navy/teal signature, or Bluebeam’s current wordmark presentation. Document/completion symbolism exists broadly, so final clearance should assess adjacent document-management products as well as construction software.

## Concept B — The Closeout Check

### Implementation

Four calibrated geometric segments form a rising completion path. The joints make progress visible inside the mark; there is no enclosing circle, square, badge, or decorative baseline. The same silhouette is used at every size.

### Visual strengths

- Fastest recognition and strongest 16px/32px performance.
- Clearly communicates forward motion and completion.
- Extremely reliable in monochrome, inverse, app-icon, and collapsed-sidebar contexts.
- Simple enough for email and low-resolution environments.

### Potential weaknesses

- Checkmarks are common across task, approval, and workflow software.
- If the segmented construction is softened or merged, it will become generic quickly.
- It communicates completion more strongly than organized documentation or construction.

### Small-size finding

Best of the three. The segmented rise remains visible at 32px and resolves as a crisp completion mark at 16px with no secondary detail to lose.

### Similarity-risk finding

**Medium.** The calibrated multi-segment build is distinct from the reviewed construction-company marks, but the base checkmark category is crowded. A final selection would need a broader task/approval-product trademark search and should preserve the exact step rhythm.

## Concept C — The Keystone Fold

### Implementation

A heavy open keystone creates an architectural frame with an intentionally wide aperture. Folded upper and lower terminals create the completion/notch cue; the negative space suggests a C without drawing a literal letter inside a box. The compact cut enlarges the aperture and removes the secondary fold line.

### Visual strengths

- Most structural, distinctive, and ownable silhouette.
- Strong app-icon, social-avatar, and collapsed-sidebar presence.
- Carries a subtle name cue without returning to the temporary C-in-a-square treatment.
- Holds up especially well in monochrome and inverse use.

### Potential weaknesses

- Heavier and more institutional than A or B.
- The architecture cue is abstract rather than documentation-specific.
- Poor downstream spacing could make the aperture read as a literal C or the terminals as arrows.

### Small-size finding

The 32px version is bold and immediately recognizable. The 16px version retains the open aperture and is stronger than A, though slightly less instantly semantic than B.

### Similarity-risk finding

**Medium, subject to formal trademark clearance.** Angular construction marks are common and Autodesk uses a highly engineered angular symbol. This concept’s horizontal open-keystone/C silhouette is not a direct match, but final refinement must avoid becoming a 3D A, finance chevron, or generic hexagonal monogram.

## Current-reference similarity review

A narrow visual gut-check used the current official [Procore presentation](https://www.procore.com/about), [Autodesk logo guidance](https://brand-stg.autodesk.com/brand-elements/autodesk-logo), [Buildertrend brand guidelines](https://buildertrend.com/brand-and-trademark-guidelines/), and [Bluebeam presentation](https://www.bluebeam.com/). No competitor asset was copied or added to the repository. This is design-risk screening, not legal or trademark clearance.

## Accessibility and responsive findings

- Each comparison symbol has one explicit accessible name; repeated decorative SVGs use `aria-hidden` and cannot receive focus.
- Wordmark lockups expose “Closeout” once rather than announcing symbol and text separately.
- Meaning is present in text and geometry, not color alone.
- Engineered blue, foreground, inverse, and fixed-light email treatments passed axe in light and dark.
- The first accessibility run found pale dark-theme text inherited by the fixed-white email mockup. A fixed dark email ink and fixed engineered-blue symbol corrected it; the complete rerun passed.
- Desktop, 834px tablet, and Pixel 7 layouts have no document-level horizontal overflow.
- Reduced-motion emulation is part of deterministic capture; no logo animation exists.

## Screenshot index

All evidence was captured from `/design` at commit `85545e3` with a 1440×1000 Chromium viewport, reduced motion, local/test-only environment, and no production credentials. Files are stored outside Git under:

`C:\Users\julia\.codex\visualizations\2026\07\21\phase-5e-logo-concepts`

| Screenshot identifier | Route/state | Theme | Review purpose | Result |
| --- | --- | --- | --- | --- |
| `logo-comparison--desktop--light` | `/design`, neutral comparison | Light | equal top-level comparison | Passed — reviewed |
| `logo-comparison--desktop--dark` | `/design`, neutral comparison | Dark | equal inverse/dark comparison | Passed — reviewed |
| `concept-a--sealed-packet--detail` | `/design#concept-a` | Light + embedded dark | complete Concept A sheet | Passed — reviewed |
| `concept-b--closeout-check--detail` | `/design#concept-b` | Light + embedded dark | complete Concept B sheet | Passed — reviewed |
| `concept-c--keystone-fold--detail` | `/design#concept-c` | Light + embedded dark | complete Concept C sheet | Passed — reviewed |
| `all-concepts--favicon-previews` | `/design`, favicon board | Light | 16px/32px reduction comparison | Passed — reviewed |
| `all-concepts--sidebar-previews` | `/design`, sidebar board | Light | collapsed/expanded comparison | Passed — reviewed |
| `all-concepts--desktop-auth-previews` | `/design`, desktop auth board | Light | equal split-screen sign-in comparison | Passed — reviewed |
| `all-concepts--mobile-auth-previews` | `/design`, mobile auth board | Light | equal mobile sign-in comparison | Passed — reviewed |
| `all-concepts--invitation-onboarding-previews` | `/design`, journey board | Light | equal invitation/onboarding comparison | Passed — reviewed |

## Files changed

- `apps/web/components/gallery/logo-founder-review.tsx`
- `apps/web/components/gallery/logo-founder-review.test.tsx`
- `apps/web/components/gallery/design-gallery.tsx`
- `apps/web/e2e/logo-review.spec.ts`
- `playwright.logo-review.config.ts`
- `playwright.logo-review.capture.config.ts`
- `scripts/run-logo-review.mjs`
- `scripts/phase-5e-logo.capture.spec.ts`
- `package.json`
- `docs/brand/phase-5e-brand-auth-plan.md` — founder-authored input, preserved byte-for-byte
- `docs/brand/phase-5e-logo-concept-review.md`

## Validation results

| Command/check | Result |
| --- | --- |
| `pnpm format:check` | Passed |
| `pnpm lint` | Passed, including workspace boundaries |
| `pnpm typecheck` | Passed, 15/15 packages |
| `pnpm test` | Passed, 41 files / 174 tests |
| Focused component test | Passed, 2/2 |
| `pnpm build` | Passed, 15/15 packages |
| `pnpm test:logo-review` | Passed, 6/6 across desktop, tablet, and mobile; light/dark axe included |
| `pnpm capture:phase5e-logo` | Passed, 1/1 capture test and 10 reviewed screenshots |
| `pnpm test:production-probe` | Passed; `/design` returned 404 in production and security probes remained green |
| Visible public-name regression | Passed; no visible `CloseoutFlow` in the review |
| Scope diff | Passed; no real auth route, invitation/onboarding workflow, global brand component, migration, or Phase 6 file changed |

## Boundary confirmation

- No concept is globally applied or declared final.
- The temporary “C” remains active in the real sidebar, mobile shell, favicon/PWA placeholders, and production authentication pages.
- Production sign-in, sign-up, verification, recovery, invitation, onboarding, and authentication behavior were not changed.
- No migration, dependency, database behavior, marketing page, fake proof, or Phase 6 feature was added.
- `/design` remains local/test-only and unavailable in production.
- `docs/brand/logo-decision.md` does not exist and must not be created until the founder selects a direction.

## Founder decision required

Select **Concept A — The Sealed Packet**, **Concept B — The Closeout Check**, or **Concept C — The Keystone Fold**, and identify any requested refinement. Phase 5E-B must remain paused at the founder checkpoint until that selection is explicit.

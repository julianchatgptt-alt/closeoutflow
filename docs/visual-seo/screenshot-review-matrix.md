# FILE: /docs/visual-seo/screenshot-review-matrix.md

> **Document status:** Phase 6E-A specification — mandatory capture matrix + objective visual acceptance criteria for 6E-B. Captured via the deterministic Playwright harness (as in Phase 5D/6B), before/after each page group.

## 1. Viewports

| Key | Size | Note |
|-----|------|------|
| desktop-xl | 1920×1080 | large desktop |
| desktop | 1440×900 | primary review size |
| laptop | 1366×768 | standard laptop |
| tablet-land | 1194×834 | iPad landscape |
| tablet-port | 834×1194 | iPad portrait |
| pixel | 412×915 | Pixel 7 |
| iphone | 393×852 | iPhone 15 |

Themes: **light + dark** for every authenticated surface and the public site. States as noted per surface.

## 2. Priority surfaces (full matrix required)

For each: desktop-xl/desktop/laptop/tablet-land/tablet-port/pixel/iphone × light+dark, plus the listed states.

| Surface | Required states |
|---------|-----------------|
| **Dashboard** | populated (real data), empty (no projects), all-configured (calm), loading skeleton, mobile |
| **Project list** | populated, no-results, empty first-run, loading, error, mobile cards |
| **Project overview** | populated, under-populated (setup hero), long names, mobile |
| **Requirement register** | populated grouped, needs-attention filter, not-applicable, bulk-selected, empty first-run, no-results, long title, loading, error, permission-denied, archived rows, mobile cards |
| **Requirement detail** | populated, N/A confirm, archive confirm, stale-conflict, not-found, mobile |
| **Apply-template flow** | choose, preview, confirm/result, mobile |
| **Template library** | populated, empty, no-results, archived filter, mobile |
| **Template builder** | draft builder, published + version chain, long content, mobile |
| **Companies / Contacts** | directory populated, detail, duplicate warning, archived, mobile |
| **Team / Settings** | settings general, members table, invite dialog, roles, dangerous-action, mobile |
| **Sign in** | default, error, mobile |
| **Onboarding / org select / invitation** | default states, mobile |
| **Public homepage** | full page, hero, mobile, dark (if public dark supported) |
| **Mobile navigation** | drawer open, project sub-nav, settings selector |

## 3. Secondary surfaces (representative capture)

Project settings/team/companies/contacts/activity; account pages; honest preview tab (1 sample); 404/error/permission-denied; public product/requirements/templates/security/about/request-access pages; command palette.

## 4. Objective visual acceptance criteria (pass/fail)

A surface **passes** only if all hold:

1. **Surface hierarchy:** at most one raised/focal element per viewport; panels differ from canvas/quiet by tone/elevation, not just a border ring; **dark mode shows real elevation on raised surfaces** (no all-identical outlined rectangles).
2. **Focal point:** the first viewport has one obvious dominant element and one primary action.
3. **Typography:** h1 commands the header; secondary text meets the raised-contrast minimum; numbers tabular; no clipped/overlapping text at any viewport.
4. **Navigation:** active state is a light accent (no filled block); rail visibly grouped; no raw UUIDs in breadcrumbs.
5. **Tables/registers:** hairline internal rules (no heavy grid), group headers clear, comfortable density, premium not spreadsheet-like; mobile converts to `RecordCard` with no horizontal clipping.
6. **States:** the surface's empty/loading/error/permission/conflict states are intentionally designed (no blank card, spinner, or raw text).
7. **Truthfulness:** no review/submission/approval/risk/deadline/package/AI language; no fake metrics; honest previews only where real systems are absent.
8. **Brand:** Keystone Fold correctly sized; engineered-blue + IBM Plex consistent; light/dark parity.
9. **Responsive:** no horizontal document scroll; 44px touch targets; safe-area insets; long company/contact/project/requirement names truncate accessibly.
10. **A11y visual:** visible focus rings; icon+text status; AA contrast in both themes.

Any fail = the page group does not merge until fixed and re-captured.

## 5. Review cadence

- **Baseline (before):** capture every priority surface on the clean pre-6E branch.
- **Per page group:** re-capture that group's surfaces after implementation; diff against baseline; apply the criteria above.
- **Founder checkpoints:** the checkpoint surface subsets ([phase-6e-implementation-plan.md](./phase-6e-implementation-plan.md)) are reviewed with the founder before proceeding.
- **Final:** full-matrix capture for the exit review + independent audit.

---

*Continue to [phase-6e-implementation-plan.md](./phase-6e-implementation-plan.md).*

# FILE: /docs/visual-seo/accessibility-performance-and-safety.md

> **Document status:** Phase 6E-A specification — accessibility, performance, code-safety architecture, and the analytics model for 6E-B.

## A. Accessibility (WCAG 2.2 AA)

Do not rely on axe alone; combine automated + manual keyboard/SR review.

- **Navigation / sidebar / mobile drawer:** landmark `nav`, `aria-current` on active, focus-trapped drawer with `Esc`/backdrop, skip link to `#main`, 44px targets, collapsed icons keep accessible labels.
- **Tables / registers:** `scope`/`aria-sort`/caption, group headers as `<th scope="colgroup">` in `<tbody>` sections, sr-only selection labels ("Select {title}"), keyboard row navigation; mobile `RecordCard` keeps semantic name/label pairs.
- **Bulk actions:** selection count in an `aria-live` region; result announcements ("6 requirements updated"); confirm dialogs are `AlertDialog` with labelled actions.
- **Forms:** label + `aria-describedby` + error association + focus-to-first-error; validation announced; conflict recovery message is a `role="alert"` with a reload path.
- **Dialogs / sheets:** focus trap + return, labelled, `Esc` close; mobile sheet is reachable and dismissible.
- **Status / chips / metrics:** icon + text (never color alone); accessible names for attention chips; metrics have text labels.
- **Reorder:** adjacent-move controls + keyboard (no drag-only) — retained from 6D.
- **Marketing:** accessible header nav, hero with one h1, CTAs as real buttons/links with discernible names, FAQ as accessible disclosure, footer landmarks, descriptive alt on product frames.
- **Cross-cutting:** visible focus ring everywhere (unified `--ring`), keyboard operability of every action, screen-reader names, contrast AA on quiet/panel/raised surfaces (both themes), 200% zoom without loss, reduced-motion zeroes durations, semantic heading hierarchy, landmark structure.
- **Testing:** extend `test:a11y` (axe light+dark) to new/changed routes + public pages; manual keyboard/SR pass on dashboard, register, builder, directories, settings, homepage, mobile nav.

## B. Performance

Targets (verify at implementation; do not invent results):

- **Public pages:** LCP < 2.0s (fast connection) / < 2.5s field target; CLS < 0.1; INP < 200ms; Lighthouse Perf ≥ 90, SEO ≥ 95, A11y ≥ 95.
- **Authenticated pages:** fast first render via Server Components; register interactive quickly even at large row counts.

Strategy:
- **Server Components by default; small client islands** (command palette, theme toggle, bulk-select, dialogs, filters). No hydration-heavy marketing homepage.
- **No new animation libraries; no giant marketing bundles.** Motion via CSS tokens only.
- **Images:** `next/image` with responsive sizes for product frames; compress; explicit dimensions (no CLS). Fonts: keep self-hosted IBM Plex via `next/font` (no layout shift, no extra requests).
- **Route-level loading:** `loading.tsx` skeletons mirroring each surface; avoid spinners.
- **Tables:** server-rendered rows + cursor "load more"; no client mega-lists; the 2,000-row register path stays server-driven (proven).
- **Private data:** never rendered on public/cacheable paths; marketing responses cacheable, app responses per-request/uncacheable as today.
- **Budgets:** define per-route JS budgets in 6E-B (e.g., marketing homepage client JS ≤ ~40–60KB gz target); measure, don't assume.

## C. Code-safety architecture (the guardrail against breaking working code)

Mandatory sequence and rules for 6E-B:

1. **Dedicated branch** off the clean post-6D head.
2. **Clean baseline:** confirm worktree clean; record head SHA.
3. **Full test baseline BEFORE edits:** run and archive `typecheck/lint/format/test/build/test:db/test:e2e/test:a11y/test:server-only/test:live-security/test:production-probe` — everything green first.
4. **Baseline screenshots** for every route ([screenshot-review-matrix.md](./screenshot-review-matrix.md)) as the visual "before".
5. **Route inventory locked** ([route-inventory.md](./route-inventory.md)) — no unlisted authenticated routes added.
6. **Shared tokens/primitives first**, then **shell**, then **page groups one at a time**, then **public site separately**, then **SEO metadata**.
7. **No migrations** unless the dashboard aggregate RPC (Path B, FD-2) is founder-approved — then it is a **standalone reviewed migration + pgTAP**, never bundled with visual commits.
8. **No RPC/RLS/permission/audit/business-rule change** for visual work.
9. **No replacing secure server actions with client-side fetching**; Server Components keep using the existing RLS-scoped queries/RPCs.
10. **No private data into public rendering paths**; public pages have zero authenticated imports.
11. **No broad "cleanup" refactors**; scope each commit to one page group.
12. **Logical commits by page group**; tests + visual review after each; easy per-commit rollback.
13. **Final full regression suite** + independent visual/SEO/security audit before Phase 7.

### High-risk areas → protections + tests

| Area | Risk | Protection | Test |
|------|------|------------|------|
| Shared layouts (`(app)/layout`, `(marketing)/layout`) | breaks every page / leaks noindex | change layout in an isolated commit; keep `robots` on `(app)` | production-probe noindex assertions; per-route smoke |
| Navigation | broken links/access | preserve `navigation.ts` route list; presentation-only | e2e nav + command-palette tests |
| Metadata | private leak / wrong canonical/robots | public metadata in `(marketing)` only; app keeps noindex | production-probe + new public-metadata tests |
| Authentication | lockout / weakened gates | auth = refine-only; no logic touch | full `test:e2e` auth flows, `test:server-only` |
| Server/client boundary | secrets to client / hydration bloat | Server Components default; islands explicit; `server-only` imports intact | `test:server-only` build probes |
| Tables / responsive transforms | Firefox cell collapse, mobile clipping | reuse the 6B `table-fixed`+`<tbody>` group pattern; `RecordCard` primitive | seven-profile e2e + register a11y |
| Theme tokens | contrast/parity regressions | change tokens once, capture both themes | a11y light+dark; screenshot matrix |
| CSP | inline style/script breakage | no inline scripts; nonce pattern preserved; JSON-LD via nonce'd script | production-probe CSP nonce checks |
| Public/private separation | app data on public page | `(marketing)` has no auth data source; lint/import review | new "no auth import in marketing" boundary test |
| Caching | stale/leaked responses | marketing cacheable, app per-request as today | production-probe |
| Search indexing | app routes indexed | robots/sitemap list public only; `(app)` noindex | production-probe + sitemap/robots tests |

## D. Analytics readiness (future implementation, privacy-safe)

Honest, minimal event model — **not implemented in 6E**, specified for later:

- Events: `public_cta_click`, `request_access_started`, `request_access_submitted`, `sign_in_click`, `account_creation_started`, `sign_in_success`, `project_created`, `template_created`, `template_applied`, `requirement_created`, `requirement_bulk_action_completed`.
- **Prohibited payload:** requirement titles, project names, contact info, emails, notes, private company names, document content (none exists), authentication secrets, tokens. Events carry only coarse, non-identifying context (event name + anonymous session + route class).
- No invasive tracking; respect existing privacy posture; analytics is opt-in-safe and never sends tenant data.

## Acceptance criteria

- New/changed routes + public pages pass axe (light+dark) and manual keyboard/SR review.
- Performance targets measured (not assumed) on public pages and the large register.
- Every high-risk area has its protection applied and its test green before the page group merges.
- Diff review confirms zero logic/data/permission change for visual commits.

---

*Continue to [screenshot-review-matrix.md](./screenshot-review-matrix.md).*

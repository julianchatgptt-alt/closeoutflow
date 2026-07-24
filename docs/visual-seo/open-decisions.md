# FILE: /docs/visual-seo/open-decisions.md

> **Document status:** Phase 6E-A specification — decisions that genuinely need **founder input** before or during 6E-B. Each has a safe default so planning is complete; the starred ones should be confirmed at the relevant founder checkpoint.
> **Format:** Decision · Options · Recommendation · Commercial impact · SEO impact · Technical impact · Default · Blocks implementation?

## FD-1 — Dashboard composition ★ (Checkpoint 1)
- **Options:** A "Attention-first operational list"; B "Portfolio snapshot + activity"; C "Single focus + drill-in (honest-limited)".
- **Recommendation:** **A** — most operational, clear focal point, real access-scoped data, degrades to honest empty.
- **Commercial:** A best communicates "worth paying for". **SEO:** none (noindex). **Technical:** A/C use Path A (no new SQL); B benefits from Path B (FD-2).
- **Default:** A. **Blocks?** No — default proceeds; confirm at Checkpoint 1.

## FD-2 — Dashboard org-level aggregate reader (Path B)
- **Options:** (a) **No new SQL** — bounded per-project `get_requirement_summary` calls (Path A); (b) add one read-only `get_organization_requirement_overview()` SECURITY DEFINER reader (Path B) for a single-query aggregate.
- **Recommendation:** **(a) default;** build (b) only if Path A is measurably too slow at large orgs, as a **standalone reviewed migration + pgTAP** (never bundled with visual commits).
- **Commercial:** negligible near-term. **SEO:** none. **Technical:** (b) is the *only* contemplated data addition in 6E and needs founder approval + independent review.
- **Default:** (a). **Blocks?** No.

## FD-3 — Primary public CTA ★ (Checkpoint 1)
- **Options:** "Create an account" (open public signup); "Request access / Join the waitlist" (request-only); both (account primary, request secondary).
- **Recommendation:** **Request access** primary + Sign in secondary until the product/pricing is launch-ready (honest about stage; captures demand).
- **Commercial:** request-only protects first-impressions and builds a qualified list; open signup maximizes volume. **SEO:** minor (a real conversion path aids engagement signals). **Technical:** request-access = a simple public form + privacy-safe handling; open signup reuses existing auth.
- **Default:** Request access. **Blocks?** No — but decide before G12.

## FD-4 — `/team` vs `/settings/team` canonical
- **Options:** keep both (align presentation); make `/settings/team` canonical with `/team` a quiet alias; (later) consolidate.
- **Recommendation:** **`/settings/team` canonical, `/team` aligned alias** — no route/logic removal in 6E (presentation only).
- **Commercial/SEO:** none (noindex). **Technical:** trivial; avoids dead-link risk.
- **Default:** align, keep both. **Blocks?** No.

## FD-5 — Which public pages ship at launch ★ (Checkpoint 3)
- **Options:** minimal (home, product, requirements, templates, security, about, request-access, legal); + `/for-general-contractors`; broader (add project-organization, companies-contacts, checklist hub).
- **Recommendation:** **minimal + `/for-general-contractors`** — enough to rank on the primary cluster and convert, nothing padded.
- **Commercial:** focused, credible. **SEO:** covers the primary + requirements + templates clusters without thin pages. **Technical:** ~9 pages.
- **Default:** minimal + GC page. **Blocks?** No.

## FD-6 — Is `/request-access` (and account creation) public/indexed? ★ (Checkpoint 3)
- **Options:** open public account creation (indexed sign-up path); request-access page indexed + form; request-access noindex.
- **Recommendation:** **index the `/request-access` page, noindex the thank-you;** keep `/sign-up` reachable but `noindex` (auth surface). Tie to FD-3.
- **Commercial:** an indexable access page can rank for brand + intent. **SEO:** one more indexable conversion page. **Technical:** metadata only.
- **Default:** index request-access page. **Blocks?** No.

## FD-7 — Mention starter-template specifics publicly? ★ (Checkpoint 3)
- **Options:** describe templates generically ("reusable, versioned requirement templates"); name example categories (O&M, warranties, as-builts…) with the verify-against-contract disclaimer; publish the full starter list.
- **Recommendation:** **generic + a few example categories with the disclaimer;** do not publish the full starter list (it awaits construction-professional review per Phase 6 ROD-2 / 6C-006).
- **Commercial:** examples aid understanding without over-promising. **SEO:** supports the templates cluster. **Technical:** copy only.
- **Default:** generic + examples + disclaimer. **Blocks?** No.

## FD-8 — Public dark mode
- **Options:** public site light-only; public site supports the theme toggle like the app.
- **Recommendation:** **light-first public site** (marketing reads cleaner light); optionally honor system dark later. App keeps full light/dark.
- **Commercial/SEO:** negligible. **Technical:** less capture surface if light-only.
- **Default:** light-first (system-dark optional). **Blocks?** No.

## Decision status after 6E-B2

| ID | Status |
|----|--------|
| FD-1 dashboard composition | **Resolved — A.** Direction A is implemented in production ([phase-6e-b2-authenticated-rollout.md §4](./phase-6e-b2-authenticated-rollout.md)). |
| FD-2 dashboard aggregate reader | **Resolved — (a).** Path A shipped: bounded `get_requirement_summary` over at most 10 projects, **no new SQL**. Option (b) was not built and remains unapproved. |
| FD-4 `/team` vs `/settings/team` | **Partially actioned.** `/settings/team` received the presentation pass; `/team` was not touched. Both routes remain. |
| FD-6 starter disclaimer wording | **Applied verbatim** on the template library. |
| FD-3, FD-5, FD-7, FD-8 | Untouched — public-site decisions, deferred to 6E-B3. |

### New items raised by 6E-B2

- **FD-9 — `RiskIndicator` retention.** Deleted from every real-data surface and marked `@deprecated`, but the component is still referenced by the dev-only gallery and the honest later-phase preview pages via `list-columns.tsx`. Removing it entirely means rewriting Phase-3 preview content that [route-inventory.md](./route-inventory.md) marks "keep". **Default:** retain as deprecated. **Blocks?** No.
- **FD-10 — `linkButton` hardcoded `#1d4f9a`.** A deliberate Phase 5E hydration-contrast measure that is a standing exception to the "no one-off colour literals" governance rule. **Default:** leave as is. **Blocks?** No.

## Summary

Nothing blocks Phase 6E-B from starting on defaults. The decisions worth an explicit founder nod are the **starred** ones at their checkpoints: **FD-1** (dashboard direction), **FD-3** (primary CTA), **FD-5/FD-6/FD-7** (public pages, access model, template messaging). **FD-2** (dashboard aggregate RPC) is the only item that could touch the database and is gated behind explicit approval + independent review; the default avoids it entirely.

---

*End of the Phase 6E-A specification set. Return to [phase-6e-overview.md](./phase-6e-overview.md).*

# FILE: /docs/visual-seo/phase-6e-overview.md

> **Document status:** Phase 6E-A specification — full-product premium visual redesign + public marketing website + SEO architecture. **Planning only; no application code, migrations, dependencies, RLS, RPCs, permissions, or audit logic change in this phase.**
> **Public brand:** **Closeout** (visible). **Domain:** `closeoutflow.com`. Internal identifiers unchanged.
> **Builds on:** Phase 3E visual system, Phase 5E brand/auth (Keystone Fold), Phase 5 projects/directories, Phase 6 requirements/templates (6B implementation, 6C audit, 6D remediation — all complete).
> **Branch context (read):** current head is `codex/phase-6d-requirements-remediation`; migrations through `0028`; worktree clean.

## 1. Why this phase exists

The product is functionally strong and secure but does not yet *look* like premium software a commercial general contractor would proudly show an owner. A founder review of the live dashboard found it reads as a polished admin template: flat hierarchy, wall-to-wall identical dark bordered rectangles, a generic stat row, a heavy sidebar selection block, small secondary text, no focal point, a "PREVIEW" label that makes the product feel unfinished, and — most seriously — **later-phase review/submission/risk language on surfaces where those systems do not exist yet** (see [current-visual-audit.md](./current-visual-audit.md)). Separately, `closeoutflow.com`'s public root currently `redirect("/dashboard")`s — there is **no indexable public marketing site at all**, so the domain cannot rank or convert.

Phase 6E delivers two connected outcomes:

1. **6E-A (this phase):** a complete, implementation-ready visual + SEO architecture with founder checkpoints and a code-safety plan.
2. **6E-B (next):** the guarded implementation — token/primitive refinement, shell, page-group redesigns, a truthful public site, and SEO metadata — behind founder visual review, preserving every security/authorization/accessibility/testing boundary.

## 2. Permanent quality standard (acceptance lens)

Every redesigned surface is judged against: *exceptional, premium, focused, distinctive, calm, trustworthy, operational, construction-credible, understandable, fast, worth paying for.* It must **not** read as a generic admin dashboard, shadcn/Supabase starter, CRUD tool, spreadsheet clone, identical-card grid, icon demo, or marketplace theme. The public site must **not** read as a one-page startup template, blue-gradient SaaS clone, keyword farm, or construction-cliché site (hard hats, cranes, blueprint grids, stock photos).

## 3. Non-negotiable truthfulness rule

Closeout ships only what exists. No surface — authenticated or public — may show or advertise uploads, document management, submissions, reviews, approvals, rejections, owner handoff, package generation, AI, integrations, billing, risk scoring, or completion/readiness percentages, because **none of those systems are implemented**. This rule governs the dashboard rebuild, the marketing copy, and the SEO/structured-data plan. Every metric and claim traces to a real Phase 4/5/6 capability. See the honesty guardrails in each spec.

## 4. What this phase preserves (do not touch)

Corrected Keystone Fold logo + wordmark; favicon/PWA/OG/email assets; IBM Plex typography (refinements only, justified); engineered-blue foundation; light/dark themes; premium auth direction; accessible primitives; all security boundaries (RLS, CSP nonces, service-role isolation, audit); private-route `noindex`; the entire Phase 6 data/authorization/audit layer. **The logo is not redesigned again** — only sizing/spacing/placement refinements for composition.

## 5. Phase boundary (hard stop)

6E is **visual + marketing + SEO only**. It does **not** begin Phase 7 (subcontractor portal) or any Phase 8+ system. No new business tables/RPCs/permissions. No replacement of secure server actions with client-side data fetching. No private data in public rendering paths. If a redesign appears to *need* a new query, it must be a read-only, RLS-respecting, authorization-gated addition explicitly justified and approved — never a shortcut around the security model. The single most likely legitimate data addition is one **organization-level, access-scoped dashboard aggregate reader**; it is specified conservatively in [dashboard-redesign.md §7](./dashboard-redesign.md) and gated behind founder approval.

## 6. Document set (this directory)

| Doc | Purpose |
|-----|---------|
| [phase-6e-overview.md](./phase-6e-overview.md) | This document — scope, principles, boundary. |
| [route-inventory.md](./route-inventory.md) | Exhaustive route census, classification, redesign priority. |
| [current-visual-audit.md](./current-visual-audit.md) | Evidence-based teardown (dashboard first) + systemic problems. |
| [design-system-evolution.md](./design-system-evolution.md) | Shared token/primitive changes; component keep/refine/rebuild list. |
| [application-shell.md](./application-shell.md) | Sidebar, header, nav, search, breadcrumbs, mobile, content width. |
| [dashboard-redesign.md](./dashboard-redesign.md) | 3 directions + recommendation; real-data IA; data-source plan. |
| [authenticated-pages-redesign.md](./authenticated-pages-redesign.md) | Projects, requirements, templates, directories, team/settings, auth. |
| [public-site-architecture.md](./public-site-architecture.md) | Public IA, homepage architecture, conversion strategy. |
| [seo-content-and-metadata.md](./seo-content-and-metadata.md) | Topic clusters, metadata, sitemap/robots, structured data. |
| [accessibility-performance-and-safety.md](./accessibility-performance-and-safety.md) | A11y, performance budgets, code-safety architecture, analytics model. |
| [screenshot-review-matrix.md](./screenshot-review-matrix.md) | Mandatory capture matrix + objective acceptance criteria. |
| [phase-6e-implementation-plan.md](./phase-6e-implementation-plan.md) | Dependency-aware 6E-B sequence, commits, tests, checkpoints. |
| [open-decisions.md](./open-decisions.md) | Founder decisions (IDs, options, recommendation, default). |

## 7. Founder checkpoints (mandatory before/within 6E-B)

Three blocking reviews — visual direction, authenticated product, and public site/SEO — detailed in [phase-6e-implementation-plan.md §Founder checkpoints](./phase-6e-implementation-plan.md). No major visual direction is silently selected without founder sign-off.

## 8. Verdict

This phase's deliverable is the specification set above. Verdict recorded in the final response: **READY FOR FOUNDER VISUAL REVIEW AND PHASE 6E-B IMPLEMENTATION** once all 13 docs are complete and founder decisions in [open-decisions.md](./open-decisions.md) are surfaced.

---

*Continue to [route-inventory.md](./route-inventory.md).*

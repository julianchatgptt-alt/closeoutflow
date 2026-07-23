# FILE: /docs/requirements/open-decisions.md

> **Document status:** Phase 6A specification — decisions that genuinely need **founder input**. Everything else is decided in the sibling docs with professional defaults. **Nothing here blocks local Phase 6B**; all have safe defaults.
> **Format:** Decision · Options · Recommendation · Commercial impact · Technical impact · Default if unanswered · Blocks implementation?

---

## ROD-1 — Waiver (REQ-007) in Phase 6 or deferred?
- **Options:** (a) Defer `waived` to Phase 9 (reviews), where "required but excused unmet" is meaningful against real submissions; (b) include a basic waive action now.
- **Recommendation:** **(a) Defer.** Before submissions exist, N/A ("never required") covers the honest Phase 6 cases; waiving an obligation nothing has been requested against invites confusion, and waiver carries gates (owner-level/two-person for P0 items) better built once.
- **Commercial:** negligible now; N/A satisfies setup needs. **Technical:** status stays evolvable (`text + check`); zero rework either way.
- **Default:** defer. **Blocks?** No.

## ROD-2 — Starter template content
- **Options:** (a) One general commercial closeout starter (org-editable copy, disclaimer); (b) none; (c) several project-type templates now.
- **Recommendation:** **(a).** One credible starter proves template value on day one; (c) requires the construction-professional review the Phase 1 blueprint mandates before shipping a library (TMPL-002 stays open for that review).
- **Commercial:** strong first-run value; disclaimer ("verify against your contract documents; not legal advice") is mandatory copy. **Technical:** idempotent seed function; trivially replaceable content.
- **Default:** (a). **Blocks?** No — but the starter's item list should get founder/professional review before **production** exposure.

## ROD-3 — CSV import now?
- **Options:** (a) Defer import (schema/RPCs import-ready); (b) minimal template-item CSV import in 6B.
- **Recommendation:** **(a) Defer.** Import UX (mapping/validation/preview/limits) is real scope; the builder + starter cover early needs. Revisit on customer demand.
- **Commercial:** import accelerates onboarding for firms with existing checklists — worth doing later, well. **Technical:** `save_template_items` is the natural later target; nothing forecloses it.
- **Default:** defer. **Blocks?** No.

## ROD-4 — Templates in the sidebar or under Settings?
- **Options:** (a) New **Templates** sidebar item (8 items), `/settings/templates` redirects; (b) keep templates inside Settings.
- **Recommendation:** **(a).** Templates are a primary commercial asset ("your closeout standard"), not org configuration; burying them undercuts the retention story. Sidebar stays lean at 8.
- **Commercial:** discoverability of the compounding-value feature. **Technical:** one nav item + redirect.
- **Default:** (a). **Blocks?** No.

## ROD-5 — Category set for the seeded defaults
- **Options:** (a) The 9 defaults in [requirements-and-lifecycle §6](./requirements-and-lifecycle.md); (b) founder-adjusted list.
- **Recommendation:** **(a)** as the build default — all renameable/archivable per org, so nothing is locked in.
- **Commercial:** default names shape first impressions of construction fluency. **Technical:** seed content only.
- **Default:** (a). **Blocks?** No — founder may reword during 6B review at zero cost.

## ROD-6 — Rules engine (RULE-001 basic conditions) deviation
- **Options:** (a) Accept the re-scope: no rules in Phase 6; optional-item selection + multiple templates cover conditionality; rules arrive with the trades taxonomy in a later phase; (b) build basic conditions now (roadmap's original Phase 6 wording).
- **Recommendation:** **(a).** The Phase 6 directive prioritizes a fast, comprehensible configuration layer; a condition engine adds schema, explainability UX, and test surface that would dilute it. The design-early seam is preserved (stable `item_key`s, category/trade fields, apply-time selection model rules can later drive).
- **Commercial:** low near-term loss (manual selection is transparent); high later value. **Technical:** roadmap deviation recorded in [phase-6-overview §3](./phase-6-overview.md) rather than editing Phase 1 docs.
- **Default:** (a). **Blocks?** No — but this is a **roadmap deviation the founder should explicitly acknowledge**.

## ROD-7 — Template archive restricted to Owner/Admin?
- **Options:** (a) Owner/Admin only (recommended); (b) include PM/Coordinator (matches their manage/publish rights).
- **Recommendation:** **(a).** Archiving hides an org-wide standard; restricting it is the conservative default and trivially widened later.
- **Commercial/Technical:** negligible either way; one matrix row + parity test.
- **Default:** (a). **Blocks?** No.

---

## Resolved planning clarifications (founder-directed, pre-6B)

- **Lifecycle clarification (2026-07-22):** the stored requirement lifecycle is **`active` / `not_applicable_approved`** (not `not_assigned`), with `archived_at` as an independent soft-archive field. Assignment completeness is **always derived** from the responsibility columns — assigning/removing responsibility never transitions `status`, and the derived indicators (unassigned responsible company, unassigned internal owner, missing due date, planned date passed, stale company/contact/member reference, setup attention required) update automatically. statuses §B's "Not assigned" is treated as a computed condition per the statuses.md design principle; §B operational values (`requested`, …) are appended from `active` by later phases with no renames. Reflected across [requirements-and-lifecycle.md](./requirements-and-lifecycle.md), [phase-6-data-model.md](./phase-6-data-model.md), [phase-6-permissions-and-rls.md](./phase-6-permissions-and-rls.md), [phase-6-audit-events.md](./phase-6-audit-events.md), [phase-6-testing.md](./phase-6-testing.md), [routes-and-workflows.md](./routes-and-workflows.md), and [phase-6-implementation-plan.md](./phase-6-implementation-plan.md).

## Summary

**Nothing blocks Phase 6B.** The only items worth an explicit founder nod before **production** exposure are **ROD-2** (starter content review) and **ROD-6** (acknowledging the rules-engine re-scope). All defaults let 6B build and test locally immediately.

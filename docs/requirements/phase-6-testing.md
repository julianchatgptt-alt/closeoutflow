# FILE: /docs/requirements/phase-6-testing.md

> **Document status:** Phase 6A specification — the Phase 6 test plan. **Specification only.**
> **Grounding:** extends the verified Phase 4/5 suite (Vitest, pgTAP as **constrained `authenticated` roles** with `request.jwt.claims` — never service-role for RLS assertions, Playwright seven-profile matrix, axe, `db:validate`, server-only build probes, brand/preview regression, deterministic capture harness).
> **Related:** [phase-6-permissions-and-rls.md](./phase-6-permissions-and-rls.md), [phase-6-audit-events.md](./phase-6-audit-events.md), [commercial-readiness.md](./commercial-readiness.md).

---

## 1. Test pyramid (Phase 6 emphasis)

DB/RLS/permission (pgTAP) remains the over-weighted authoritative layer; new emphasis on **transactional template application** (atomicity/idempotency) and **bulk-operation integrity**.

## 2. Coverage areas (each must exist before 6B completion)

| Area | Tool | Key assertions |
|------|------|----------------|
| authz matrix | Vitest | full org-role × project-role × 11 new permissions; deny-by-default; unknown role/permission; suspended/removed/archived-org; unassigned non-admin denied `requirement.view` |
| RLS isolation (per table) | pgTAP | Org B gets **zero** Org A rows for all ops on all 4 tables; template-existence probe returns nothing cross-tenant |
| Project-access RLS | pgTAP | unassigned non-admin → 0 `project_requirements` rows; assigned → only their projects; owner/admin → all org projects |
| authz⇔RLS parity | Vitest+pgTAP | every `template.*`/`requirement.*` enumerated; both layers agree; drift fails |
| Policy/grants safety | pgTAP | forced RLS on all 4; anon 0 grants; authenticated SELECT-only + function execute; definer fns `search_path=''`; no recursion |
| Lifecycle legality | pgTAP+Vitest | only `{active, not_applicable_approved}` storable; N/A requires reason + `requirement.set_not_applicable` and is the only path to `not_applicable_approved`; reversal returns to `active`; reserved statuses rejected; archived project/requirement write-blocked; archive/restore leave `status` untouched (`archived_at` independent) |
| Derived indicators | pgTAP+Vitest | assigning responsibility causes **no** status change (`status` stays `active`); clearing responsibility (or a Phase 5 row's removal) flips the derived unassigned/stale attention state with no row write to the requirement; unassigned-company / unassigned-owner / missing-due-date / planned-date-passed / stale-reference / setup-attention computations correct against fixtures |
| Template versioning | pgTAP | published rows/items immutable; new version copies items + increments; family archive hides all versions; clone creates new family; draft-only editing |
| Template application | pgTAP+Vitest | atomic (partial failure ⇒ zero rows); idempotent (`item_key` dedupe; re-apply adds 0); newer-version merge additive-only; multi-template union; cross-tenant template/responsibility ids rejected; concurrent double-apply serialized safely |
| Custom requirements | Vitest+pgTAP | title-first create; category defaulting; duplicate warning advisory (never blocks); provenance null |
| Responsibility validation | pgTAP | wrong-project/removed/archived/suspended targets rejected; soft company-contact mismatch allowed; stale-pointer flags derived correctly |
| Due dates | Vitest | date-only, project-timezone derivations; no shift across user timezones (Phase 5D rule); anchor+offset resolution at apply; missing anchor ⇒ empty date |
| Bulk operations | pgTAP+Vitest | atomic all-or-nothing; 200-row cap; per-row permission/scope enforcement; mixed-project call rejected; one audit event with correct counts |
| Concurrency | Vitest | stale `updated_at` ⇒ 0021 conflict code + friendly reconcile; bulk vs single-row interleaving fails cleanly |
| Audit events | Vitest+pgTAP | every mutation writes its catalog event in-transaction; rollback on audit failure; redaction (no email/phone/free-text bodies; N-A reason truncated); apply suppresses per-row created events; immutability (UPDATE/DELETE/TRUNCATE fail) |
| Activity integration | pgTAP+Vitest | requirement events appear in `get_project_activity` for authorized users only; org-scoped template events excluded from project feeds |
| Search/ordering/pagination | Vitest+pgTAP | trigram title search org+project-scoped; stable `(category, sort_order, id)` cursor across inserts; gapped reorder + resequence |
| Scale | scripted probe | seeded project at 25 / 100 / 500 / 2,000 requirements: register query, summary, search, bulk-200 within budget (extend `test:phase5-scale` pattern; transaction rolled back) |
| Migration validator | Vitest | 4 new tables allowed; `requirements`/`submissions`/`documents`/etc. still fail; unknown table fails |
| Generated types | gate | `db:types` deterministic (two runs, identical hash) |
| Server-only boundary | build probe | new server modules fail client builds |
| Brand/preview regression | Vitest+Playwright | requirements route dropped its preview marker; documents/reviews/portal/package routes retain theirs; visible brand "Closeout"; no submission/approval/completion language on Phase 6 surfaces |
| Production probes | existing harness | Phase 6 routes protected + noindex; CSP nonce; security headers; zero health audit writes |

## 3. Commercial-journey E2E (Playwright; J1–J5 from [commercial-readiness §4](./commercial-readiness.md))

- **J1 first register:** empty → apply starter → configured register; assert interaction count + honest deferral copy.
- **J2 template creation:** build → publish → apply; assert version chip + immutability messaging.
- **J3 custom requirement:** ≤ 15 s path; duplicate warning advisory.
- **J4 reuse/version safety:** two projects, template edit, additive re-apply; assert Project A rows byte-identical.
- **J5 access:** owner/admin vs assigned vs unassigned vs removed vs suspended, UI + crafted request.
- **Bulk journey:** select 12 → assign company → verify + audit visible in activity.
- **Mobile:** J1 + J3 + bulk on Pixel 7 / iPhone 15 (cards, sheets, sticky actions).

## 4. Accessibility (WCAG 2.2 AA)

axe light+dark on: register (populated/empty/bulk mode), requirement detail sheet, assign pickers, date editing, N-A/archive AlertDialogs, library, builder (draft), apply flow, category manager. Manual/scripted keyboard: full register workflow without pointer (select, bulk, reorder via menu, apply flow); focus restoration after sheets/dialogs; live-region announcements for bulk results; reduced motion; 44px targets; sr-only names include requirement titles.

## 5. Cross-browser & responsive

Chromium/Firefox/WebKit smoke of J1–J4; Pixel 7 + iPhone 15 + tablet portrait/landscape for register/library/apply; long-name truncation and no-horizontal-clipping assertions at all seven profiles.

## 6. Local test data

Extend the deterministic seed: default categories + starter template (published v1) + an org template with v1 published/v2 draft; Project A with applied + custom + N-A + archived + unassigned + undated + past-planned-date requirements; Project B sharing the template with independent assignments; stale-responsibility fixture (removed company with assigned requirements); Org 2 mirror set for isolation; suspended + unassigned members. pgTAP builds constrained-role fixtures per test and rolls back.

## 7. Visual review (mandatory)

The screenshot matrix in [commercial-readiness §7](./commercial-readiness.md), captured via the repo's deterministic harness; founder soft-review of register + library + apply before 6B closes; no Phase 5E regression (existing logo/auth captures stay green).

## 8. Definition of done (Phase 6)

All coverage areas green; pgTAP proves zero cross-tenant access on all 4 tables + project-access gating; parity green for all new permissions; application idempotency + version immutability proven; bulk atomicity proven; every mutation audited with redaction; scale probe passes at 2,000; validator still forbids later-phase tables; a11y/mobile/cross-browser green; screenshot matrix reviewed; no fake metrics or lifecycle language anywhere; Phase 7+ boundaries intact.

---

*Continue to [phase-6-implementation-plan.md](./phase-6-implementation-plan.md).*

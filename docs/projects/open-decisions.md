# FILE: /docs/projects/open-decisions.md

> **Document status:** Phase 5A specification — decisions that genuinely need **founder input**. Everything else is decided in the sibling docs with professional defaults Codex builds on. **Nothing here blocks local Phase 5B** unless stated; all have safe defaults.
> **Format:** Decision · Recommended default · Alternatives · Security · UX · Commercial · Cost · Deadline · Blocks local 5B? / staging? / production?

---

## POD-1 — Require a project number at creation?
- **Recommended default:** **No** — `project_number` optional (org-unique when present). Keeps creation to one field.
- **Alternatives:** require it (matches firms with strict numbering) — adds friction.
- **Security:** none. **UX:** optional = faster first project. **Commercial:** optional wins on time-to-value; firms can still enforce via process. **Cost:** trivial.
- **Deadline:** Task 13. **Local?** No (default). **Staging?** No. **Prod?** No.

## POD-2 — Can a contact belong to multiple companies?
- **Recommended default:** **Yes**, via `company_contacts` relationship rows (history-preserving). Reflects reality (consultants, people who change firms).
- **Alternatives:** single current company FK (simpler, loses history/multi-affiliation).
- **Security:** none. **UX:** richer, still simple in the common case. **Commercial:** matches messy real data — a trust signal. **Cost:** one join table (already specified).
- **Deadline:** Task 5. **Local?** No (default). **Staging?** No. **Prod?** No.

## POD-3 — Project creation field count
- **Recommended default:** **Name required; project_number + type optional** in the create dialog; everything else on the overview/settings (progressive enrichment).
- **Alternatives:** add address/dates to create (more complete record, slower create — rejected).
- **Security:** none. **UX/Commercial:** minimal-create is the headline "worth paying for" moment. **Cost:** trivial.
- **Deadline:** Task 13. **Local?** No. **Staging?** No. **Prod?** No.

## POD-4 — Separate "Contacts" global nav item?
- **Recommended default:** **Yes** — add "Contacts" to the sidebar (Dashboard·Projects·Companies·**Contacts**·Reports·Team·Settings = 7). The directory is a primary coordinator surface.
- **Alternatives:** nest Contacts under Companies as a two-tab directory (leaner sidebar, slightly hidden).
- **Security:** none. **UX:** discoverability of the reusable directory. **Commercial:** the directory is a retention feature — make it visible. **Cost:** one nav item + route (already planned).
- **Deadline:** Task 17. **Local?** No (default). **Staging?** No. **Prod?** No.

## POD-5 — Company classification model
- **Recommended default:** **Relationship-specific** — global `classifications[]` are directory tags/hints only; the **authoritative role is per project** (`project_companies.role`). (Decided in [companies-and-contacts §3](./companies-and-contacts.md).)
- **Alternatives:** single global company type (wrong for construction — a firm is GC on one job, sub on another).
- **Security:** none. **UX/Commercial:** the correct construction model; avoids duplicate companies. **Cost:** none extra.
- **Deadline:** Task 4/6. **Local?** No (default). **Staging?** No. **Prod?** No.

## POD-6 — Project access default for PM / Coordinator
- **Recommended default:** **Assigned-projects-only** for PM/Coordinator/Reviewer/Viewer; **see-all** for Owner/Administrator. Creator auto-assigned.
- **Alternatives:** PM/Coordinator see **all** org projects by default (flip `project.view_all` on — simpler for small firms, less privacy for large ones). The permission exists; only the default assignment changes → no rework to switch.
- **Security:** assigned-only is tighter (least privilege). **UX:** see-all is convenient for small teams. **Commercial:** assigned-only scales to larger firms and reads as "serious." **Cost:** trivial to flip.
- **Deadline:** Task 1/9 (before RLS ships). **Local?** No (default = assigned-only). **Staging?** confirm. **Prod?** **confirm** (affects who sees what).

## POD-7 — Project deletion policy
- **Recommended default:** **No hard delete** in Phase 5 (archive only; hard delete via org-deletion cascade or a future gated admin action). Preserves history/audit.
- **Alternatives:** allow owner hard-delete of empty draft projects (convenience) — small risk, deferred.
- **Security:** no-delete is safest (no destructive path). **UX:** archive covers the need. **Commercial:** "we don't lose your data" is a trust signal. **Cost:** none.
- **Deadline:** Task 16. **Local?** No (default). **Staging?** No. **Prod?** confirm before any hard-delete ships.

## POD-8 — US-only vs international addresses at launch
- **Recommended default:** **International-ready schema, US-default UX** — `country` defaults `US`, region/postal are free-ish text with US-format hints; store ISO country codes so international works without a migration.
- **Alternatives:** US-only rigid validation (rejects intl) — avoid; hard to undo.
- **Security:** none. **UX:** US-first matches the target market; intl doesn't break. **Commercial:** future-proof without over-building. **Cost:** none extra.
- **Deadline:** Task 3. **Local?** No (default). **Staging?** No. **Prod?** No.

## POD-9 — Minimal company CSV import in Phase 5?
- **Recommended default:** **Defer** the import engine (schema is import-ready). Ship manual directory + dedupe first; add import in Phase 5C/6 if customer demand is strong.
- **Alternatives:** build a minimal company CSV import now (higher onboarding value, notable extra scope/tests).
- **Security:** import needs careful dedupe + validation (deferred = less risk now). **UX/Commercial:** import is a strong onboarding accelerator for firms with existing lists — but not required for the core value. **Cost:** significant if built now.
- **Deadline:** Task 4 (scope decision). **Local?** No (default = defer). **Staging?** No. **Prod?** No.

## POD-10 — Distinct audit events for company↔contact affiliation changes?
- **Recommended default:** **Fold into `company.updated`/`contact.updated`** with an `affiliation_change` metadata note (avoids catalog bloat for low-severity changes).
- **Alternatives:** distinct `company_contact.linked/ended` events (finer activity feed).
- **Security:** none. **UX:** minor (activity granularity). **Commercial:** negligible. **Cost:** trivial.
- **Deadline:** Task 10. **Local?** No (default). **Staging?** No. **Prod?** No.

## POD-11 — Project cover image / avatars timing
- **Recommended default:** **Defer image upload** (needs a private bucket + signed URLs); use **initials/typographic project covers** in Phase 5. Schema reserves `cover_image_url`.
- **Alternatives:** build image upload now (extra storage scope; no public buckets rule).
- **Security:** deferring avoids a new storage surface. **UX/Commercial:** initials covers look clean; images are a nice-to-have. **Cost:** upload is a small later slice.
- **Deadline:** Task 3/15. **Local?** No (default). **Staging?** No. **Prod?** No.

---

## Summary
**Nothing blocks local Phase 5B** — every default lets Codex build and test locally. The only decisions worth a founder's explicit nod before **production** are **POD-6** (project-access default: assigned-only vs see-all — a privacy/UX posture) and **POD-7** (whether any hard-delete ever ships). Everything else has a safe default that Codex proceeds on; founder soft-review happens at the Task 13/15/25 screenshot checkpoints. No new external providers are required for Phase 5 (no staging/production provider gating beyond what Phase 4 already established).

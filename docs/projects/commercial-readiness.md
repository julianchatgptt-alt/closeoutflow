# FILE: /docs/projects/commercial-readiness.md

> **Document status:** Phase 5A specification — commercial-quality analysis for the projects/companies/contacts experience. **This is the "would a contractor pay for this?" lens.**
> **Related:** [routes-and-workflows.md](./routes-and-workflows.md), [projects-and-lifecycle.md](./projects-and-lifecycle.md), [phase-3e-visual-direction.md](../design/phase-3e-visual-direction.md).

---

## 1. Target user jobs (who, doing what)

| User | Job to be done | Phase 5 answer |
|------|----------------|----------------|
| **Project manager** | "Stand up a new job and its players fast, then get back to building." | 60-second create → guided setup checklist. |
| **Closeout coordinator** | "Keep the same subs/architects/owners straight across 20 projects without re-typing." | Reusable company + contact directory; add-by-search. |
| **Org admin / principal** | "See every project and who's on it; trust the data is clean and private." | Owner/Admin see-all; RLS isolation; audit trail. |
| **Internal reviewer** | "Find my projects and the right contacts quickly." | Assigned-to-me filter; contact directory. |

## 2. Time-to-value goals

- **Time to first project:** < 60 seconds (one required field).
- **Time to a usable project (team + owner + 1 sub + 1 contact):** < 5 minutes for a prepared user, via reuse + the setup checklist.
- **Second-project company reuse:** adding a known sub to a new project = search + pick + choose role (≈ 15 seconds), **zero re-entry**.
- **Directory build:** entering a company/contact once makes it available on every future project forever.

## 3. Friction analysis (and how Phase 5 removes it)

| Friction (typical CRUD product) | Phase 5 removal |
|---------------------------------|-----------------|
| Long create form with 20 fields | One field; progressive enrichment. |
| Re-typing the same subcontractor per project | Reusable directory + add-by-search. |
| Multi-step wizard with dead-ends | No wizard; overview + optional checklist. |
| "Now what?" after creating a record | Recommended next step + per-panel CTAs. |
| Company role hard-coded globally | Role per project (a firm can be GC here, sub there). |
| Losing history when someone leaves a company/project | Effective-dated/soft-removed relationships. |
| Cryptic DB errors | Friendly mapped messages. |
| Unusable on a phone in the field | Designed mobile (cards, sheets, sticky actions). |

## 4. First-project experience (the make-or-break moment)

Empty `/projects` is a **sales moment**, not a blank grid: a premium empty state — short value line ("Every closeout starts with a project. Create one and we'll help you assemble the team.") + one primary CTA + a subtle hint that companies/contacts are reusable. First create lands on an overview whose **setup checklist** turns a blank project into a guided, satisfying 5-step assembly — each step a real, valuable action (assign team, add owner, add subs, add contacts), never busywork.

## 5. Company & contact reuse value (the retention engine)

The directory is the feature a spreadsheet can't match: enter "Ace Mechanical" and its contacts once; every new project reuses them by search; dedupe warnings keep it clean; history preserves changes. This compounding, low-effort value is what makes the product **worth keeping** — and switching away costly. The directory UX must feel like an **asset**, not an incidental form (rich detail pages showing a company's projects + contacts, a contact's affiliations + participations).

## 6. Trust signals

Premium Phase 3E surfaces (framed workspace, tabular precision, quiet status ink); exact construction language (owner, GC, sub, architect, substantial completion, closeout target); visible provenance (created/updated by, activity feed from immutable audit); airtight privacy (org isolation the user can feel — they never see another company's data); no fake metrics or vaporware claims (honest previews for later modules).

## 7. Error recovery

Every failure is recoverable and blameless: inline field errors, retained input on server errors, per-panel retry (one failure never blanks the page), stale-edit reconciliation, generic-but-actionable permission/rate-limit messages. No raw DB text. No lost work.

## 8. Empty states (each guides the next action)

Projects (create first) · project overview (setup checklist) · team (assign members) · companies-on-project (add by search or create) · contacts-on-project (add) · directory (build once, reuse) · archived filter (nothing archived yet) · search no-results (clear filters). Never a bare "No data."

## 9. Mobile usability

The coordinator in a jobsite trailer must be able to look up a sub's contact, check a project's team, or create a project on a phone. Tables → cards; dialogs → bottom sheets; sticky primary actions; 44px targets; long company names + emails truncate gracefully; the project sub-nav scrolls. Mobile is a **designed surface**, tested at Pixel 7 + iPhone 15.

## 10. Workflow speed

Keyboard: command palette "Create project" / "Go to project…" / search; `Enter` submits dialogs; add-by-search everywhere; URL-serialized filters for shareable/resumable views; server-first rendering for fast loads; cursor pagination that stays fast at 10k projects/companies.

## 11. Visual-quality expectations

Reuse Phase 3E exactly — no parallel patterns. Projects/companies/contacts read as **paper records on the graphite desk**; status as quiet ink; numbers tabular; one primary action per view; no nested cards; premium empty states. The result should look like software a $50M-revenue GC would proudly show their owner clients.

## 12. Commercial-readiness scorecard

Categories: **Ready** (spec is commercially complete) · **Needs Phase 5B validation** (verify via screenshots/user-flow in build) · **Needs later phase** (intentionally deferred) · **Provider-dependent** (needs founder cloud config).

| Workflow | Category | Note |
|----------|----------|------|
| Project creation (1-field, dialog) | **Ready** | validate speed/polish via 5B screenshots |
| Project list (search/filter/sort) | **Ready** | validate column set + mobile cards in 5B |
| Project overview (setup checklist) | **Needs 5B validation** | the "value before requirements" claim must be seen |
| Project settings/lifecycle | Ready | |
| Company directory + reuse | **Ready** | the retention engine; validate detail-page richness |
| Contact directory + affiliations | Ready | |
| Duplicate warnings (no auto-merge) | Ready | |
| Project companies (role-per-project) | Ready | |
| Project contacts | Ready | |
| Internal team assignment | Ready | |
| Activity from audit | **Needs 5B validation** | human phrasing must read well |
| Search/pagination scale | Ready | trigram indexes; validate at seed scale |
| Mobile relationship tables | **Needs 5B validation** | card fallbacks must be genuinely usable |
| Import | **Needs later phase** | schema-ready; engine deferred |
| Cover images / avatars | **Needs later phase** | initials/typographic now |
| Merge companies/contacts | **Needs later phase** | schema-ready |
| Dashboard real project data | **Needs 5B validation** | wire counts/activity; keep req metrics honest |

## 13. Phase 5B screenshot-review requirements (visual review is mandatory)

Projects desktop light · Projects desktop dark · Projects mobile · Project creation desktop · Project creation mobile · New-project empty state · Project overview desktop · Project overview mobile · Project settings · Project setup checklist · Companies desktop · Companies mobile · Company detail · Company duplicate warning · Contacts desktop · Contacts mobile · Contact detail · Project companies · Project contacts · Internal project team · Archive confirmation · Permission-denied · Loading state · Error state. Founder soft-review at the overview + directory checkpoints; blocks only on a major visual/UX contradiction.

## 14. Risks that could make the product feel cheap, confusing, or unfinished

| Risk | Guard |
|------|-------|
| Overview looks empty/pointless before requirements | Setup checklist as the hero + honest closeout placeholder + real dates/team/companies. |
| Directory feels like a throwaway form | Rich detail pages (projects + contacts per company), reuse-first pickers, premium empty states. |
| Too many create fields | One required field; enforce it. |
| Duplicate companies/contacts pile up | Create-time dedupe warnings; validate they actually fire in 5B. |
| Mobile relationship tables unreadable | First-class card fallbacks; test on real device viewports. |
| Confusing internal-member vs external-contact | Distinct sections/language/affordances; never call a contact a "user." |
| Requirements/documents look live | Keep honest previews; regression test. |
| Cross-tenant leak erodes trust instantly | Forced RLS + pgTAP isolation matrix (non-negotiable). |
| Slow lists at real scale | Trigram indexes + cursor pagination, validated at seed scale. |
| Generic status colors / loud UI | Phase 3E quiet-ink status system; ≤3 tones per screen. |

---

*Continue to [phase-5-audit-events.md](./phase-5-audit-events.md).*

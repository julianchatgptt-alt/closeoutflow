# FILE: /docs/requirements/commercial-readiness.md

> **Document status:** Phase 6A specification — commercial-quality analysis for the requirement/template experience. **The "would a contractor pay for this?" lens.**
> **Related:** [routes-and-workflows.md](./routes-and-workflows.md), [requirement-templates.md](./requirement-templates.md), [phase-3e-visual-direction.md](../design/phase-3e-visual-direction.md).

---

## 1. Target user jobs

| User | Job to be done | Phase 6 answer |
|------|----------------|----------------|
| **Closeout coordinator** | "Stand up the closeout scope for a new job in minutes, not an afternoon of spreadsheet copying." | Apply a template → resolve subs → dated register. |
| **Project manager** | "Know instantly who owes what and when, and what still needs setting up." | Summary chips + Needs-attention filter + derived indicators. |
| **Principal/Admin** | "Our closeout standard is captured once and used consistently on every job." | Versioned org templates; publish/clone; audit. |
| **Internal reviewer/viewer** | "See the scope without being able to break it." | Read-only register access on assigned projects. |

## 2. Time-to-value goals (test-asserted where automatable)

- Empty project → applied starter template → register: **< 3 minutes**.
- Apply an existing org template incl. responsibility resolution: **< 90 seconds**.
- Add a custom requirement: **< 15 seconds** (title + category).
- Bulk-assign a company to 12 items: **< 20 seconds**.
- Second project reuse: same template, zero re-entry, independent assignments.

## 3. Faster-than-spreadsheet claims (the honest pitch)

| Spreadsheet pain | Phase 6 removal |
|------------------|-----------------|
| Copy last job's tab, delete half, break formulas | Previewed template apply with optional-item selection |
| "Which version of the checklist is this?" | Versioned, published templates with provenance on every row |
| Who's responsible lives in someone's head | Three explicit responsibility slots + Unassigned surfacing |
| No audit of who changed what | Immutable activity trail per project |
| One phone call = retype the sub's info | Phase 5 directory reuse in every picker |
| 2,000-row sheet melts | Indexed grouped register with search/filters/bulk |

**Honesty guardrail:** Phase 6 never claims to chase, collect, review, or complete anything. Deferral copy names the real future capability ("Requests are sent when the subcontractor portal arrives") without dates or promises of "coming soon" hype.

## 4. Commercial journeys (defined here; tested in [phase-6-testing.md](./phase-6-testing.md))

### J1 — First requirement register
Open project → requirements tab (empty state sells the value) → Apply starter/org template → preview + deselect → resolve subs → confirm → register with next-action guidance → assign remainder + set dates. **Evaluate:** ≤ 10 interactions to a useful register; no dead ends; clear next action at every step; mobile-completable.

### J2 — Template creation
Templates → New → add categories/items (batch-friendly builder) → mark optional items → Publish (confirm) → Apply to a project. **Evaluate:** a 30-item template built in one sitting without page churn; publish semantics understood without documentation.

### J3 — Custom requirement
Register → Add requirement → title (+ category) → appears in the right section → assign + date inline. **Evaluate:** ≤ 15 s; duplicate warning helpful, never blocking.

### J4 — Reuse & version safety
Apply the same template to Project B → independent assignments; edit the template (new version) → Project A untouched; apply v2 to Project A → additive merge preview only. **Evaluate:** the user can predict every outcome; trust that nothing rewrites silently.

### J5 — Access
Owner/Admin: all registers + library. Assigned coordinator: their register, full config. Assigned viewer: read-only. Unassigned member: cannot discover the project or its register. Removed assignment / suspended membership: access gone. **Evaluate:** at the RLS layer plus E2E.

Each journey is scored in 6B review for steps, time, clarity, perceived speed, trust, error recovery, mobile usability, and the payment-worthiness verdict.

## 5. Empty states (each sells the next action)

Register first-run ("Every closeout starts with the scope. Apply your template or the starter, or add requirements one by one.") · library first-run (capture-once value + starter + disclaimer) · post-apply zero-unassigned celebration line ("Scope set. Assign responsibility to make it actionable.") · no-results (clear filters) · archived filter · builder empty category. Never a bare "No data".

## 6. Visual direction (Phase 3E, extended not replaced)

- Register = **paper record on the graphite desk**: framed content region, category headers as quiet overlines, tabular numerals for dates/counts, status as quiet ink chips, one primary action per surface.
- IBM Plex + engineered-blue system + Keystone Fold branding untouched; light/dark parity.
- **Rejected explicitly:** checkbox-list "todo app" presentation; bordered-card grids per requirement; spreadsheet gridlines/dense 24px rows; fake progress rings; celebration confetti; icon-library sprawl (existing icon set only); any Phase 5E regression.
- Density: comfortable default, compact toggle inherited from `DataTable`.
- Status language exactly as specified ([requirements-and-lifecycle §3](./requirements-and-lifecycle.md)); no invented UI statuses.

## 7. Mandatory screenshot review matrix (6B gate)

Capture via the deterministic harness; founder soft-review before 6B closes.

| Surface | Desktop 1440 light | Desktop 1440 dark | Tablet portrait | Pixel 7 | iPhone 15 |
|---------|:--:|:--:|:--:|:--:|:--:|
| Register (populated, grouped) | ✔ | ✔ | ✔ | ✔ | ✔ |
| Register first-run empty | ✔ | ✔ | — | ✔ | — |
| Register bulk-select + action bar | ✔ | ✔ | — | ✔ | — |
| Requirement detail sheet/page | ✔ | ✔ | — | — | ✔ |
| Assign responsibility picker | ✔ | — | — | ✔ | — |
| Mark N/A confirmation | ✔ | ✔ | — | — | — |
| Template library (populated + empty) | ✔ | ✔ | ✔ | ✔ | — |
| Template builder (draft) | ✔ | ✔ | ✔ | — | — |
| Template published + version chain | ✔ | — | — | — | — |
| Apply flow (preview step) | ✔ | ✔ | — | ✔ | ✔ |
| Apply flow (confirm + result) | ✔ | — | — | ✔ | — |
| Project overview w/ requirement panel | ✔ | ✔ | — | ✔ | — |
| Loading / error / permission-denied / stale-conflict | ✔ | — | — | ✔ | — |

## 8. Marketing & SEO language to record (for the future marketing phase — do not implement)

Customer vocabulary observed in this domain, reserved for the dedicated marketing/SEO phase: "construction closeout software", "closeout checklist template", "project closeout requirements", "O&M manual collection", "closeout document tracking", "subcontractor closeout submittals", "turnover package", "closeout log", "punch list vs closeout". Page opportunities: template-library landing ("commercial closeout checklist"), per-category explainers (O&M, warranties, as-builts, lien waivers), "spreadsheet vs Closeout" comparison. All Phase 6 routes remain private + noindex; nothing public ships now.

---

*Continue to [phase-6-audit-events.md](./phase-6-audit-events.md).*

# FILE: /docs/requirements/requirement-templates.md

> **Document status:** Phase 6A specification — the reusable template model, versioning, library UX, and the apply-to-project workflow (TMPL-001/002/003, REQ-001). **Specification only.**
> **Related:** [requirements-and-lifecycle.md](./requirements-and-lifecycle.md), [phase-6-data-model.md](./phase-6-data-model.md), [routes-and-workflows.md](./routes-and-workflows.md), [open-decisions.md](./open-decisions.md).

---

## 1. What a template is

A **requirement template** is an org-scoped, versioned, reusable checklist of requirement items ("Standard Commercial Closeout", "Restaurant TI Closeout", "Our Medical Office Standard"). Applying it to a project instantiates concrete `project_requirements` (snapshots). The template is the blueprint; the requirement is the instance (glossary) — the two never share live state.

## 2. Concept inventory (what exists, what deliberately does not)

| Concept | In Phase 6? | Model |
|---------|:-----------:|-------|
| Template | ✔ | `requirement_templates` row |
| Template version | ✔ | **Row-per-version** (§3) — no separate versions table |
| Template item | ✔ | `requirement_template_items` |
| Template section/category | ✔ (via shared taxonomy) | Items reference `requirement_categories`; grouping is by category — no separate section entity |
| Template status | ✔ | `draft` → `published` → `archived` |
| Template ownership | ✔ (lightweight) | `created_by`/`updated_by`; org-owned, no per-template ACLs |
| Cloning | ✔ | New family from any template (starter or existing) |
| Revision history | ✔ | The version chain + audit events; no per-field diff store |
| Combining templates | ✔ (at apply time) | Apply multiple templates to one project; `item_key` dedupe |
| Template-level rules/conditions | ✖ (ROD-6) | Rules engine deferred; `is_optional` + apply-time selection cover Phase 6 |
| Per-template default reviewer chain | ✖ | Phase 9 concern; column not created |
| Template marketplace/sharing across orgs | ✖ | Single-tenant reuse only |

## 3. Versioning model (row-per-version)

- `requirement_templates` carries `family_id` (uuid, shared by all versions; equals the first row's `id`), `version int` (1..n), `status`.
- **Draft:** fully editable (name, description, items). Only drafts are editable.
- **Publish** (`publish_requirement_template`): flips to `published`; the row and its items become **immutable** (enforced in functions; no direct UPDATE grants exist anyway). Only published versions can be applied to projects (drafts can be **previewed** against a project, not applied).
- **Edit a published template** → `create_template_version`: copies the latest version's items into a new `draft` row (`version + 1`, same `family_id`). The old version remains applied-referencable history.
- **Current version** = highest published version in the family (computed; no mutable pointer).
- **Uniqueness:** `(organization_id, family_id, version)` unique; duplicate template **names** are allowed but warned (advisory, matching the directory dedupe philosophy).
- **Archive** (`archive_requirement_template`): archives the **family** (all versions) — hidden from the library and apply pickers; existing project requirements keep their provenance link and display normally with an "archived template" hint. Restore reverses. Draft-only families can also be archived (acts as discard-without-delete; no hard delete).
- **Clone** (`clone_requirement_template`): copies any visible version's items into a **new family** (v1 draft, name "Copy of …" editable). Used for "start from starter", "fork our standard for hospitals".

**What is immutable after application:** the applied version row + items (they were already immutable at publish). Project requirement instances are snapshots — later versions never touch them except through an explicit re-apply merge (§7).

## 4. Template items

Fields (full DDL in [phase-6-data-model.md §2.3](./phase-6-data-model.md)): `title`, `description`, `category_id`, `trade`, `priority`, `is_optional` (optional items are deselectable at apply; TMPL-001 mandatory/optional), `default_responsible_role` (nullable, `project_companies.role` vocabulary — a resolution hint, not an assignment), `default_due_anchor` (`substantial_completion` | `closeout_target`, nullable) + `default_due_offset_days` (nullable), `sort_order`, and **`item_key`** — a family-stable slug generated at item creation (kept across versions; regenerated only for new items). `item_key` powers dedupe/idempotency (REQ-001 "dedupe by item key") for re-apply, multi-template apply, and newer-version merge.

Builder editing is draft-only via a batched `save_template_items` RPC (add/update/remove/reorder atomically) — one audit event per save, not per keystroke.

## 5. Default organization template & starter content (ROD-2)

- Closeout ships **one** general commercial closeout starter ("Standard Commercial Closeout — Starter"), seeded **as a regular org-owned draft→published template** on first use of the library (idempotent ensure function) — editable, cloneable, archivable like any other. Not marked special beyond a "Starter" description line.
- Content: ~30–40 items across the default categories (O&M by major trade, warranties, as-builts, permits/CO, T&B/commissioning, training, attic stock, lien waivers, final cleaning/keys/closeout letter), each with sensible category, optional flags, role hints, and no legal claims.
- **Mandatory disclaimer** (library + preview + apply flow): "Starter content is a general example. Verify every requirement against your contract documents and project obligations. Closeout does not provide legal advice." Full multi-project-type library (TMPL-002) waits for construction-professional review per the Phase 1 completion review.
- Orgs can work with **no template at all** — custom requirements alone are fully supported; the register's empty state offers both paths.

## 6. Applying a template to a project (REQ-001)

A short, fast flow (sheet/dialog from the register or template detail — **not** a long wizard; steps 3–5 are one screen with progressive disclosure):

1. **Select** — published templates (current versions first; older versions accessible via "other versions").
2. **Preview** — items grouped by category; counts; duplicate detection against the project (existing `item_key`s and normalized-title matches shown as "already in project — will be skipped/flagged").
3. **Choose** — categories and optional items toggle; required items default-on (deselectable with a visible count of exclusions).
4. **Resolve responsibility** — for each `default_responsible_role` present, one picker: "Subcontractor items → {search project companies with that role}" (skippable; items stay unassigned). Uses only Phase 5 project relationships; offers "Add a company to this project" as an escape hatch link.
5. **Set dates** — if the project has the anchor dates, offsets resolve to concrete due dates shown for confirmation; a single "default due date" fallback (optional) for anchor-less projects; per-item dates editable later, not here.
6. **Confirm** — summary (n added, n skipped as duplicates, n left unassigned, n without dates) → **atomic create**.
7. **Land in the register**, new items highlighted, with next-action guidance ("Assign the 6 unassigned requirements").

### Transactional semantics

- One `apply_requirement_template` RPC: authorize (`requirement.apply_template` on the project + template visibility) → validate all selections/resolutions (cross-tenant ids rejected) → insert all instances → write `template.applied` audit (template id/version, counts) — all in one transaction. **Partial failure = full rollback**; the user retries the confirmed set.
- **Idempotency/dedupe:** partial unique `(project_id, source_item_key)` on non-archived rows; the RPC skips existing keys (returning them as "skipped") so re-running an apply after a timeout cannot double-insert (client also passes an idempotency token to dedupe whole-call retries).
- **Same template twice** → everything skips; result honestly reports "0 added — already applied".
- **Newer version** → only items whose `item_key` is new (or previously archived — surfaced as "previously removed, restore?") are added; existing instances (including locally edited ones) are **never modified or deleted** (TMPL-003: never destroys progress; conflicts resolved by explicit user choice, which in Phase 6 means "keep yours" is automatic).
- **Multiple different templates** → union with `item_key` dedupe (keys are family-scoped so cross-family collisions don't occur; title-similarity duplicates are warned in preview, user decides).
- **Mistaken apply** → bulk-select "Source: {template}" filter → archive (preserves history); no destructive "undo apply" that deletes rows.
- **Concurrency:** two users applying simultaneously — the unique index serializes; the loser's duplicates skip; both see accurate results.

## 7. Template library UX (summary — visual/route detail in [routes-and-workflows.md](./routes-and-workflows.md))

- **Library list** (`/templates`): name, version + status chip, item count, categories covered, last updated/by; search (trigram on name); filters (status, archived); primary **New template**; secondary Clone starter. Empty state sells reuse ("Capture your closeout standard once — apply it to every project") + starter CTA + disclaimer.
- **Template detail/builder** (`/templates/[templateId]`): identity header (name, version chain pills, status), category-grouped item list; **draft** = inline editing, add item, reorder (drag + keyboard alternative), category management entry; **published** = read-only with "Edit (creates v{n+1})", "Apply to project…", Clone, Archive. Version switcher shows the chain; older versions read-only.
- **Preview before applying** — the apply flow's step 2 doubles as standalone preview from the library ("Preview against a project…").
- **Duplicate template names** — advisory warning at create/rename.
- Mobile: list cards; builder is read-mostly on phones with editing supported but optimized for desktop/tablet (drag disabled in favor of move controls on touch).
- Permissions and audit per [phase-6-permissions-and-rls.md](./phase-6-permissions-and-rls.md) / [phase-6-audit-events.md](./phase-6-audit-events.md).

## 8. Import preparation (ROD-3)

CSV import is **deferred**. The schema is import-ready (flat item rows, category by name, stable keys generatable at import) and the batched `save_template_items` RPC is the natural target for a later import surface. Building mapping/validation/preview UX now would delay the core register value; revisit after customer demand. No import tables or routes in Phase 6.

## 9. Deferred template features (recorded, not built)

Promote-a-custom-requirement-to-template-item; per-item expected file formats (Phase 8); default reviewer chains (Phase 9); rule conditions (ROD-6); template sharing/marketplace; template-level analytics (Phase 11).

---

*Continue to [responsibility-and-dates.md](./responsibility-and-dates.md).*

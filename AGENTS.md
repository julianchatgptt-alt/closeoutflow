# AGENTS.md — CloseoutFlow

Guardrails for **any coding agent** (Codex, Claude, others) working in this repository. This file routes you to the authoritative docs — it does not duplicate them. **Read the relevant docs before writing code.**

## 0. Before you touch anything
1. Read the Phase 1 product blueprint in [`/docs/product/`](docs/product/): `product-requirements.md`, `user-roles.md`, `workflows.md`, `statuses.md`, `feature-roadmap.md`, `glossary.md`.
2. Read the Phase 2 architecture in [`/docs/architecture/`](docs/architecture/), starting with `architecture-overview.md` and the doc for your area.
3. Follow the current phase plan. Phase 5 (incl. 5C audit, 5D remediation, 5E brand/auth polish) is complete — see [`phase-5-exit-review.md`](docs/projects/phase-5-exit-review.md) and [`phase-5e-exit-review.md`](docs/brand/phase-5e-exit-review.md). Phase 6A planning is complete in [`docs/requirements/`](docs/requirements/); the next activity is Phase 6B implementation per [`phase-6-implementation-plan.md`](docs/requirements/phase-6-implementation-plan.md). **Phase 6 is requirement configuration only — no uploads, reviews, portals, notifications, packages, AI, or billing.**

## 1. Non-negotiable rules
- **Never weaken tenant isolation.** Every tenant table has `organization_id` and RLS (default deny). Do not add a query path that could cross organizations.
- **Never bypass RLS casually.** The service-role client is server-only and used only in code that has already called `authz` and writes an audit event. Never reach for service-role to "make a query work."
- **Never expose service-role or any secret to the client.** No secret in `NEXT_PUBLIC_*`. The privileged DB client must stay behind `server-only` imports.
- **Never use public document buckets or public file URLs.** All storage is private; access is via short-lived signed URLs only. Large uploads go **browser → storage** (resumable), never through a serverless request body.
- **Preserve document version history.** Approved versions are immutable; replacing a document creates a new version. Never overwrite or delete a version silently.
- **Keep AI out of final approvals.** AI writes only to `*_suggestion` fields with confidence + rationale. No action or job may move a requirement/document to an approved terminal status. Approval is always a human action through `authz`.
- **Authorization has one source of truth:** `packages/authz`. Do not write ad-hoc role checks in features. RLS mirrors `authz`; keep them in agreement.
- **Audit is not logs and not analytics.** Important actions write immutable events to the `audit` schema (see `security-and-operations.md`). Do not put audit in logs/analytics or vice versa.
- **Migrations are append-only after they run anywhere shared.** Never edit an applied migration; add a new one. Regenerate and commit DB types in the same PR.
- **The product must work without any integration.** Never make core flows depend on Procore/ACC/etc.

## 2. Core concepts must stay separate
Requirement ≠ Submission ≠ Document ≠ Document Version ≠ Review ≠ Approval. Uploading a document does **not** complete a requirement — only an approved review chain does. Do not merge these concepts to "simplify." See `glossary.md` and `statuses.md`.

## 3. How to work
- **Stay in scope.** Implement the current task only. **No unrelated refactors** in the same change.
- **Add tests for new behavior.** Especially: RLS/isolation, `authz`, secure links, file validation, job idempotency, and status-transition legality. See `testing-and-quality.md`.
- **Run the required checks** before proposing a change: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` (+ `pnpm test:db` when touching schema/RLS). All commands are cross-platform (Windows + Linux).
- **Respect import boundaries** (`repository-structure.md`): apps→packages only; `ui` has no db/authz; features never import another feature's internals; vendor SDKs only inside their adapter package.
- **Update documentation when architecture changes.** If you change a decision, update the relevant doc and add/adjust an ADR in `architecture-decisions.md`.

## 4. When something is unclear or conflicting
- **Stop and report. Do not invent product behavior.** If the docs contradict each other or a task, surface the conflict (quote the sources) and ask, rather than silently choosing.
- Do not change the approved Phase 1 documents to resolve a conflict; document it as an architecture-blocking issue.
- Founder infrastructure actions (creating cloud accounts, setting secrets, branch protection) are **not** yours to perform — flag them (see `open-decisions.md`).

## 5. Definition of done (foundation tasks)
A task is done when: it meets its completion criteria in the plan, required checks pass, new behavior has tests, boundaries and security rules are intact, no secret is committed, docs are updated if a decision changed, and **no out-of-scope/business tables or features were added**.

## 6. Current implementation source

- Phase 3 design direction and implementation specifications live in [`docs/design/`](docs/design/).
- Phase 3E visual polish is closed out in [`docs/design/phase-3e-exit-review.md`](docs/design/phase-3e-exit-review.md); its implemented visual source remains [`docs/design/phase-3e-visual-direction.md`](docs/design/phase-3e-visual-direction.md).
- Phase 4 identity and tenancy specifications live in [`docs/auth/`](docs/auth/). Phase 4B implementation status is in [`docs/auth/phase-4-implementation-progress.md`](docs/auth/phase-4-implementation-progress.md) and its exit evidence is in [`docs/auth/phase-4-exit-review.md`](docs/auth/phase-4-exit-review.md).
- Phase 5 project and directory specifications live in [`docs/projects/`](docs/projects/). Phase 5B implementation status is in [`docs/projects/phase-5-implementation-progress.md`](docs/projects/phase-5-implementation-progress.md) and its exit evidence is in [`docs/projects/phase-5-exit-review.md`](docs/projects/phase-5-exit-review.md). Phase 5E brand/auth polish is closed out in [`docs/brand/phase-5e-exit-review.md`](docs/brand/phase-5e-exit-review.md).
- Phase 6 requirement/template specifications live in [`docs/requirements/`](docs/requirements/) (Phase 6A planning, founder-assigned). Phase 6B may implement **only** that scope: requirement categories, versioned templates, template application, project requirements, responsibility, due dates, N/A, archive, bulk operations, permissions/RLS, and audit. Do not begin document, review, approval, portal, notification, package, billing, integration, or AI work until the founder explicitly assigns those phases.

> If you can only remember one thing: **isolation, RLS, private files, version integrity, human-only approvals, one authz source, append-only audit/migrations — never compromised to save effort.**

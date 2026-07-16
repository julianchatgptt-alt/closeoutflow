# CLAUDE.md — CloseoutFlow

Instructions for Claude (Claude Code and other Claude agents) in this repository. **Read [`AGENTS.md`](AGENTS.md) first** — it holds the full guardrails and is authoritative. This file adds Claude-specific guidance and does not repeat everything.

## Start here, every session
1. Read the relevant Phase 1 docs in [`/docs/product/`](docs/product/) and Phase 2 docs in [`/docs/architecture/`](docs/architecture/) for the area you're touching. Do not work from memory of the product — the docs are the source of truth.
2. Confirm which phase/task you are on. During the foundation, follow [`docs/architecture/phase-2-implementation-plan.md`](docs/architecture/phase-2-implementation-plan.md) and **do not begin Phase 3 features**.

## The rules you must never break (summary — full text in AGENTS.md §1)
- Never weaken **tenant isolation**; every tenant table has `organization_id` + RLS (deny by default).
- Never **bypass RLS** casually; service-role is server-only and used only after an `authz` check + audit write.
- Never expose **service-role or secrets** to the client; nothing sensitive in `NEXT_PUBLIC_*`.
- Never use **public buckets or public file URLs**; large uploads go browser→storage (resumable), signed URLs only.
- Never overwrite/delete an approved **document version**; replacement creates a new version (history preserved).
- Never let **AI approve** important documents; AI writes only to `*_suggestion` fields — approval is a human `authz` action.
- One **authorization** source of truth (`packages/authz`), mirrored by RLS.
- **Audit** events are immutable and separate from logs/analytics.
- **Migrations** are append-only after shared use; commit regenerated DB types with the migration.
- Core flows **never depend on integrations** (Procore/ACC).

## Keep these concepts distinct
Requirement, Submission, Document, Document Version, Review, Approval are **separate**. Uploading ≠ completing a requirement; only an approved review chain completes it. Don't collapse them.

## How Claude should behave here
- **Act within the current task; do not sprawl.** No unrelated refactors bundled into a change.
- **Add tests for new behavior** — prioritize RLS/isolation, `authz`, secure links, file validation, job idempotency, and status-transition legality.
- **Run required checks** before presenting work: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` (add `pnpm test:db` when touching schema/RLS). Commands are cross-platform.
- **Respect import boundaries** and adapter isolation (`repository-structure.md`).
- **Report faithfully.** If tests fail, say so with output. If you skipped something, say so. Don't claim done until checks pass.
- **Stop and surface conflicts** rather than inventing product behavior. Quote the conflicting sources. Do not edit the approved Phase 1 docs to paper over a contradiction — record it as a blocking issue.
- **Founder-only actions** (cloud accounts, secrets, branch protection, production approval) are not yours to perform — flag them and point to [`docs/architecture/open-decisions.md`](docs/architecture/open-decisions.md).
- **Update docs/ADRs** when a decision changes.

## Where to look
- Product truth: `docs/product/*`. Architecture truth: `docs/architecture/*`. Decisions: `architecture-decisions.md`. What needs a human: `open-decisions.md`. What to build next: `phase-2-implementation-plan.md`.

> Optimize for a small, correct, well-tested change that upholds every isolation/security/integrity rule — not for doing more at once.

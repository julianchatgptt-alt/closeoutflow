# FILE: /docs/architecture/repository-structure.md

> **Document status:** Phase 2 architecture — repository layout & boundaries.
> **Related:** [architecture-overview.md](./architecture-overview.md), [technology-stack.md](./technology-stack.md), [phase-2-implementation-plan.md](./phase-2-implementation-plan.md).
> **Decision:** Single **monorepo**, **pnpm workspaces + Turborepo**. One deployable web app now; a worker app and provider packages are added as later phases require, in a layout that already anticipates them.

---

## 1. Recommended repository tree

```
closeoutflow/
├─ apps/
│  ├─ web/                         # The Next.js App Router application (only app at Phase 2)
│  │  ├─ app/                      # Routes (route groups per audience)
│  │  │  ├─ (marketing)/           # Public marketing (minimal at foundation)
│  │  │  ├─ (app)/                 # Internal authenticated app (added Phase 4+)
│  │  │  ├─ (portal)/              # Subcontractor account-free portal (Phase 7)
│  │  │  ├─ (review)/              # External reviewer surface (Phase 9)
│  │  │  ├─ (owner)/               # Owner portal (Phase 14)
│  │  │  ├─ api/                   # Route Handlers: webhooks, file-signing, health, future /api/v1
│  │  │  │  ├─ health/route.ts     # Health endpoint (Phase 2)
│  │  │  │  ├─ webhooks/           # Resend, Inngest, Stripe(later), storage events
│  │  │  │  └─ v1/                 # Future public API (Enterprise)
│  │  │  ├─ layout.tsx
│  │  │  └─ manifest.ts            # PWA manifest
│  │  ├─ src/
│  │  │  ├─ features/              # Feature modules (colocated UI + actions + queries + tests)
│  │  │  │  └─ <feature>/          # e.g. projects/, requirements/, documents/ (added per phase)
│  │  │  │     ├─ components/
│  │  │  │     ├─ actions.ts       # Server Actions (mutations)
│  │  │  │     ├─ queries.ts       # Server-side reads
│  │  │  │     ├─ schema.ts        # Zod schemas for this feature
│  │  │  │     └─ __tests__/
│  │  │  ├─ components/            # App-specific shared UI (composed from ui package)
│  │  │  ├─ lib/                   # App-local helpers (thin; promote to packages if shared)
│  │  │  └─ styles/                # Tailwind entry, tokens
│  │  ├─ public/                   # Static assets, PWA icons
│  │  ├─ e2e/                      # Playwright specs
│  │  ├─ next.config.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  └─ worker/                      # Inngest functions runtime (ADDED when Phase 8 begins; scaffold seam at Phase 2)
│     ├─ src/functions/           # Job handlers (pure, provider-agnostic)
│     └─ package.json
│
├─ packages/
│  ├─ config/                      # Shared config: eslint, tsconfig base, tailwind preset, prettier
│  ├─ env/                         # Zod-validated environment schema (server/client split)
│  ├─ db/                          # Typed DB client factory + generated types + query helpers
│  │  ├─ src/client.ts             # createServerClient / createServiceClient (server-only)
│  │  └─ src/types.generated.ts    # `supabase gen types` output (generated; checked in)
│  ├─ authz/                       # SINGLE source of truth for permission policy
│  │  ├─ src/policy.ts             # can(actor, action, resource) — deny by default
│  │  └─ src/__tests__/
│  ├─ domain/                      # Stable shared domain types & enums (statuses, roles) — added as stabilized
│  ├─ validation/                  # Cross-feature Zod schemas & shared primitives
│  ├─ ui/                          # shadcn/ui-based component library + design tokens
│  ├─ email/                       # Email adapter interface + Resend impl + React Email templates
│  ├─ storage/                     # Storage adapter interface + Supabase impl (S3-compatible keys)
│  ├─ jobs/                        # Job client wrapper (enqueue), Inngest client, shared job types
│  ├─ notifications/               # Notification channel interface (email/in-app; SMS-ready)
│  ├─ observability/               # pino logger, Sentry init, request-id helpers
│  ├─ audit/                       # Audit-event writer + typed event catalog
│  ├─ search/                      # Search adapter interface + Postgres FTS impl (dedicated later)
│  ├─ ai/                          # AI adapter interface (NO models at Phase 2; suggestion-only contract)
│  └─ integrations/               # Integration adapters (Procore/ACC/storage) — added Enterprise
│
├─ supabase/
│  ├─ config.toml                  # Supabase local config (pinned CLI)
│  ├─ migrations/                  # Append-only SQL migrations (empty baseline at Phase 2)
│  ├─ tests/                       # pgTAP tests (RLS, constraints) — grows per phase
│  └─ seed/                        # Deterministic, NON-production seed data
│
├─ docs/
│  ├─ product/                     # Phase 1 blueprint (source of truth for product)
│  ├─ architecture/                # Phase 2 architecture (this set)
│  └─ runbooks/                    # Operational runbooks (added over time)
│
├─ .github/
│  ├─ workflows/                   # CI: ci.yml, migrations.yml, e2e.yml, security.yml
│  └─ pull_request_template.md
│
├─ scripts/                        # Cross-platform Node scripts (NO bash-only scripts)
├─ .changeset/                     # Changelog management (if adopted)
├─ AGENTS.md                       # Guardrails for coding agents (routes to docs)
├─ CLAUDE.md                       # Claude-specific guardrails (routes to docs)
├─ turbo.json                      # Turborepo pipeline
├─ pnpm-workspace.yaml
├─ package.json                    # Root: scripts, engines, packageManager
├─ tsconfig.json                   # Root TS project references
├─ .nvmrc
├─ .gitignore
├─ .env.example                    # Documented, NON-secret example env
└─ README.md
```

> **Phase-2 reality check:** Only the directories needed for the foundation are created now (`apps/web` shell, `packages/config|env|db|observability|audit|ui` seams, `supabase/` baseline, `docs/`, `.github/`, root files). `apps/worker` and feature/domain/integration packages are **seams described here but implemented in their phases** — the plan in [phase-2-implementation-plan.md](./phase-2-implementation-plan.md) says exactly what to create.

---

## 2. Purpose of every major directory

| Path | Purpose |
|------|---------|
| `apps/web` | The single deployable application; all audiences served via route groups. |
| `apps/web/app/(app|portal|review|owner)` | Audience-scoped route groups; keeps internal, subcontractor, reviewer, and owner surfaces cleanly separated. |
| `apps/web/app/api` | Route Handlers for webhooks, file-signing, health, and the future public API. |
| `apps/web/src/features/<feature>` | Colocated feature modules: components, Server Actions, server queries, Zod schema, tests. |
| `apps/worker` | Background job runtime (Inngest functions); added at Phase 8. |
| `packages/config` | Shared ESLint/TS/Tailwind/Prettier configuration; one source of standards. |
| `packages/env` | Zod-validated env; the only place env vars are read/typed. |
| `packages/db` | Typed Supabase client factories + generated types + reusable query helpers. |
| `packages/authz` | **The** authorization policy; imported by web + worker; mirrored by RLS. |
| `packages/domain` | Stable shared enums/types (statuses, roles) once they stop churning. |
| `packages/validation` | Shared Zod primitives reused across features. |
| `packages/ui` | Design system (tokens + components); no business logic. |
| `packages/email|storage|jobs|notifications|search|ai|integrations` | Provider adapters (interface + impl) isolating replaceable vendors. |
| `packages/observability` | Logger, Sentry init, request-id/correlation helpers. |
| `packages/audit` | Audit-event writer + typed event catalog (distinct from logs/analytics). |
| `supabase/migrations` | Append-only SQL migrations (single source of schema truth). |
| `supabase/tests` | pgTAP RLS/constraint tests. |
| `supabase/seed` | Deterministic non-production seed/test data. |
| `docs/` | Product + architecture + runbooks. |
| `scripts/` | Cross-platform (Node) dev/ops scripts — Windows + Linux safe. |

---

## 3. Package boundaries & import rules

**Dependency direction (must not be violated):**

```
apps/web ─┐
apps/worker ─┼─> packages/* ─> (only) other lower-level packages
            └─> supabase (types via packages/db)

packages/ui        -> config only (NO db, NO authz, NO business logic)
packages/authz     -> domain, db-types (NO ui, NO feature code)
packages/db        -> env, generated types (NO ui, NO authz)
packages/audit     -> db, observability (NO ui)
packages/email/... -> env, observability (adapter interfaces only)
feature modules    -> packages/* (NEVER import another feature's internals)
```

**Enforced rules:**
1. **Apps depend on packages; packages never depend on apps.**
2. **`packages/ui` contains no data access, no authz, no vendor SDKs** — pure presentation + tokens.
3. **Vendor SDKs are imported only inside their adapter package** (`email`, `storage`, `jobs`, `ai`, `search`, `integrations`). Feature code imports the adapter interface.
4. **Features never import another feature's internal files.** Cross-feature reuse goes through a package (promote when stable) or a shared server query.
5. **The service-role client lives only in `packages/db` server entrypoints** and is never importable into client components (enforced by `server-only` imports + lint).
6. **`packages/env` is the only reader of `process.env`.** Everything else imports the typed config.
7. Import boundaries enforced by ESLint (`eslint-plugin-boundaries` / no-restricted-imports) + TypeScript project references; violations fail CI.

---

## 4. Naming conventions

| Thing | Convention | Example |
|-------|------------|---------|
| Packages | `@closeoutflow/<name>`, kebab dir | `@closeoutflow/authz` |
| Files (TS) | kebab-case | `secure-link.ts` |
| React components | PascalCase file + export | `RequirementTable.tsx` |
| Server Actions | verb-first, `action` suffix optional | `assignRequirement()` |
| Zod schemas | `<Thing>Schema` | `CreateProjectSchema` |
| DB tables/columns | snake_case, plural tables | `document_versions`, `organization_id` |
| Enums (TS) | PascalCase type, snake_case values matching DB | `RequirementStatus = 'under_review'` |
| Audit events | dotted `resource.action` | `requirement.status_changed` |
| Env vars | SCREAMING_SNAKE, prefixed | `SUPABASE_SERVICE_ROLE_KEY` |
| Route groups | `(audience)` | `(portal)` |
| Test files | `*.test.ts` / `*.spec.ts` (e2e) | `policy.test.ts` |

---

## 5. Where things live (quick reference)

| Concern | Location |
|---------|----------|
| Database migrations | `supabase/migrations/` (append-only) |
| Generated DB types | `packages/db/src/types.generated.ts` |
| pgTAP RLS/constraint tests | `supabase/tests/` |
| Unit/component/integration tests | Colocated `__tests__/` next to code + `packages/*/src/__tests__` |
| E2E tests | `apps/web/e2e/` |
| Background jobs | `apps/worker/src/functions/` (handlers), enqueue via `packages/jobs` |
| Integration adapters | `packages/integrations/*` |
| Shared types | `packages/domain` (stable) / feature `schema.ts` (local) |
| Generated files | `*.generated.ts` (checked in, never hand-edited) |
| Docs | `docs/product`, `docs/architecture`, `docs/runbooks` |
| Agent guardrails | `/AGENTS.md`, `/CLAUDE.md` |
| Cross-platform scripts | `scripts/*.mjs` (Node, never `.sh`-only) |

---

## 6. What must never be shared across feature boundaries

- **A feature's internal components, queries, or actions.** If two features need the same thing, it is promoted to a package (`ui`, `domain`, `validation`) or exposed as an explicit shared server query — never imported directly from the other feature's folder.
- **Feature-local Zod schemas** stay local unless promoted to `packages/validation`.
- **Ad-hoc SQL / permission checks.** All DB access flows through `packages/db`; all authorization flows through `packages/authz`. Duplicating either inside a feature is prohibited.
- **Vendor SDK usage.** Never re-import a vendor SDK in a feature to "save a hop"; go through the adapter.

**Rule of thumb:** feature modules are *leaf* consumers. Anything two leaves need moves *down* into a package, never *sideways* between leaves.

---

*Continue to [data-architecture.md](./data-architecture.md).*

# FILE: /docs/architecture/architecture-decisions.md

> **Document status:** Phase 2 architecture — Architecture Decision Records (ADRs).
> **Format per ADR:** Title · Status · Context · Decision · Alternatives considered · Consequences · Risks · Revisit trigger.
> **Status values:** `Accepted` (in force), `Proposed`, `Deferred` (designed-for, not yet adopted).

---

## ADR-001 — Monorepo with pnpm workspaces + Turborepo
- **Status:** Accepted
- **Context:** One web app now; future worker + shared adapters. Two founders + AI agents need a layout that is understandable and enforces boundaries.
- **Decision:** Single monorepo, **pnpm workspaces** for packages + **Turborepo** for cached/parallel task pipelines. `apps/*` + `packages/*` + `supabase/` + `docs/`.
- **Alternatives considered:** Polyrepo (coordination overhead); plain pnpm workspaces without Turbo (fine early, but we want CI caching/pipelines from day one); Nx (heavier than needed).
- **Consequences:** Consistent tooling, enforced import boundaries, fast CI; slight Turbo learning curve.
- **Risks:** Turbo config drift. **Revisit trigger:** if Turbo overhead > benefit, drop to plain pnpm scripts (layout unchanged).

## ADR-002 — Next.js App Router + React + strict TypeScript
- **Status:** Accepted
- **Context:** Need RSC pages, server mutations, webhooks/APIs, PWA, mobile-excellent UX, on a managed host.
- **Decision:** **Next.js (App Router)**, React, **strict TS**. Server Actions for internal mutations; Route Handlers for webhooks/file-signing/health/public API.
- **Alternatives considered:** Remix/React Router; SvelteKit; separate SPA + API server. Rejected for ecosystem fit, two-founder simplicity, and Vercel integration.
- **Consequences:** One framework, one deploy target; RSC data model; some App Router caching sharp edges.
- **Risks:** Framework churn. **Revisit trigger:** sustained App Router instability or a non-React client requirement.

## ADR-003 — PostgreSQL via Supabase as the platform
- **Status:** Accepted
- **Context:** Strongly relational closeout domain; need RLS, referential integrity, FTS, plus bundled auth + private storage on a startup budget.
- **Decision:** **Supabase** (managed Postgres + Auth + Storage). Postgres is the system of record; RLS is the isolation backstop.
- **Alternatives considered:** RDS/Cloud SQL + separate auth/storage (more ops); Neon (no bundled auth/storage); PlanetScale/MySQL (weaker RLS); document DB (wrong shape).
- **Consequences:** Fast start, cohesive platform; some Supabase-specific coupling (auth/storage) — isolated behind adapters.
- **Risks:** Platform limits (connections, egress). **Revisit trigger:** hitting Supabase limits → migrate portable Postgres to Neon/RDS + adapters for auth/storage.

## ADR-004 — Authentication via Supabase Auth; SSO via WorkOS later
- **Status:** Accepted (Supabase Auth) / Deferred (WorkOS SSO)
- **Context:** Need email/password, Google, Microsoft, MFA now; SAML/SCIM later for enterprise.
- **Decision:** **Supabase Auth** for internal identity + MFA + OAuth. Enterprise **SSO/SCIM via WorkOS** added later, additively, behind an identity/session module. **Secure account-free links are a separate first-party mechanism.**
- **Alternatives considered:** Clerk/Auth0/WorkOS-only (cost/lock-in now); roll-your-own (never).
- **Consequences:** Low cost now; clean enterprise path; two identity mechanisms (accounts vs. secure links) by design.
- **Risks:** Supabase Auth constraints. **Revisit trigger:** enterprise SSO demand or auth limits → introduce WorkOS.

## ADR-005 — Tenant isolation enforced in the database (RLS)
- **Status:** Accepted
- **Context:** Cross-tenant leakage is the top risk; app-only checks are insufficient.
- **Decision:** **RLS on every tenant table, default deny**, keyed on `organization_id` + membership/grant; `organization_id` denormalized onto child rows; helper SQL predicates centralize policy. Application `authz` is the primary UX gate; RLS is the guarantee; parity tested.
- **Alternatives considered:** App-only authorization (unsafe); schema-per-tenant (operational complexity, poor for cross-org users); separate DB per tenant (cost/ops).
- **Consequences:** Strong isolation even with app bugs; RLS complexity; must keep authz↔RLS in sync.
- **Risks:** Policy mistakes. **Revisit trigger:** scale/perf issues with RLS → tuned indexes/materialization, not removal.

## ADR-006 — Single authorization source of truth (`packages/authz`)
- **Status:** Accepted
- **Context:** Permission logic must not be duplicated inconsistently across features.
- **Decision:** One policy module `can(actor, action, resource, context)`, deny-by-default, scope-aware, imported everywhere; RLS mirrors it; role×action matrix from [user-roles.md](../product/user-roles.md) is the contract; table-driven tests.
- **Alternatives considered:** Per-feature checks (drift/bugs); pure RLS (poor UX/errors, hard to express sensitive-action gates).
- **Consequences:** Consistent, testable authorization; central place to reason about permissions.
- **Risks:** Central module must stay well-factored. **Revisit trigger:** policy expressiveness limits → policy DSL/ABAC engine.

## ADR-007 — File storage on Supabase Storage (private), S3-compatible migration path
- **Status:** Accepted (Supabase now) / Deferred (S3/R2 later)
- **Context:** Sensitive documents, large files, no public URLs, growth to object storage.
- **Decision:** **Private Supabase Storage**; **direct-to-storage resumable uploads** (bytes bypass serverless); **signed short-lived URLs** for access; S3-style keys `org/{}/project/{}/document/{}/version/{}`; all access via `packages/storage` adapter. Migrate blobs to **S3/R2** on cost/scale trigger.
- **Alternatives considered:** Files through app server (fails large-file rule); public buckets (prohibited); S3 from day one (more setup, no bundled auth/storage synergy early).
- **Consequences:** Secure, large-file-safe, portable; two storage backends over time behind one adapter.
- **Risks:** Egress cost. **Revisit trigger:** egress/cost or lifecycle-tiering needs → S3/R2.

## ADR-008 — Background jobs via Inngest
- **Status:** Accepted
- **Context:** Need durable, retryable, idempotent, scheduled workflows for processing/reminders/packages without self-managed queues.
- **Decision:** **Inngest**; handlers pure/provider-agnostic in `apps/worker`; enqueue via `packages/jobs`. `pg_cron` only for light DB-local schedules.
- **Alternatives considered:** Trigger.dev (switch target); QStash (fewer primitives); BullMQ/Redis (self-managed); Vercel Cron alone (no queue semantics).
- **Consequences:** Fast, observable async foundation; provider dependency mitigated by pure handlers.
- **Risks:** Cost at volume/self-host need. **Revisit trigger:** high volume/self-host → Trigger.dev or self-hosted queue.

## ADR-009 — Transactional email via Resend + React Email
- **Status:** Accepted (Postmark deferred as switch target)
- **Context:** Reliable transactional email is core to the chase workflow; need good DX + deliverability + webhooks.
- **Decision:** **Resend** + **React Email**, behind `packages/email`; Mailpit locally; sends are jobs (idempotent); delivery webhooks drive notification lifecycle.
- **Alternatives considered:** Postmark (best deliverability — kept as escape hatch); SES (cheap, more setup); SendGrid (heavier).
- **Consequences:** Great DX; clean swap path.
- **Risks:** Deliverability at scale. **Revisit trigger:** deliverability/pricing → Postmark.

## ADR-010 — Testing: Vitest + pgTAP + Playwright, DB/permission-weighted
- **Status:** Accepted
- **Context:** Isolation and permissions are the highest-risk areas; must be provable in the database.
- **Decision:** **Vitest** (unit/component/integration/jobs/email), **pgTAP** (RLS/constraints in-DB), **Playwright** (E2E + mobile + axe a11y). authz↔RLS parity tests. Gates in CI.
- **Alternatives considered:** Jest (slower ESM); Cypress (weaker cross-browser/mobile); app-only RLS tests (insufficient).
- **Consequences:** High confidence on isolation/permissions; some DB-test setup cost.
- **Risks:** Test maintenance. **Revisit trigger:** rare.

## ADR-011 — Deployment on Vercel; GitHub Actions CI
- **Status:** Accepted
- **Context:** Next.js hosting with per-PR previews, env separation, low ops.
- **Decision:** **Vercel** for web + preview deploys; **GitHub Actions** for CI; trunk-based branching; staging on merge; manual prod promotion. No prod data/secrets in preview/staging.
- **Alternatives considered:** Netlify (weaker Next parity); self-host (ops); GitLab CI (ecosystem fit).
- **Consequences:** Fast delivery; Vercel/GitHub coupling (acceptable, portable app).
- **Risks:** Compute/egress cost; long-running worker limits. **Revisit trigger:** move worker to dedicated runtime; containerize if needed.

## ADR-012 — Observability: Sentry + pino + PostHog, distinct from audit
- **Status:** Accepted
- **Context:** Errors, logs, analytics, and **audit** are four different concerns and must not be conflated.
- **Decision:** **Sentry** (errors), **pino** (structured logs), **PostHog** (privacy-conscious analytics); **audit events live in Postgres** (append-only) and are never replaced by logs/analytics.
- **Alternatives considered:** Datadog (cost early); logging-only (unstructured); analytics-as-audit (privacy/volume mistake).
- **Consequences:** Clear separation; multiple tools to manage.
- **Risks:** Cost creep. **Revisit trigger:** consolidate to OTel backend / self-host PostHog at scale.

## ADR-013 — Search: Postgres FTS first, dedicated engine later
- **Status:** Accepted (FTS) / Deferred (dedicated)
- **Context:** Permission-aware search across many entities; must never cross tenant/scope.
- **Decision:** **Postgres FTS** (tsvector + GIN) under **RLS** (results inherently permission-scoped); OCR text stored for indexing; `packages/search` adapter abstracts FTS now and **Typesense/OpenSearch** later, with permissions re-checked at query time.
- **Alternatives considered:** Dedicated search from day one (premature cost/ops); app-side filtering (weak, leak-prone).
- **Consequences:** Simple, secure start; clear upgrade path.
- **Risks:** FTS relevance/scale limits. **Revisit trigger:** relevance/scale needs → dedicated engine behind the adapter.

## ADR-014 — API strategy: Server Actions internal, Route Handlers for edges, versioned public API later
- **Status:** Accepted (internal) / Deferred (public API)
- **Context:** Need internal mutations, webhooks, file-signing, health now; public API + webhooks (Enterprise) later.
- **Decision:** **Server Actions** for internal app mutations; **Route Handlers** under `/api` for webhooks, file-signing, health, and a **future `/api/v1`** public API with API keys/OAuth + signed, retriable webhooks. All validated with **Zod**, standard error envelope, rate-limited, idempotency keys where needed.
- **Alternatives considered:** REST/tRPC for everything (more ceremony internally); GraphQL (overkill early).
- **Consequences:** Minimal internal ceremony; clear external surface later.
- **Risks:** Server Action constraints. **Revisit trigger:** heavy external/integration API needs → expand `/api/v1`.

## ADR-015 — Audit events as a first-class, immutable, separate store
- **Status:** Accepted
- **Context:** Legally significant construction records require complete, tamper-evident traceability distinct from logs/analytics.
- **Decision:** `audit.audit_events` in a **separate schema**, **append-only/immutable** (no update/delete grants + trigger), written in-transaction with actions, with the SEC-001 field set; partitioned when volume warrants; org-exportable; **no AI-approval event exists**.
- **Alternatives considered:** Audit-in-logs (mutable, PII-risky, not queryable/legal); audit-in-analytics (wrong tool).
- **Consequences:** Strong compliance posture; write discipline required.
- **Risks:** Volume. **Revisit trigger:** volume/perf → partitioning/archival tiers.

## ADR-016 — Secure account-free external links (hashed, scoped, revocable)
- **Status:** Accepted
- **Context:** Subcontractors/reviewers/owners must participate without accounts, securely, per Phase 1.
- **Decision:** High-entropy tokens, **hash-at-rest**, **no PII in URL**, scoped grant (org + resource + actions), **expiry**, **instant revocation (fail-closed)**, **rotation**, identity confirmation on state-changing actions, rate-limited resolution, RLS-scoped context on use.
- **Alternatives considered:** Supabase magic links (create accounts/sessions); JWT-in-URL (revocation/rotation pain, leakage risk).
- **Consequences:** Secure, revocable, low-friction external access.
- **Risks:** Link leakage. **Revisit trigger:** higher assurance needs → mandatory one-time codes / device binding.

## ADR-017 — AI is suggestion-only and cannot approve
- **Status:** Accepted
- **Context:** Phase 1 mandates human-controlled AI; AI must never approve important documents.
- **Decision:** AI outputs write **only** to `*_suggestion` fields with confidence + rationale; **no action or job path** can move a requirement/document to an approved terminal; approval is a human Server Action through `authz`; enforced by tests.
- **Alternatives considered:** AI auto-approval with thresholds (violates Phase 1; legal risk).
- **Consequences:** Safe automation; humans stay in control.
- **Risks:** AI error misleads users. **Revisit trigger:** none for the approval rule; suggestion quality improves independently.

## ADR-018 — Rate limiting & idempotency via Upstash Redis
- **Status:** Accepted
- **Context:** Brute-force/secure-link protection and idempotency keys need fast ephemeral state.
- **Decision:** **Upstash Redis** (serverless) behind a small rate-limit/idempotency adapter.
- **Alternatives considered:** DB counters (hot rows); self-managed Redis (ops).
- **Consequences:** Effective protection, low ops.
- **Risks:** Vendor/pricing. **Revisit trigger:** pricing/latency → Vercel KV/managed Redis.

---

*Continue to [phase-2-implementation-plan.md](./phase-2-implementation-plan.md).*

# FILE: /docs/architecture/technology-stack.md

> **Document status:** Phase 2 architecture — final technology selections.
> **Related:** [architecture-overview.md](./architecture-overview.md), [architecture-decisions.md](./architecture-decisions.md) (ADRs carry the deep rationale).

This document lists the **final** selections, each with role, why, alternatives rejected, and a replacement trigger. The Phase-1 "preferred starting direction" is largely kept; every deviation is called out under [§Deviations](#deviations-from-the-preferred-starting-direction).

---

## Selected technologies

| Layer | Selection | Role |
|-------|-----------|------|
| Language | **TypeScript (strict)** | One language across web + worker + packages. |
| Web framework | **Next.js (App Router) + React** | UI, RSC, Server Actions, Route Handlers, PWA. |
| Styling | **Tailwind CSS** | Utility styling + design tokens via CSS variables. |
| Components | **shadcn/ui (Radix primitives)** | Accessible, owned-in-repo component base. |
| Monorepo | **pnpm workspaces + Turborepo** | Package manager + task caching/orchestration. |
| Database | **PostgreSQL via Supabase** | System of record, RLS, FTS. |
| DB migrations | **Supabase CLI (SQL migrations)** | Append-only versioned schema. |
| DB types | **`supabase gen types typescript`** | Generated types checked into repo. |
| Storage | **Supabase Storage (private, S3-compatible)** | Document blobs, resumable uploads, signed URLs. |
| Auth | **Supabase Auth** | Internal identity, MFA, Google + Microsoft OAuth. |
| Secure external links | **First-party token mechanism** (hashed, in Postgres) | Account-free subcontractor/reviewer/owner access. |
| Background jobs | **Inngest** | Queues, retries, scheduling, idempotency, local dev. |
| Scheduled DB tasks | **Supabase `pg_cron`** (light use) | Simple periodic DB maintenance. |
| Transactional email | **Resend + React Email** | Email sending + typed templates. |
| Local email | **Mailpit** (via Supabase local / Docker) | Dev inbox, no real sends. |
| Rate limiting | **Upstash Redis** (serverless) | Rate limits, idempotency keys, ephemeral counters. |
| Validation | **Zod** | Runtime validation + inferred types (forms, actions, APIs, env). |
| Forms | **React Hook Form + Zod resolver** | Accessible, performant forms. |
| Client server-state | **TanStack Query** (only where needed) | Client cache for interactive/polling views. |
| URL state | **nuqs** | Filters/pagination/sorting in the URL. |
| Env validation | **`@t3-oss/env-nextjs` + Zod** | Fail-fast typed environment variables. |
| Errors | **Sentry** | Error monitoring (web + worker). |
| Logging | **pino** (structured JSON) | App logs (distinct from audit + analytics). |
| Product analytics | **PostHog** (EU/privacy-conscious config) | Privacy-conscious product analytics. |
| Unit/component/integration tests | **Vitest + Testing Library** | Fast tests. |
| DB/RLS tests | **pgTAP + Supabase test harness** | Policy and constraint tests in-database. |
| E2E tests | **Playwright** | Cross-browser + mobile emulation, a11y via `axe`. |
| Accessibility | **axe-core (Playwright + CI)** | WCAG 2.1 AA regression. |
| CI | **GitHub Actions** | Checks, tests, migration validation, scans. |
| Secret scanning | **Gitleaks** | Prevent committed secrets. |
| Dependency updates | **Renovate** | Batched, testable dependency PRs. |
| Deployment | **Vercel** | Web hosting, preview deploys. |
| Billing (deferred) | **Stripe** | Subscriptions + per-project billing (Phase 16). |
| Uptime | **Better Stack (Uptime)** or Vercel monitors | External uptime checks. |

---

## Why each major selection, alternatives rejected, and replacement trigger

### TypeScript (strict)
- **Why:** Shared types end-to-end; catches domain mistakes (e.g., mixing Requirement vs Document) at compile time.
- **Alternatives rejected:** JS (no safety), other languages (splits the stack for two founders).
- **Replace when:** Never for the web; a future high-throughput processing service could add Go/Rust behind the worker boundary if profiling demands.

### Next.js App Router + React
- **Why:** One framework serving RSC pages, Server Actions (internal mutations), and Route Handlers (webhooks/APIs/file-signing). Great Vercel integration, PWA support, strong hiring/AI familiarity.
- **Alternatives rejected:** Remix/React Router (viable, smaller ecosystem for our managed stack), SvelteKit (smaller talent/AI familiarity), separate SPA + API server (more moving parts for two founders).
- **Replace when:** App Router instability or a need for a non-React client; low likelihood.

### Tailwind + shadcn/ui (Radix)
- **Why:** Fast, consistent, accessible components owned in-repo (no version lock to a component vendor). Tokens via CSS variables enable dark mode and theming.
- **Alternatives rejected:** MUI/Chakra (heavier, harder to fully own/style), plain CSS (slower, less consistent).
- **Replace when:** Rarely; components are copied into the repo so there is little lock-in.

### pnpm workspaces + Turborepo
- **Why:** pnpm is fast, disk-efficient, strict about phantom deps (good for import boundaries). Turborepo adds cached, parallel task running that keeps CI fast as the repo grows, with near-zero config. Chosen over "plain workspaces" because CI caching and pipeline definitions pay off once a worker package and multiple test suites exist.
- **Alternatives rejected:** npm/yarn (slower, looser), Nx (more powerful but heavier than two founders need), plain pnpm workspaces without Turbo (fine early, but we want the pipeline/caching from day one).
- **Replace when:** If Turborepo overhead ever exceeds its benefit, drop to plain pnpm scripts — the workspace layout is unchanged.

### PostgreSQL via Supabase
- **Why:** Postgres is the right relational core for a strongly-relational closeout domain with referential integrity, constraints, RLS, and FTS. Supabase gives managed Postgres **plus** Auth **plus** private Storage in one low-cost platform — ideal for two founders. RLS is the linchpin of database-level tenant isolation.
- **Alternatives rejected:** Raw RDS/Cloud SQL (no bundled auth/storage; more ops), Neon (great Postgres but no bundled auth/storage), PlanetScale/MySQL (weaker RLS story, no bundled auth), a document DB (wrong for this relational domain).
- **Replace when:** If Supabase limits (connections, storage egress, auth constraints) are hit, the **Postgres stays portable** — migrate to Neon/RDS + separate auth/storage adapters. Storage and auth are already abstracted for exactly this.

### Supabase Auth
- **Why:** Bundled with the DB, supports email/password, Google, Microsoft (Azure), TOTP MFA, and email verification/reset. Integrates with RLS via JWT claims.
- **Alternatives rejected:** Clerk/Auth0/WorkOS (excellent but added cost/lock-in; WorkOS is the SSO answer *later*), roll-your-own (never for security-critical auth).
- **Replace when:** Enterprise SSO/SCIM demand grows → introduce **WorkOS** for SSO alongside Supabase Auth (see ADR + [auth-and-permissions.md](./auth-and-permissions.md)). Identity is abstracted behind a session/identity module to make this additive.

### Secure external links (first-party)
- **Why:** Account-free access is a core product principle. Supabase sessions are the wrong primitive (they imply accounts and broad scope). We store a **hashed** high-entropy token mapped to a narrowly-scoped grant with expiry/revocation.
- **Alternatives rejected:** Supabase magic links (create accounts/sessions), JWT-in-URL (revocation and rotation are painful; risk of leakage).
- **Replace when:** Never architecturally; only the hashing/rotation policy evolves.

### Inngest (background jobs)
- **Why:** Serverless-native, first-class retries, step functions, idempotency keys, cron scheduling, concurrency/rate limits, dead-letter visibility, and excellent local dev — all critical for document processing and reminders. Fits Vercel without running our own queue infra.
- **Alternatives rejected:** Trigger.dev (very close second; strong option, kept as the switch target), QStash (simpler but fewer workflow features), BullMQ/Redis (self-managed infra — too much ops for two founders), Vercel Cron alone (scheduling only, no queue semantics), Supabase pg_cron/pgmq (used only for light DB-local scheduling).
- **Replace when:** Cost at high volume or a need for self-hosting → move handlers (kept as pure functions) to Trigger.dev or a self-hosted queue; the job **handlers are provider-agnostic** by convention.

### Resend + React Email
- **Why:** Simple API, typed React templates, delivery webhooks, custom domains; great DX for two founders.
- **Alternatives rejected:** Postmark (best-in-class deliverability — the switch target if issues arise), SES (cheapest but more setup/less DX), SendGrid (heavier).
- **Replace when:** Deliverability problems or scale pricing → **Postmark** behind the email adapter.

### Upstash Redis
- **Why:** Serverless Redis for rate limiting, brute-force protection, and idempotency keys without managing Redis.
- **Alternatives rejected:** Self-managed Redis (ops), DB-only counters (hot rows, contention).
- **Replace when:** Move to managed Redis/Vercel KV if pricing/latency shifts; usage is behind a small rate-limit adapter.

### Sentry / pino / PostHog (observability trio, kept distinct)
- **Why:** Sentry for exceptions, pino structured logs for operational tracing, PostHog for product analytics — deliberately three concerns, never conflated with **audit events** (which live in Postgres).
- **Alternatives rejected:** Datadog (overkill/cost early), console logging (unstructured), analytics-in-audit-table (privacy + volume mistake).
- **Replace when:** Scale/cost → self-host PostHog; swap Sentry for an OTel backend if standardizing on OpenTelemetry.

### Vitest / pgTAP / Playwright (testing)
- **Why:** Vitest is fast and ESM-native; **pgTAP** tests RLS/constraints *in the database* (the only trustworthy place to prove isolation); Playwright covers cross-browser + mobile + a11y.
- **Alternatives rejected:** Jest (slower ESM story), Cypress (Playwright has better cross-browser/mobile + parallelism), application-only RLS tests (insufficient — must test the DB itself).
- **Replace when:** Unlikely; these are stable choices.

### GitHub + GitHub Actions
- **Why:** Source control + CI in one place, huge ecosystem, easy Vercel/Supabase integration, branch protection.
- **Alternatives rejected:** GitLab CI (fine, but GitHub's ecosystem and agent familiarity win), CircleCI (extra vendor).
- **Replace when:** Not anticipated.

### Vercel
- **Why:** First-class Next.js hosting, preview deployments per PR, easy env separation, edge/serverless.
- **Alternatives rejected:** Netlify (weaker Next.js parity), self-host on a VPS/Fly (more ops), AWS Amplify (rougher DX).
- **Replace when:** Egress/compute cost or a need for long-running workers → move the worker to a dedicated runtime (Fly/Render) while keeping the web on Vercel, or containerize.

---

## Deviations from the preferred starting direction

| Preferred direction | Decision | Reason |
|---------------------|----------|--------|
| "A managed background-job provider" | **Inngest** (with Trigger.dev as documented alternative) | Named explicitly; best fit for step-based document processing + scheduling on serverless. |
| "A dedicated transactional email provider" | **Resend** (Postmark as switch target) | Named explicitly; best DX now, clear deliverability escape hatch. |
| Google + Microsoft auth | **Kept**, via Supabase Auth OAuth (Azure provider = Microsoft) | Supabase supports both. |
| SAML/SSO | **Deferred to WorkOS**, additive later | Supabase Auth is not the enterprise-SSO answer; abstract identity now, add WorkOS in Phase 16/Enterprise. |
| (unspecified) rate limiting | **Added Upstash Redis** | Needed for brute-force/secure-link protection and idempotency keys. |
| (unspecified) RLS testing tool | **Added pgTAP** | Isolation must be proven in-database. |
| (unspecified) monorepo tool | **Turborepo over plain workspaces** | CI caching/pipelines justified by worker + multiple test suites. |
| Storybook | **Deferred**; use a lightweight in-repo component playground first | Avoid early tooling weight; Storybook reconsidered in Phase 3 if component volume warrants. |
| SMS | **Deferred** (not in foundation) | Phase 1 marks SMS as Expansion; email + in-app only at foundation. |
| Stripe | **Deferred to Phase 16** | Billing is not part of the foundation. |

---

## Version-selection policy

- **Runtime:** Node LTS (even-numbered) pinned via `.nvmrc`/`"engines"`; pnpm pinned via `packageManager` field.
- **Frameworks:** Track the latest **stable** major of Next.js/React; adopt a new major only after it is stable and our E2E/smoke suite passes on a branch.
- **Pinning:** Exact-ish ranges with a committed lockfile; security patches auto-batched by Renovate; majors are manual, tested PRs.
- **Supabase CLI** version pinned in the repo so local/CI generate identical types and run identical migrations across Windows and Linux.
- Full policy in [environments-and-delivery.md](./environments-and-delivery.md) and the dependency section of [architecture-decisions.md](./architecture-decisions.md).

---

## Technologies intentionally deferred (designed-for, not installed)

| Deferred | Introduced in | Seam that makes it additive |
|----------|---------------|-----------------------------|
| AI extraction/classification provider | Phase 15 | `packages/ai` adapter; writes only to `*_suggestion` fields. |
| Dedicated search (Typesense/OpenSearch) | Expansion | `packages/search` adapter; Postgres FTS behind the same interface. |
| S3/R2 object storage | Scale trigger | `packages/storage` adapter; S3-compatible keys already used. |
| WorkOS SSO/SCIM | Enterprise | Identity/session module; additive to Supabase Auth. |
| Stripe billing | Phase 16 | `packages/billing` adapter. |
| Procore/ACC integrations | Enterprise | `packages/integrations/*` adapters; app never depends on them. |
| SMS | Expansion | Notification channel interface already multi-channel. |

---

*Continue to [repository-structure.md](./repository-structure.md).*

# FILE: /docs/architecture/open-decisions.md

> **Document status:** Phase 2 architecture — decisions that genuinely need **founder input or external validation**. Everything else has been decided professionally in the architecture docs; this list is intentionally short.
> **Format per item:** Decision · Why it matters · Recommended default · Alternatives · Deadline · Blocks Phase 2 implementation?

---

## OD-1 — Brand/app domain and owner-portal URL scheme
- **Decision:** Final production domain (e.g., `app.closeoutflow.com`) and whether owner portals are served on a path (`/owner/...`), a subdomain (`portal.…`), or a per-org custom domain (Enterprise later).
- **Why it matters:** Affects DNS, email domain, cookie scope, CSP, and branding on the owner portal (a long-term customer touchpoint).
- **Recommended default:** Single app domain with owner portals on a path/route group now; reserve per-org custom domains for Enterprise.
- **Alternatives:** Subdomain per audience; custom domains early (more ops).
- **Deadline:** Before Task 14 (cloud/Vercel wiring) for production; a placeholder domain is fine for non-prod.
- **Blocks Phase 2?** **No** (non-prod works on Vercel URLs). Blocks production launch only.

## OD-2 — Cloud accounts & billing owner for managed services
- **Decision:** Who owns and funds the Supabase, Vercel, GitHub org, Inngest, Resend, Sentry, PostHog, and Upstash accounts; naming and access.
- **Why it matters:** These are infrastructure with secrets and cost; a founder must create them and set secrets (Codex cannot).
- **Recommended default:** Create a shared company GitHub org + a shared billing account; both founders as admins; start on free/low tiers.
- **Alternatives:** Personal accounts (avoid — poor continuity/security).
- **Deadline:** Supabase/Vercel/GitHub before Task 14–15; Inngest/Resend before Phase 8/10; Sentry/PostHog before or during Task 17.
- **Blocks Phase 2?** **Partially** — Tasks 14–15 (cloud wiring, CI secrets, branch protection) require founder action. Tasks 0–13 do not.

## OD-3 — Preview database strategy (per-PR project vs. shared non-prod)
- **Decision:** Whether each PR gets an isolated Supabase project/branch DB, or previews share one non-prod project.
- **Why it matters:** Cost vs. isolation for preview environments; must **never** touch prod data either way.
- **Recommended default:** Shared non-prod Supabase project for previews at first (cheaper), with per-PR schema/seed isolation; move to Supabase branch DBs if PR volume/isolation needs grow.
- **Alternatives:** Per-PR project (cleaner, costlier/more setup).
- **Deadline:** Before Task 14.
- **Blocks Phase 2?** **No** — the default is chosen; founder can override.

## OD-4 — Data residency & region
- **Decision:** Primary region for Supabase/Storage and PostHog (US vs EU), and whether any customer will demand a specific region.
- **Why it matters:** Latency, cost, and future compliance (privacy, possible EU customers). Hard to change after data exists.
- **Recommended default:** US region primary (target market is US commercial GCs), PostHog configured privacy-consciously (EU cloud or self-host option kept open).
- **Alternatives:** EU-primary; multi-region later.
- **Deadline:** Before Task 14 (region is set at project creation).
- **Blocks Phase 2?** **No**, but the choice is effectively permanent for that project — confirm before creating prod.

## OD-5 — UUID generation strategy (v4 default now vs. app-generated v7)
- **Decision:** Keep `gen_random_uuid()` (v4) at foundation, or add application-generated **UUIDv7** in `packages/db` for index locality on high-volume tables.
- **Why it matters:** Affects insert/index performance on `documents`/`audit_events` at scale; low impact early.
- **Recommended default:** v4 default now; adopt v7 generation in `packages/db` before high-volume tables ship (Phase 8). No schema change required to switch.
- **Alternatives:** v7 from day one (marginal early benefit).
- **Deadline:** Before Phase 8 (document engine).
- **Blocks Phase 2?** **No.**

## OD-6 — Malware-scanning provider
- **Decision:** Hosted scanning API vs. self-hosted ClamAV in the worker.
- **Why it matters:** Security control on the highest-risk (file) path; cost vs. ops tradeoff.
- **Recommended default:** Decide at Phase 8; design now abstracts it. Lean hosted API first (less ops), ClamAV if cost/volume warrants.
- **Alternatives:** ClamAV-in-worker; storage-provider-native scanning if available.
- **Deadline:** Before Phase 8.
- **Blocks Phase 2?** **No** (seam only in Phase 2).

## OD-7 — Legal/compliance content sign-off (carried from Phase 1)
- **Decision:** Attorney review of lien-waiver, warranty, retention, and org-deletion/owner-continuity language; construction-professional review of default templates/taxonomy.
- **Why it matters:** Legal reliance on records is a top product risk; the architecture provides disclaimers/audit but not legal correctness.
- **Recommended default:** Schedule reviews before the relevant feature phases (Phase 12 for waivers/warranty; ongoing for retention/deletion).
- **Alternatives:** none — this is validation, not a technical choice.
- **Deadline:** Before Phase 12; retention/deletion policy text before production launch.
- **Blocks Phase 2?** **No.**

## OD-8 — Storybook vs. in-repo playground for component docs
- **Decision:** Adopt Storybook in Phase 3, or continue with the lightweight in-repo playground.
- **Why it matters:** Tooling weight vs. component-documentation value for two founders.
- **Recommended default:** In-repo playground now; reconsider Storybook in Phase 3 if component volume warrants.
- **Alternatives:** Storybook from Phase 2 (heavier).
- **Deadline:** Phase 3.
- **Blocks Phase 2?** **No** (default chosen).

## OD-9 — License for the repository
- **Decision:** Private/proprietary (default for a commercial SaaS) vs. any source-available choice.
- **Why it matters:** IP posture.
- **Recommended default:** Private/proprietary, `UNLICENSED` in `package.json`.
- **Alternatives:** Source-available (unlikely for this product).
- **Deadline:** Task 1.
- **Blocks Phase 2?** **Trivially** — needed at repo init; default is safe.

---

## Summary: what blocks Phase 2 implementation
Only **founder infrastructure actions** block, and only from **Task 14 onward**:
- Create GitHub org + Supabase (non-prod) + Vercel projects, set env vars/secrets (OD-2).
- Enable branch protection + CI secrets (OD-2/Task 15).
- Confirm region before creating any cloud project (OD-4).

**Tasks 0–13 (local foundation) are fully unblocked** and can proceed immediately. No open decision requires a product-behavior invention; all defaults above are safe to proceed on if a founder does not object.

---

*End of open-decisions.md. See repository guidance in [/AGENTS.md](../../AGENTS.md) and [/CLAUDE.md](../../CLAUDE.md).*

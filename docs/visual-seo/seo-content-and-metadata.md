# FILE: /docs/visual-seo/seo-content-and-metadata.md

> **Document status:** Phase 6E-A specification — technical + content SEO for the public site. **Planning only.**
> **Framework note:** the repo runs **Next.js 16 (App Router, React 19, Turbopack)**. Use the App Router Metadata API (`export const metadata` / `generateMetadata`), file conventions `app/robots.ts`, `app/sitemap.ts`, `app/(marketing)/opengraph-image.*`, and JSON-LD via inline `<script type="application/ld+json">`. **Re-validate exact APIs and search-engine guidance at implementation time** (§Stable-vs-recheck) — treat framework/SEO specifics as recommendations to confirm, not fixed facts.

## 1. Honest search intent → do not keyword-stuff

Target real intent from people looking for software to organize construction closeout. Every page earns its keywords with genuine content; no doorway pages.

## 2. Topic clusters

- **Primary cluster (pillar = homepage + `/product`):** *construction closeout software*, *project closeout software*, *commercial construction closeout*.
- **Requirements cluster (`/closeout-requirements`):** *closeout requirement tracking*, *closeout responsibility tracking*, *construction project documentation requirements*, *project handoff organization*.
- **Templates cluster (`/requirement-templates`):** *closeout template management*, *construction closeout checklist software*.
- **Audience cluster (`/for-general-contractors`):** *contractor closeout tracking*, *general contractor closeout*.
- **Trust cluster (`/security`):** *closeout software security / access control* (supporting, not high-volume).
- **Future clusters (defer):** educational *construction closeout checklist* hub, comparison, integrations — only when content/features exist.

## 3. Page → query → intent map

| Page | Primary query | Intent | Title (≤60) | Meta description (≤155) |
|------|---------------|--------|-------------|--------------------------|
| `/` | construction closeout software | commercial | "Construction Closeout Software — Closeout" | "Organize every closeout requirement, owner, and due date in one place before handoff. Built for commercial general contractors." |
| `/product` | project closeout software | commercial/info | "Product Overview — Closeout" | "See how Closeout organizes closeout scope: projects, requirements, reusable templates, responsibility, and due dates." |
| `/closeout-requirements` | closeout requirement tracking | info/commercial | "Closeout Requirement Tracking — Closeout" | "Track every closeout requirement, who's responsible, and when it's due — with a clear, filterable register." |
| `/requirement-templates` | closeout checklist software | commercial | "Requirement Templates — Closeout" | "Capture your closeout standard once and apply it to every project with reusable, versioned requirement templates." |
| `/security` | closeout software security | trust | "Security & Access Control — Closeout" | "Tenant isolation, role-based access, and an immutable audit trail keep every project's closeout data private." |
| `/for-general-contractors` | general contractor closeout | audience | "Closeout Software for General Contractors — Closeout" | "Give your PMs and coordinators one place to organize closeout requirements across every commercial project." |
| `/about` | (brand) | brand | "About — Closeout" | "Closeout is closeout-management software for commercial construction teams." |

Titles use the existing `%s · Closeout` / `— Closeout` convention (confirm at implementation). Descriptions are honest, benefit-led, no filler.

## 4. Metadata strategy

- Per-page `metadata`/`generateMetadata`: title, description, canonical (`alternates.canonical`), Open Graph (title/description/url/site_name=Closeout/image), Twitter card (`summary_large_image`), robots directives.
- `metadataBase = https://closeoutflow.com` (preserve existing). Canonical is self-referential per public page; app/auth routes keep their `noindex`.
- OG images: a branded default (existing) + optional per-cluster OG using real product framing; never private data.

## 5. Indexing & privacy rules (authoritative)

| Surface | Directive |
|---------|-----------|
| Public marketing pages, public legal | **index, follow** |
| Homepage | index, follow, self-canonical |
| `/request-access` | index or noindex per FD-6 (default: index the page, noindex the thank-you) |
| All `(auth)` routes | **noindex** |
| Invitations, onboarding, org creation/selection, MFA, recovery, reauth | **noindex** |
| All `(app)` routes (dashboard, projects, requirements, templates, directories, settings, account, platform) | **noindex** (already enforced by `(app)/layout.tsx`) |
| Error/utility pages | noindex |
| `/design`, playground, diagnostics | **not routable in prod** (404) |

Private data must never appear in public metadata, OG generation, structured data, sitemap, public SSR markup, cached marketing responses, or snippets. Public pages import **no** authenticated data source.

## 6. Sitemap & robots

- `app/sitemap.ts` → `MetadataRoute.sitemap` listing **only** public indexable pages with `lastModified`; never enumerate private/app routes.
- `app/robots.ts` → `MetadataRoute.robots`: allow crawling of public paths; `disallow` app/auth/onboarding/settings/account/platform/design/api; reference the sitemap. Preserve existing robots behavior for private routes.

## 7. Structured data (truthful only)

Emit via JSON-LD on the relevant public page; nothing fabricated.

| Type | Where | Notes |
|------|-------|-------|
| `Organization` | homepage/footer (site-wide) | name, url, logo (Keystone Fold), sameAs (real profiles only) |
| `WebSite` | homepage | name + url; add `SearchAction` **only if** a real site search exists (it won't at launch — omit) |
| `SoftwareApplication` | `/product` | name, applicationCategory (BusinessApplication), operatingSystem (Web), description — **no** `offers`, `aggregateRating`, or price until billing/reviews exist |
| `BreadcrumbList` | all deep public pages | mirrors visible breadcrumbs |
| `FAQPage` | homepage/relevant page | **only** where the FAQ is genuinely visible on that page |

**Never** emit ratings, reviews, pricing, offers, customers, awards, certifications, aggregateRating, or testimonials. Flag `SoftwareApplication` and `FAQPage` for implementation-time validation against current Google structured-data guidance (both have historically shifted eligibility).

## 8. Semantic structure, headings, internal linking, a11y

- One `<h1>` per page; logical `h2/h3`; landmark structure (`header`/`nav`/`main`/`footer`); skip link; crawlable server-rendered content (Server Components — hero/content are HTML, not JS-gated).
- Internal linking: homepage links to each cluster page; cluster pages cross-link (requirements ↔ templates ↔ product), all link to a single primary CTA; footer provides a stable global link set. Breadcrumbs on deep pages.
- Accessible nav (keyboard, focus, contrast); descriptive image alt text on all product frames; no text-in-image for key content.

## 9. Open Graph / Twitter / favicon

- Reuse Phase 5E assets: favicon set, PWA icons, `opengraph.png` default, social avatar, apple-touch; add per-page OG where a distinct visual helps. Favicon behavior unchanged.

## 10. Content freshness & future content

- Marketing copy owned in-repo; update `lastModified` on change. Future educational content (closeout checklist guides), case studies (only real), and comparison pages are additive under the cluster structure — recheck structured-data/eligibility when added.

## 11. Stable vs. recheck-at-implementation

- **Stable requirements:** noindex on all private/app/auth routes; no private data in any public output; self-canonical public pages; truthful structured data only; one h1/semantic headings; sitemap lists public pages only; brand assets reused.
- **Recheck at implementation (Next 16 + current search guidance):** exact Metadata API surface, `robots.ts`/`sitemap.ts` signatures, `opengraph-image` conventions, JSON-LD injection pattern, `SoftwareApplication`/`FAQPage` rich-result eligibility, canonical/hreflang if internationalization is ever added.

## Acceptance criteria (SEO)

- Every public page: unique title/description/canonical, correct robots, valid OG/Twitter, one h1, crawlable SSR content.
- Sitemap/robots expose only public pages; app/auth remain noindex and disallowed.
- Structured data validates and contains no fabricated entities.
- Lighthouse SEO ≥ 95 on public pages (target, verify at implementation).

---

*Continue to [accessibility-performance-and-safety.md](./accessibility-performance-and-safety.md).*

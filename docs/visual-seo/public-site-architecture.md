# FILE: /docs/visual-seo/public-site-architecture.md

> **Document status:** Phase 6E-A specification — public marketing website architecture. **Planning only; no public pages built this phase.** Today `/` `redirect("/dashboard")`s — there is no public site.
> **Truthfulness rule (absolute):** the public site may describe only implemented capabilities (Phase 4/5/6): auth/orgs/roles, projects, companies/contacts, internal teams, requirement categories, versioned templates, requirement registers, responsibility, dates, bulk actions, project overview, security/RLS/audit. It may **not** advertise uploads, document management, submission portals, reviews, approvals, owner handoff, package generation, AI, integrations, or billing until those exist.

## 1. Route-group strategy

- Add a real public surface under the existing `(marketing)` route group with its **own layout** (marketing header/footer, indexable, no app shell). The public site and the authenticated app are separate layouts; private data never enters public rendering paths ([accessibility-performance-and-safety.md §Safety](./accessibility-performance-and-safety.md)).
- `/` becomes the homepage (remove the dashboard redirect for signed-out users; signed-in users may be routed to `/dashboard` via a safe check, but the homepage itself is public/indexable).

## 2. Smallest strong launch IA (recommended)

Ship a focused, truthful set — not a page-per-keyword farm:

| Page | Path | Index | Intent | Ship at launch? |
|------|------|:-----:|--------|:---------------:|
| Homepage | `/` | ✅ | brand + category + honest value + CTA | **Yes** |
| Product overview | `/product` | ✅ | how Closeout organizes closeout scope today | **Yes** |
| Closeout requirements | `/closeout-requirements` | ✅ | register/responsibility/dates value + intent keyword | **Yes** |
| Requirement templates | `/requirement-templates` | ✅ | reusable versioned templates value | **Yes** |
| Security & access | `/security` | ✅ | tenant isolation, roles, audit (real strengths) | **Yes** |
| For general contractors | `/for-general-contractors` | ✅ | audience use-case | **Recommended** |
| About | `/about` | ✅ | company/mission, founder credibility | **Yes** |
| Request access | `/request-access` | ✅ (or noindex per FD-6) | conversion (waitlist/access) | **Yes** |
| Legal (Privacy, Terms) | `/privacy`, `/terms` | ✅ | trust + required | **Yes** |
| Sign in | `/sign-in` | noindex | entry to app | exists |

**Defer** (build when the capability or content exists): project-organization deep page, companies-and-contacts page, closeout-checklist educational hub, comparison pages, integration pages, pricing (no billing yet). Do **not** create a page solely to target a query.

## 3. Homepage architecture (premium, honest)

Top-to-bottom, reusing product tokens (engineered-blue, Keystone Fold, IBM Plex, surface ladder):

1. **Header:** logo + lean nav (Product · Requirements · Templates · Security · About) + **Sign in** (secondary) + **Request access / Create account** (primary per FD-3/FD-6).
2. **Hero:** category statement — "Construction closeout software" — + honest value proposition ("Organize every closeout requirement, who owns it, and when it's due — in one place, before handoff."). One strong **real product visual** via `ProductFrame` (a framed real screenshot of the requirement register or project overview — never stock/clichés). Primary + secondary CTA.
3. **Category clarity band:** one line on what closeout is and who it's for (commercial GCs), no jargon.
4. **Real workflow section:** 3 honest steps — *Set up the project & team → Apply a template / add requirements → Assign responsibility & dates, track what needs attention.* Framed screenshots of each.
5. **Requirement & template value:** the register + templates as the core differentiator vs. spreadsheets/email ("capture your closeout standard once, reuse it on every project").
6. **Project coordination value:** projects + reusable companies/contacts + internal teams (real Phase 5).
7. **Security & access section:** tenant isolation, role-based access, immutable audit — real strengths, stated plainly (no fake certifications/claims).
8. **Who it's for:** commercial general contractors / project managers / closeout coordinators.
9. **Honest product-state CTA:** clear about current stage (early/growing product), primary CTA per FD-3.
10. **FAQ:** only real-capability questions ("What does Closeout do today?", "Does it handle document uploads/reviews yet?" → honest "not yet; requirement organization first", "Is my data isolated?", "How much does it cost?" → honest "pricing announced at launch" if no billing).
11. **Footer:** product links, security, about, legal, sign in; Keystone Fold; no fake trust badges.

**Prohibited:** fake customer logos, testimonials, usage stats, awards, certifications, security claims, integrations, invented ROI, "AI-powered", generic "streamline your workflow" filler, construction clichés (hard hats/cranes/blueprint grids/stock photos).

## 4. Product visuals

- Use **real product screenshots** framed by `ProductFrame` (browser/device chrome), captured from the seeded demo org with obviously-sample data, light + dark. No illustration of non-existent features. Alt text describes the real UI.

## 5. Conversion strategy

- **Primary CTA:** per FD-3 — either "Create an account" (if public signup is open) or "Request access / Join the waitlist" (if request-only). Default recommendation: **Request access** until the product/pricing is launch-ready, with "Sign in" secondary. Do **not** invent a free trial, pricing plan, or sales process.
- **CTA placement:** header (primary), hero (primary + secondary "See the product"), section ends, footer, mobile sticky bar.
- **Request-access form:** minimal (name, work email, company, optional role); privacy-safe; spam protection (honeypot + rate limit; CAPTCHA only if needed and accessible); success = clear confirmation ("We'll be in touch"), no fake instant provisioning.
- **Analytics events** (future implementation, privacy-safe): `public_cta_click`, `request_access_started`, `request_access_submitted`, `sign_in_click` — no PII/private data ([accessibility-performance-and-safety.md §Analytics](./accessibility-performance-and-safety.md)).

## 6. Visual connection to the product

- Same tokens, type, brand, and surface ladder as the app, with marketing-only rhythm (`--section-pad`, larger hero type). The site should feel like the front door of the same building — calm, engineered, construction-credible, not a generic blue-gradient SaaS page.

## 7. Extensibility

- IA is additive: educational content (`/closeout-checklist`, guides), case studies, comparison pages, and integration pages are added **only when supportable** by real capability/content. Structured data and internal linking (below) are designed to absorb them without rework.

## Acceptance criteria (public site)

- Every claim maps to an implemented capability; a truthfulness pass gates launch.
- Homepage + core pages are indexable, fast, accessible, mobile-first, and visually one system with the app.
- No prohibited content (fake proof, unbuilt features, clichés).
- Private data never rendered; public pages use no authenticated data source.

---

*Continue to [seo-content-and-metadata.md](./seo-content-and-metadata.md).*

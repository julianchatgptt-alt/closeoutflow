# FILE: /docs/visual-seo/route-inventory.md

> **Document status:** Phase 6E-A specification — exhaustive route census. **Locked before 6E-B implementation begins.**
> **Method:** enumerated from `apps/web/app/**` route files and confirmed against the live application. Classification, indexing, data source, and redesign priority per route.

## 1. Classification legend

- **PUB-IDX** public + indexable (none exist today — all are 6E-B *new*)
- **PUB-NX** public but noindex
- **AUTH** authentication
- **INV** invitation / onboarding
- **APP** authenticated application
- **DEV** development-only
- **SYS** error / system
- **RDR** redirect / compatibility
- **PREV** honest later-phase preview placeholder

**Redesign priority:** P0 (flagship, redesign first) · P1 (high) · P2 (medium) · P3 (light refinement) · N (new build) · — (no visual work).

## 2. Authenticated application routes (`(app)` group — all noindex via `(app)/layout.tsx` `robots:{index:false}`)

| Route | Class | Purpose | Data source | Access | Current visual | Content truth | Primary problems | Priority | Logic untouched | Screenshot |
|-------|-------|---------|-------------|--------|----------------|---------------|------------------|:--------:|:---:|:---:|
| `/dashboard` | APP | Portfolio landing | **Static mock** (`components/dashboard/*`) | any member | Flat; `PREVIEW` pill | **Fake** (Phase 8/9/11 language) | Fabricated review/submission/risk metrics; generic stat row; no focal point | **P0** | yes | ✔ |
| `/projects` | APP | Project list | `search_projects` RPC | member (scoped) | Table+cards, sound | Real | Generic table density; weak first viewport | P1 | yes | ✔ |
| `/projects/new` | APP | Create project | server action | `project.create` | Simple form | Real | Light polish | P3 | yes | ✔ |
| `/projects/[id]` | APP | Project overview | `get_project_overview` + `get_requirement_summary` | project access | Multi-panel; good | Real (Phase 6 panel honest) | Panel parity/hierarchy; grows cluttered | P1 | yes | ✔ |
| `/projects/[id]/settings` | APP | Identity/lifecycle | server actions | `project.update` | Sectioned form | Real | Settings-card feel | P2 | yes | ✔ |
| `/projects/[id]/team` | APP | Internal team | Phase 5 | `project.manage_team` | List+dialog | Real | Card sameness | P2 | yes | ✔ |
| `/projects/[id]/companies` | APP | Project companies | Phase 5 | `project.manage_companies` | 2-col | Real | Reuse clarity | P2 | yes | ✔ |
| `/projects/[id]/contacts` | APP | Project contacts | Phase 5 | `project.manage_contacts` | 2-col | Real | Reuse clarity | P2 | yes | ✔ |
| `/projects/[id]/activity` | APP | Audit timeline | `get_project_activity` | `project.view` | Timeline | Real | Density/scan | P2 | yes | ✔ |
| `/projects/[id]/requirements` | APP | **Requirement register** | `search_project_requirements` + `get_requirement_summary` | `requirement.view` | Grouped table+cards, strong | Real | Bulk bar polish; premium table system | **P0** | yes | ✔ |
| `/projects/[id]/requirements/apply` | APP | Apply template | `get_template_preview` + apply RPC | `requirement.apply_template` | 2-screen flow | Real | Long single column | P1 | yes | ✔ |
| `/projects/[id]/requirements/[rid]` | APP | Requirement detail | table read + actions | `requirement.view` | 2-col detail | Real | Section hierarchy | P1 | yes | ✔ |
| `/projects/[id]/{documents,reviews,equipment,warranties,inspections,training,lien-waivers,drawings,package}` | PREV | Honest previews | none | `project.view` | `PreviewPill` placeholder | **Honest placeholder** (keep) | Preview treatment refinement | P3 | yes | ✔ (1 sample) |
| `/templates` | APP | **Template library** | Phase 6 | `template.view` | Table, sound | Real | First-class polish | **P0** | yes | ✔ |
| `/templates/new` | APP | Create template | server action | `template.manage` | Form | Real | Light | P3 | yes | ✔ |
| `/templates/[id]` | APP | Detail / builder / version chain | Phase 6 | `template.view/manage` | 2-col builder | Real | Builder hierarchy; version chain | **P0** | yes | ✔ |
| `/companies` | APP | Company directory | Phase 5 | `company.view` | Table+cards | Real | Table system | P1 | yes | ✔ |
| `/companies/new` | APP | Create company | server action | `company.create` | Form + dedupe | Real | Light | P3 | yes | ✔ |
| `/companies/[id]` | APP | Company detail | Phase 5 | `company.view` | Detail | Real | Relationship presentation | P2 | yes | ✔ |
| `/contacts` | APP | Contact directory | Phase 5 | `contact.view` | Table+cards | Real | Table system | P1 | yes | ✔ |
| `/contacts/new` | APP | Create contact | server action | `contact.create` | Form + dedupe | Real | Light | P3 | yes | ✔ |
| `/contacts/[id]` | APP | Contact detail | Phase 5 | `contact.view` | Detail | Real | Affiliations; "not a user" framing | P2 | yes | ✔ |
| `/team` | APP | Org team (top-level) | Phase 4 | member | List | Real | Overlaps `/settings/team` (consolidate?) | P2 | yes | ✔ |
| `/settings` → `/settings/general` | APP | Settings index | Phase 4 | member | 2-pane | Real | Card-grid feel | P2 | yes | ✔ |
| `/settings/general` | APP | Org general | Phase 4 | `organization.view` | Form | Real | — | P2 | yes | ✔ |
| `/settings/organization` | APP | Org settings | Phase 4 | `organization.update` | Form | Real | — | P2 | yes | ✔ |
| `/settings/members` · `/settings/team` | APP | Members/roles/invites | Phase 4 | `organization.manage_members` | Table+dialogs | Real | Table + invite polish | P2 | yes | ✔ |
| `/settings/roles` | APP | Role reference | Phase 4 | member | Static | Real | — | P3 | yes | ✔ |
| `/settings/templates` | RDR | → `/templates` | — | — | redirect | — | — | — | yes | — |
| `/settings/trades` | PREV | Trades (disabled) | none | member | Disabled | Honest placeholder | Keep disabled | P3 | yes | — |
| `/settings/{billing,integrations,api-keys,security}` | PREV | Disabled settings | none | member | Disabled | Honest placeholder | Keep disabled | P3 | yes | — |
| `/reports` | PREV | Reports (disabled) | none | member | Disabled | Honest placeholder | Keep disabled | P3 | yes | — |
| `/account/profile` · `/account/preferences` · `/account/security` · `/account/sessions` | APP | Account self-service | Phase 4 | self | Forms/lists | Real | Consistency | P2 | yes | ✔ |

## 3. Authentication routes (`(auth)` group — noindex)

| Route | Class | Purpose | Access | Current | Priority | Screenshot |
|-------|-------|---------|--------|---------|:--------:|:---:|
| `/sign-in` | AUTH | Sign in | public | Phase 5E split-screen (strong) | P3 (refine only) | ✔ |
| `/sign-up` | AUTH | Register | public | Phase 5E | P3 | ✔ |
| `/forgot-password` · `/reset-password` | AUTH | Recovery | public | Phase 5E | P3 | ✔ |
| `/verify-email` | AUTH | Verification | public | Phase 5E | P3 | ✔ |
| `/mfa/challenge` | AUTH | MFA step-up | session | Phase 5E | P3 | ✔ |
| `/reauthenticate` | AUTH | Reauth gate | session | Phase 5E | P3 | ✔ |

## 4. Invitation / onboarding / org-context routes (noindex)

| Route | Class | Purpose | Access | Current | Priority | Screenshot |
|-------|-------|---------|--------|---------|:--------:|:---:|
| `/invite/[token]` | INV | Accept invitation | token | Phase 5E (masked preview) | P3 | ✔ |
| `/onboarding` | INV | Post-signup setup | new user | Phase 5E | P2 | ✔ |
| `/select-organization` | INV | Org chooser | multi-org user | Phase 5E | P2 | ✔ |
| (org creation) | INV | Create organization | authed | via onboarding/select | P2 | ✔ |

## 5. Platform / system / dev routes

| Route | Class | Purpose | Indexing | Priority | Screenshot |
|-------|-------|---------|----------|:--------:|:---:|
| `/platform` | APP | Platform-admin surface | noindex | platform_admin only | P3 | ✔ |
| `/not-found` (`not-found.tsx`) | SYS | Branded 404 | noindex | any | P2 | ✔ |
| `/error` (`error.tsx`) | SYS | Root error boundary | noindex | any | P2 | ✔ |
| `(app)/projects/{loading,error}.tsx` | SYS | Route loading/error | noindex | any | P1 (skeleton system) | ✔ |
| Permission-denied surfaces | SYS | `PermissionDenied` / non-enumerating 404 | noindex | any | P2 | ✔ |
| `/design` (`(dev)`) | DEV | Component gallery | 404 in prod | — | — | — |
| `(marketing)/playground` | DEV | Design playground | dev-only | — | — | — |

## 6. Public root — the SEO gap (6E-B new work)

| Route | Today | 6E-B |
|-------|-------|------|
| `/` (`(marketing)/page.tsx`) | `redirect("/dashboard")` — **no public content** | **PUB-IDX homepage (N)** |
| `/product`, `/closeout-requirements`, `/requirement-templates`, `/project-organization`, `/security`, `/for-general-contractors`, `/about`, `/request-access`, legal | do not exist | **PUB-IDX / PUB-NX (N)** per [public-site-architecture.md](./public-site-architecture.md) |

## 7. Counts

- **Authenticated app pages:** ~40 (incl. project sub-nav, settings, account).
- **Honest previews (keep):** 9 project modules + 5 settings + reports + trades.
- **Auth/invite/onboarding:** ~11.
- **System/dev:** ~6.
- **Public indexable today:** **0** (critical SEO gap).
- **Flagship P0 redesign targets:** dashboard, requirement register, template library, template builder, public homepage.

## 8. Locked-inventory rule

This inventory is the authoritative route list for 6E-B. Implementation may not introduce a new authenticated route for purely visual reasons; new routes are limited to the approved public marketing pages ([public-site-architecture.md](./public-site-architecture.md)). Any deviation is a blocking issue, not a silent change.

---

*Continue to [current-visual-audit.md](./current-visual-audit.md).*

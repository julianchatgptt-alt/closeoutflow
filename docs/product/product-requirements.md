# FILE: /docs/product/product-requirements.md

> **Document status:** Phase 1 blueprint — permanent source of truth.
> **Scope:** Product requirements. This document does not decide the technology stack, database engine, or hosting model except where a product decision genuinely depends on it.
> **Companion documents:** [user-roles.md](./user-roles.md), [workflows.md](./workflows.md), [statuses.md](./statuses.md), [feature-roadmap.md](./feature-roadmap.md), [glossary.md](./glossary.md).

---

## A. Executive summary

**What CloseoutFlow is.**
CloseoutFlow is a web-based construction **closeout management platform**. It is a specialized command center that collects, reviews, organizes, approves, and delivers every document required to close out a commercial construction project. It runs as a responsive website and installable PWA. It is not a native mobile app, and it is not a general construction-management platform.

**Who it serves.**
The primary paying customer is the **small-to-midsize commercial general contractor (GC)** — companies that complete projects such as restaurants, retail buildouts, medical offices, churches, private schools, offices, warehouses, municipal buildings, and smaller apartment projects, usually coordinating several subcontractors per job. Inside those companies the daily users are **project managers (PMs)** and **closeout coordinators**. The platform also serves **subcontractors** who submit documents, **external reviewers** (architects, engineers, consultants, owner's reps) who approve them, and **building owners** who receive the final handoff.

**What problem it solves.**
Closeout is the phase where a construction project's documentation obligations come due: O&M manuals, warranties, as-builts, testing and commissioning reports, inspection certificates, lien waivers, training records, and more. Today, GCs chase this documentation through email, spreadsheets, shared drives, and phone calls. The work is manual, error-prone, and invisible: nobody has a single reliable view of what is required, what has been submitted, what has been approved, and what is still missing. Projects stall at closeout, final payment is delayed, and owners receive disorganized handoff packages that lose value the day the job ends.

**Why customers would pay.**
CloseoutFlow replaces the spreadsheet-and-email chase with a structured system that (1) defines exactly what each project and each subcontractor owes, (2) collects it through secure upload links that require no subcontractor login, (3) routes it through explicit review and approval, (4) tracks completeness with explainable automation, and (5) produces a professional, permanent owner handoff package and digital O&M portal. The value is faster closeout, faster final payment, fewer missing documents, less manual filing, and a durable building record that raises the GC's reputation with owners.

**How it differs from full construction-management platforms.**
Procore, Autodesk Construction Cloud, and similar systems manage the *entire* project lifecycle — scheduling, budgets, RFIs, submittals, daily logs, change orders. Closeout is one late-stage module inside them, and it is widely considered weak. CloseoutFlow is the opposite shape: it does **one phase deeply**. It is deliberately narrow, works standalone, does not require the GC to switch project-management systems, and is designed to integrate with those systems later rather than replace them.

**Intended long-term product position.**
CloseoutFlow aims to become the category-defining "closeout command center" for commercial GCs, and — through the owner portal — the durable system of record for a completed building's equipment, warranties, manuals, and certificates. The long-term moat is the accumulated, structured, searchable building record that stays valuable to owners for years after substantial completion, pulling future projects and referrals back to the GC and to the platform.

---

## B. Product goals

Goals are expressed as outcomes with measurable targets. Targets are **initial hypotheses to validate**, not commitments.

| ID | Goal | Measurable outcome | Initial target |
|----|------|--------------------|----------------|
| G-1 | Reduce time chasing subcontractors | Median hours/week a coordinator spends on manual document follow-up | −60% vs. customer's pre-adoption baseline |
| G-2 | Increase on-time closeout | % of projects reaching *Published* by their target closeout date | ≥ 80% |
| G-3 | Reduce missing documents at handoff | Avg. count of unresolved required items at package publish | < 1 per project |
| G-4 | Reduce manual file organization | Coordinator hours spent renaming/foldering files per project | −75% vs. baseline |
| G-5 | Improve owner handoff quality | Owner satisfaction / handoff-package rating | ≥ 4.3 / 5 |
| G-6 | Preserve searchable building records | % of published projects whose owner portal is accessed ≥ once after 90 days | ≥ 40% |
| G-7 | Fast requirement fulfillment | Median days from requirement *Requested* → *Submitted* | ≤ 10 days |
| G-8 | Reliable automation | File-processing failure rate (upload → available) | < 1% |
| G-9 | Commercial viability | Logo retention at 12 months | ≥ 85% |
| G-10 | Expansion | Net revenue retention (seats + projects) | ≥ 110% |

Every goal above must map to at least one metric in [Section J](#j-product-success-metrics).

---

## C. Non-goals

CloseoutFlow will **not** attempt to become any of the following, in the initial product or as a core module. It may integrate with tools that do them.

- Full construction scheduling / critical-path management
- Employee time tracking, payroll, or HR
- General accounting or general ledger
- Full estimating or takeoff
- Full bid management or contractor marketplace / lead generation
- Material purchasing / procurement
- Equipment fleet management
- General field-service management
- Residential tenant management, rent collection, or general property management
- Full CRM / sales pipeline
- Complete daily construction reporting (daily logs)
- Full change-order or project-financial management
- Native iOS/Android applications (initial product is web + responsive PWA)
- Legally binding e-signature issuance as a first-party service (it will **integrate** with a signature provider, but will not become one)
- A general document-management system for non-closeout content

**Non-goal principle:** any proposed feature that would primarily serve a phase of construction *other than closeout* is out of scope and must be rejected during design unless it is an integration.

---

## D. Target customers

### D-1. Primary customer profile — Small/Midsize Commercial GC

| Attribute | Description |
|-----------|-------------|
| Company size | 10–250 employees; roughly $5M–$250M annual revenue |
| Active projects | 5–60 concurrent projects |
| Annual project volume | 15–150 completed projects/year |
| Project types | Restaurants, retail, medical/dental offices, churches, private schools, offices, warehouses, municipal buildings, small multifamily |
| Typical project size | $250K–$40M contract value |
| Subs per project | 5–30 subcontractors |
| Current closeout workflow | Email threads, a per-project spreadsheet or a master closeout log, shared network drive / SharePoint / Google Drive / Dropbox folders, phone calls |
| Current tools | May run Procore, Autodesk Construction Cloud, or Bluebeam for PM; often no dedicated closeout tool; some use nothing but Excel + email |
| Purchasing roles | Owner/principal, VP of operations, director of project management, or a senior PM champion; IT rarely the buyer but sometimes a gatekeeper |
| Budget authority | Ops leader can typically approve low-thousands/month SaaS without board sign-off |

### D-2. Pain points

- No single source of truth for "what's required vs. what's in."
- Coordinators spend hours/week nagging subs; requests get ignored or buried.
- Documents arrive misnamed, in the wrong format, or incomplete, and get lost in folders.
- Approvals happen informally (email "looks good"), leaving no audit trail.
- Final payment / retention release is delayed because closeout drags.
- Owner handoff is a rushed zip file or binder that the owner can't use later.
- Warranty start dates and equipment data are scattered and later unrecoverable.

### D-3. Reasons a customer may refuse to buy

- "We already pay for Procore/ACC — why another tool?"
- Fear of yet another login for already-overloaded PMs.
- Skepticism that subcontractors will actually use it.
- Concern that partial adoption creates *two* systems of record.
- Perceived low urgency ("we get closeout done eventually").
- Data-security / client-confidentiality concerns.
- Weak willingness to pay for a "phase" tool vs. a whole-project platform.
- Owner/GC contractually required to deliver in a specific competitor's format.

Each refusal reason maps to a mitigation in [Section K](#k-major-product-risks).

---

## E. User personas

Personas below define the twelve user types. Permissions here are summaries; the authoritative model is [user-roles.md](./user-roles.md).

### E-1. Platform Administrator (CloseoutFlow staff)
- **Responsibilities:** Operate the platform; support tenants; manage plans, feature flags, incident response.
- **Goals:** Keep the system healthy; resolve support issues quickly; never mishandle customer data.
- **Frustrations:** Debugging tenant issues without over-broad data access.
- **Technical comfort:** High.
- **Most-used workflows:** Support impersonation (audited, consented), incident response, plan management.
- **Info needed:** System health, tenant metadata, audit logs.
- **Should have:** Platform-level administration, gated/audited support access.
- **Should NOT have:** Silent access to tenant document *contents* without a logged, consented support session.

### E-2. Organization Owner (customer principal / ops leader)
- **Responsibilities:** Owns the company workspace, billing, top-level settings.
- **Goals:** Faster closeout across the portfolio; predictable cost; control over who has access.
- **Frustrations:** No portfolio visibility; can't tell which projects are at risk.
- **Technical comfort:** Medium.
- **Most-used workflows:** Company analytics, billing, user management, project-risk overview.
- **Info needed:** Portfolio dashboards, at-risk projects, spend.
- **Should have:** All org-level powers including billing, user removal, org deletion, integrations.
- **Should NOT have:** Nothing withheld at org scope; still bound by two-person/MFA gates on destructive actions.

### E-3. Organization Administrator
- **Responsibilities:** Day-to-day admin of users, offices/divisions, templates, integrations.
- **Goals:** Keep the workspace organized and users provisioned.
- **Frustrations:** Manual onboarding; inconsistent templates across PMs.
- **Technical comfort:** Medium-high.
- **Most-used workflows:** User invites, template management, office/division setup.
- **Should have:** Org settings, user management (except transferring ownership), templates, integrations.
- **Should NOT have:** Billing ownership transfer, org deletion (owner-only).

### E-4. Project Manager
- **Responsibilities:** Owns delivery of assigned projects, including closeout.
- **Goals:** Get to substantial/final completion fast; keep subs moving; clean handoff.
- **Frustrations:** Chasing subs; not knowing what's outstanding; last-minute closeout scramble.
- **Technical comfort:** Medium.
- **Most-used workflows:** Create project, apply template, assign requirements, monitor dashboard, escalate, publish package.
- **Info needed:** Per-project completeness, overdue items, risk score, who owes what.
- **Should have:** Full control of *assigned* projects.
- **Should NOT have:** Access to unassigned projects (unless granted "view all"), billing, org deletion.

### E-5. Closeout Coordinator
- **Responsibilities:** Executes the collection and organization work across projects.
- **Goals:** Zero missing documents; minimal manual chasing; tidy records.
- **Frustrations:** Repetitive follow-up; misfiled/misnamed files; duplicate submissions.
- **Technical comfort:** Medium.
- **Most-used workflows:** Assign requirements, send upload invites, classify/verify documents, first-pass review, reminders, build package.
- **Info needed:** What's overdue, what needs classification, what's awaiting review.
- **Should have:** Broad project-execution rights across assigned projects (upload, classify, first-stage review, reminders).
- **Should NOT have:** Final external approvals (unless also a reviewer), billing, project deletion by default.

### E-6. Internal Reviewer
- **Responsibilities:** Reviews/approves documents on behalf of the GC.
- **Goals:** Confirm submissions meet spec before owner/AE review.
- **Frustrations:** Reviewing in email; no version clarity.
- **Most-used workflows:** Review queue, annotate PDFs, approve/reject with reasons.
- **Should have:** Review, approve, reject, annotate on assigned projects/requirements.
- **Should NOT have:** Template editing, user management, publishing (unless also PM).

### E-7. External Architect / Engineer Reviewer
- **Responsibilities:** Design-professional review/approval of specific submittals (e.g., as-builts, commissioning).
- **Goals:** Review only what's assigned, quickly, from anywhere.
- **Frustrations:** Being forced to create accounts; digging through email.
- **Technical comfort:** Medium; often mobile.
- **Most-used workflows:** Open secure reviewer link, view/annotate, approve/reject.
- **Should have:** Scoped, time-limited access to assigned items only; annotate; approve/reject.
- **Should NOT have:** Any org data beyond assigned items; download of unrelated files.

### E-8. Other External Consultant
- Same shape as E-7 but for non-AE specialists (commissioning agent, envelope consultant, IT/AV). Scoped, link-based, assignment-limited.

### E-9. Subcontractor Company Administrator
- **Responsibilities:** Manages their company's participation across one or many GCs' projects (optional permanent account).
- **Goals:** See everything their company owes; delegate to staff; reuse warranties/manuals.
- **Frustrations:** Re-uploading the same manual to every GC; unclear requirements.
- **Most-used workflows:** Accept invite, view assigned requirements, upload, manage their contributors.
- **Should have:** View/act on their own company's assigned requirements across projects that invited them; manage their own contributors.
- **Should NOT have:** Any visibility into other subs, GC internal notes, or unrelated project data.

### E-10. Subcontractor Contributor
- **Responsibilities:** Uploads documents for assigned requirements. **Most common external user.** Often uses only an account-free link.
- **Goals:** Fulfill the request in minutes, from a phone, without a login.
- **Frustrations:** Confusing portals, mandatory accounts, unclear "what do you want from me."
- **Technical comfort:** Low-to-medium; mobile-first.
- **Most-used workflows:** Open link → see checklist → upload files → done.
- **Should have:** Upload to *their* assigned requirements only; see status of their own items.
- **Should NOT have:** Any other project data; ability to approve, delete history, or view other subs.

### E-11. Owner / Client Representative
- **Responsibilities:** Receives and uses the final handoff; long-term building record consumer.
- **Goals:** Find manuals, warranties, certificates, and equipment info when needed — for years.
- **Frustrations:** Losing the handoff binder; not knowing warranty terms; can't find the AC manual.
- **Technical comfort:** Low-to-medium.
- **Most-used workflows:** Browse/search owner portal, download documents, look up equipment/warranty.
- **Should have:** Read/download access to *published* records for their building(s).
- **Should NOT have:** Access to in-progress internal review, rejected drafts, GC internal notes, other owners' data.

### E-12. Read-Only Viewer
- **Responsibilities:** Observes without changing anything (e.g., exec, auditor, junior staff).
- **Goals:** Situational awareness.
- **Should have:** View scoped to grant; no create/edit/approve/download-restricted actions.
- **Should NOT have:** Any state-changing action; export unless explicitly granted.

> **Cross-context principle:** A person may hold different roles in different organizations and different projects. Roles are *assignments in a scope*, never a global attribute of a user. See [user-roles.md §A](./user-roles.md).

---

## F. Complete module inventory

Legend — **Tier:** `Launch` (initial release), `Expansion` (post-launch), `Enterprise` (higher tier / larger customers).

| # | Module | Purpose | Main users | Core functions | Key relationships | Major risks | Tier |
|---|--------|---------|-----------|----------------|-------------------|-------------|------|
| 1 | **Authentication** | Verify identity for internal users and optional external accounts; secure account-free access. | All | Email/password + MFA, SSO (ent.), session mgmt, secure tokenized links, reauth for sensitive actions | Underlies every module | Account takeover; link leakage | Launch (SSO = Enterprise) |
| 2 | **Organizations** | Multi-tenant workspaces; the isolation boundary. | Org owner/admin | Create org, settings, offices/divisions, branding | Parent of projects, users, templates | Cross-tenant leakage | Launch |
| 3 | **Teams & Permissions** | Map users → roles → scopes. | Owner/admin | Invite, assign roles per scope, remove, audit | Enforces all module access | Privilege escalation | Launch |
| 4 | **Projects** | The unit of closeout work. | PM, coordinator | Create, configure, status, archive, transfer | Contains requirements, docs, equipment, package | Data mis-scoping | Launch |
| 5 | **Contacts** | People/companies attached to a project. | PM, coordinator | CRUD contacts, roles, link to subs/reviewers/owners | Feeds assignments, invites | Stale contacts | Launch |
| 6 | **Subcontractors** | Directory of sub companies + contributors. | Coordinator, sub admin | Directory, reusable across projects, contributors | Assignment targets | Sub turnover | Launch |
| 7 | **Trades / Divisions** | Classify work by CSI division/trade. | Coordinator | Taxonomy, tag requirements/subs | Drives templates/rules | Taxonomy drift | Launch |
| 8 | **Requirement Templates** | Reusable closeout checklists. | Admin, PM | Create/version templates, items, defaults | Applied to projects | Template sprawl | Launch |
| 9 | **Rules Engine** | Conditional inclusion of requirements. | Admin, PM | Conditions (trade present, project type, etc.) → include/require items | Feeds project requirements | Opaque logic | Expansion (simple rules at Launch) |
| 10 | **Project Requirements** | The concrete obligations for one project. | PM, coordinator | Instantiate, assign, status, exceptions | Fulfilled by submissions | Requirement vs doc confusion | Launch |
| 11 | **Upload Portal** | External submission surface. | Subs | Account-free + account upload, checklist, mobile | Creates submissions/docs | Abuse, wrong files | Launch |
| 12 | **Document Management** | Store, version, classify files. | Coordinator, reviewers | Upload, versioning, classification, metadata, storage | Backs requirements/equipment/package | Storage cost, corruption | Launch |
| 13 | **Review Workflows** | Approve/reject documents & requirements. | Reviewers | Single/multi-stage, parallel, decisions, conditions | Gates requirement completion | Bottlenecks | Launch |
| 14 | **PDF Annotations** | Comment/markup on documents. | Reviewers | Highlights, comments, stamps, threads | Attached to reviews | Rendering fidelity | Launch (basic) / Expansion (advanced) |
| 15 | **Communication Center** | Requirement- and project-level messages/notes. | Internal + external | Threaded messages, internal notes, records | Ties to requirements/reviews | Info leakage internal↔external | Launch |
| 16 | **Notifications** | Deliver alerts across channels. | All | Email, in-app; SMS (Expansion); preferences | Triggered by workflows | Deliverability, spam | Launch (email+in-app) |
| 17 | **Dashboards** | Operational visibility. | PM, coordinator, owner-org | Project + portfolio views, filters | Reads all modules | Metric mistrust | Launch |
| 18 | **Analytics** | Company-wide trends. | Org leaders | Aggregations, benchmarks, exports | Reads historical data | Misleading stats | Expansion |
| 19 | **Project-Risk Engine** | Explainable risk scoring. | PM, leaders | Score + reasons, drivers, trends | Reads requirements/reviews/reminders | Black-box distrust | Expansion |
| 20 | **Warranties** | Track warranty terms & dates. | Coordinator, owner | Register, start/end, coverage, docs | Links equipment/documents/owner portal | Wrong dates → liability | Launch (register) / Expansion (alerts) |
| 21 | **Equipment Registry** | Building asset records. | Coordinator, owner | Assets, model/serial, location, QR | Links warranties/manuals/O&M | Data accuracy | Launch (records) / Expansion (QR) |
| 22 | **Inspections & Certificates** | Track inspections/certs incl. CO. | Coordinator, AHJ-facing | Register, dates, issuing authority, docs | Feeds package/owner portal | Compliance reliance | Launch |
| 23 | **Training Records** | Owner training events. | Coordinator, owner | Sessions, attendees, materials, sign-off | Feeds package/owner portal | Proof-of-training disputes | Launch (basic) |
| 24 | **Lien-Waiver Tracking** | Track waivers by sub/pay-app. | Coordinator, PM | Types (cond./uncond., progress/final), status | Ties to subs/payment milestones | Legal validity | Launch (tracking only) |
| 25 | **As-Built Drawings** | Manage record-drawing revisions. | Coordinator, AE | Revision sets, version history, review | Links documents/package | Version confusion | Launch |
| 26 | **Package Builder** | Assemble final closeout package. | PM, coordinator | Select scope, structure, completeness check, generate | Reads everything approved | Incomplete/incorrect package | Launch |
| 27 | **Digital O&M Manual** | Structured, navigable O&M. | Coordinator, owner | Organize by system/equipment, link docs | Built from equipment/docs/warranties | Effort to structure | Launch (structured export) / Expansion (rich) |
| 28 | **Owner Portal** | Long-term owner handoff surface. | Owner reps | Browse, search, download published records | Consumes published package | Long-term access/cost | Launch |
| 29 | **Search** | Find across projects/docs/equipment/comments. | Internal (all-scope), owner (own-scope) | Full-text + metadata, filters, permissions-aware | Reads all indexed data | Leaking across tenants | Launch (basic) / Expansion (advanced) |
| 30 | **Reports** | Structured outputs. | Leaders, PM | Standard reports, schedule/export | Reads modules | Stale/incorrect data | Expansion |
| 31 | **Imports & Exports** | Bring data in / take it out. | Admin, coordinator | CSV import (contacts/subs/reqs), bulk export, org export | Feeds contacts/subs/requirements | Bad data mapping | Launch (import subset) / Expansion (full) |
| 32 | **Integrations** | Connect external systems. | Admin | Storage, email, e-sign, PM systems (Procore/ACC) | Sync/attach external data | API fragility | Expansion / Enterprise |
| 33 | **API & Webhooks** | Programmatic access. | Admin, developers | REST API, webhooks, keys, scopes | External automation | Security, versioning | Enterprise |
| 34 | **Billing** | Subscriptions & per-project charges. | Owner/admin | Plans, seats, per-project, invoices, trials | Gates feature access | Dunning, over/under-billing | Launch |
| 35 | **Platform Administration** | Operate the platform. | Platform admin | Tenant mgmt, flags, support access, incident tools | Cross-tenant (gated) | Over-broad access | Launch (internal) |
| 36 | **Security & Audit Logging** | Traceability & controls. | All (write) / admin (read) | Audit events, access controls, retention, exports | Records actions from all modules | Gaps = untraceable actions | Launch |

---

## G. Functional requirements

**Priority scale:** `P0` (launch-blocking), `P1` (launch strongly desired), `P2` (post-launch), `P3` (enterprise/experimental).
**Format:** Statement · Role · Priority · Dependencies · Acceptance criteria · Edge cases.

### Authentication (AUTH)

**AUTH-001 — Email/password authentication with verification**
- *Statement:* Internal users authenticate via email + password; email must be verified before first login completes.
- *Role:* Internal users. *Priority:* P0. *Deps:* —
- *Acceptance:* Unverified accounts cannot access org data; password meets configurable complexity; failed logins are rate-limited and audited.
- *Edge cases:* Verification link expired → re-request; email already tied to another org (see AUTH-006 multi-org).

**AUTH-002 — Multi-factor authentication (MFA)**
- *Statement:* Users can enable TOTP MFA; org admins can require MFA for all internal members.
- *Role:* All internal. *Priority:* P1. *Deps:* AUTH-001.
- *Acceptance:* When required, non-MFA users are forced to enroll before proceeding; MFA is mandatory for sensitive actions (see AUTH-007); recovery codes issued once.
- *Edge cases:* Lost device → recovery codes or admin-assisted reset (audited); MFA required mid-session → step-up prompt.

**AUTH-003 — Secure account-free access links**
- *Statement:* The system issues tokenized links that grant scoped, time-limited access to specific requirements/reviews without an account.
- *Role:* Subcontractor contributor, external reviewer, owner rep. *Priority:* P0. *Deps:* —
- *Acceptance:* Token grants access only to the linked scope; link has an expiration; link can be revoked instantly; all actions via the link are audited with the link identity; opening a link never exposes unrelated data.
- *Edge cases:* Expired/revoked link → friendly re-request flow; forwarded link (see AUTH-008 verification); token in URL must never carry PII (NFR-PRIV-002).

**AUTH-004 — Optional permanent external accounts**
- *Statement:* External participants may upgrade a link into a permanent account to see all items assigned to them across projects/orgs.
- *Role:* Sub admin/contributor, external reviewer. *Priority:* P1. *Deps:* AUTH-001, AUTH-003.
- *Acceptance:* Upgrading preserves prior submissions/history; account aggregates only items explicitly assigned to that identity.
- *Edge cases:* Same person invited under two emails → merge flow (Expansion); account created but never invited to anything → sees empty state.

**AUTH-005 — Session management & reauthentication**
- *Statement:* Sessions expire after inactivity; sensitive actions require recent authentication (step-up).
- *Role:* All. *Priority:* P0. *Deps:* AUTH-001.
- *Acceptance:* Idle timeout configurable at org level within platform bounds; sensitive actions (Section D of user-roles) prompt reauth if session age exceeds threshold; sessions can be revoked by admins.
- *Edge cases:* Concurrent sessions; forced logout on password change; revoked session mid-action fails safely.

**AUTH-006 — Multi-organization membership**
- *Statement:* One identity may belong to multiple organizations and switch context.
- *Role:* Internal + external. *Priority:* P1. *Deps:* AUTH-001, ORG-001.
- *Acceptance:* Context switch is explicit; permissions never bleed across orgs; audit records the active org context per action.
- *Edge cases:* Removed from one org retains others; suspended in one org unaffected in others.

**AUTH-007 — Step-up MFA for sensitive actions**
- *Statement:* Defined sensitive actions require a fresh MFA challenge regardless of session age.
- *Role:* Owner/admin. *Priority:* P1. *Deps:* AUTH-002.
- *Acceptance:* Actions in [user-roles §D](./user-roles.md) trigger step-up; failure blocks the action and is audited.
- *Edge cases:* MFA not enrolled but action requires it → forced enrollment first.

**AUTH-008 — External link identity confirmation**
- *Statement:* Before an external actor performs a state-changing action, they confirm identity (name/email or one-time code) tied to the link.
- *Role:* External. *Priority:* P1. *Deps:* AUTH-003.
- *Acceptance:* Uploads/approvals record a confirmed actor identity; optional one-time email code for higher assurance on approvals.
- *Edge cases:* Forwarded link used by a different person → captured/flagged; revocation available.

**AUTH-009 — SSO / enterprise auth**
- *Statement:* Enterprise orgs can enforce SAML/OIDC SSO and SCIM provisioning for internal users.
- *Role:* Enterprise admin. *Priority:* P3. *Deps:* AUTH-001.
- *Acceptance:* SSO-enforced orgs disable password login for members; deprovisioning revokes access.
- *Edge cases:* Break-glass admin access; external participants remain link/account based (not SSO).

### Organizations (ORG)

**ORG-001 — Create organization**
- *Statement:* A user can create an organization, becoming its Owner.
- *Role:* Any authenticated user. *Priority:* P0. *Deps:* AUTH-001.
- *Acceptance:* New org is fully isolated; creator is Owner; a default template set is provided.
- *Edge cases:* Same user creating multiple orgs; org name collisions allowed (unique by ID, not name).

**ORG-002 — Organization settings & branding**
- *Statement:* Owner/admin manage org profile, branding (used on portals/packages), and defaults.
- *Role:* Owner/admin. *Priority:* P1. *Deps:* ORG-001.
- *Acceptance:* Branding appears on owner portal and generated packages; changes audited.
- *Edge cases:* Branding on already-published packages is frozen at publish time (see PKG-007).

**ORG-003 — Offices / divisions**
- *Statement:* An org can define offices/divisions; projects and users can be scoped to them.
- *Role:* Owner/admin. *Priority:* P2. *Deps:* ORG-001.
- *Acceptance:* Division scoping filters visibility/analytics; a user can belong to multiple divisions.
- *Edge cases:* Project reassigned between divisions preserves history; deleting a division requires reassigning its projects.

**ORG-004 — Tenant isolation guarantee**
- *Statement:* No org's data is ever readable by another org through any interface.
- *Role:* System. *Priority:* P0. *Deps:* ORG-001.
- *Acceptance:* Every data access is scoped by org; automated tests assert cross-tenant denial on every entity; search never returns other tenants' data.
- *Edge cases:* Shared external identities (a sub in two orgs) see strictly separated data per org.

**ORG-005 — Organization export & deletion**
- *Statement:* Owner can export all org data and can close/delete the org.
- *Role:* Owner. *Priority:* P1. *Deps:* ORG-001, EXP-001.
- *Acceptance:* Export produces a complete, structured archive; deletion is a two-step, MFA-gated, delayed (grace-period) action; published owner portals are handled explicitly (see OWNER-009).
- *Edge cases:* Deletion with active owner portals must warn and require an explicit decision on owner access continuity.

### Teams & Permissions (TEAM)

**TEAM-001 — Invite internal users with a role in a scope**
- *Statement:* Owner/admin invite users and assign a role at org and/or project scope.
- *Role:* Owner/admin. *Priority:* P0. *Deps:* ORG-001, AUTH-001.
- *Acceptance:* Invitation email issued; role takes effect on acceptance; role/scope is auditable and editable.
- *Edge cases:* Invite to existing platform user adds membership without new account; pending invite revocable.

**TEAM-002 — Role assignment & change**
- *Statement:* Authorized admins change a member's role within a scope.
- *Role:* Owner/admin. *Priority:* P0. *Deps:* TEAM-001.
- *Acceptance:* Permission changes take effect immediately and are audited; a user cannot elevate their own privileges.
- *Edge cases:* Removing the last Owner is blocked; downgrading a PM mid-project reassigns or warns.

**TEAM-003 — Remove/suspend user**
- *Statement:* Admins remove or suspend a user from a scope.
- *Role:* Owner/admin. *Priority:* P0. *Deps:* TEAM-001.
- *Acceptance:* Removed user loses access immediately; their historical actions remain attributed; suspension preserves data but blocks login.
- *Edge cases:* Removing a PM triggers project-ownership reassignment prompt (see [workflows §38 transfer]).

**TEAM-004 — Scoped visibility (assigned vs all projects)**
- *Statement:* A role can be limited to assigned projects or granted org-wide "view all."
- *Role:* Owner/admin set; PM/coordinator receive. *Priority:* P1. *Deps:* TEAM-002.
- *Acceptance:* "Assigned only" users cannot see other projects anywhere (lists, search, analytics).
- *Edge cases:* Division-scoped "view all" limited to that division.

### Projects (PROJ)

**PROJ-001 — Create project**
- *Statement:* PM/admin create a project with core metadata (name, type, owner, address, target closeout date).
- *Role:* PM+/admin. *Priority:* P0. *Deps:* ORG-001.
- *Acceptance:* Project starts in `Draft`; assignable to a PM and division; audit recorded.
- *Edge cases:* Duplicate project names allowed; project without owner contact allowed until publish.

**PROJ-002 — Project lifecycle status**
- *Statement:* Projects move through the lifecycle defined in [statuses §A](./statuses.md).
- *Role:* PM. *Priority:* P0. *Deps:* PROJ-001.
- *Acceptance:* Only allowed transitions are permitted; each transition is audited; certain transitions gated by completeness (e.g., cannot Publish with unresolved P0 requirements unless waived).
- *Edge cases:* Reopen after publish creates a new package version (see PKG-009); cancel preserves records.

**PROJ-003 — Archive project**
- *Statement:* Completed/cancelled projects can be archived (read-only) while preserving owner portal.
- *Role:* PM/admin. *Priority:* P1. *Deps:* PROJ-002.
- *Acceptance:* Archived projects are read-only, still searchable by authorized users, and their owner portal remains live.
- *Edge cases:* Unarchive is possible and audited.

**PROJ-004 — Transfer project ownership**
- *Statement:* A project's PM can be reassigned to another user.
- *Role:* Admin/current PM. *Priority:* P1. *Deps:* PROJ-001, TEAM-002.
- *Acceptance:* New PM gains full rights; prior PM's history preserved; assignments unaffected; audited.
- *Edge cases:* Transfer to a user without seat/permission blocked; bulk transfer on employee departure.

### Contacts & Subcontractors (CONT / SUB)

**CONT-001 — Manage project contacts**
- *Statement:* Add/edit/remove contacts with roles (owner, AE, consultant, sub, internal).
- *Role:* PM/coordinator. *Priority:* P0. *Deps:* PROJ-001.
- *Acceptance:* Contacts drive invitations and assignments; audit on change.
- *Edge cases:* A contact leaving a company is deactivated, not deleted (history preserved); reassign their open items.

**SUB-001 — Subcontractor directory**
- *Statement:* Maintain an org-level directory of subcontractor companies and contributors, reusable across projects.
- *Role:* Coordinator/admin. *Priority:* P0. *Deps:* ORG-001.
- *Acceptance:* A sub added once can be attached to many projects; contributors tracked per company.
- *Edge cases:* Sub used on multiple projects; sub contact turnover (see workflow §4/§38).

**SUB-002 — Import contacts/subs (CSV)**
- *Statement:* Bulk import contacts/subcontractors via mapped CSV.
- *Role:* Coordinator/admin. *Priority:* P1. *Deps:* SUB-001, IMP-001.
- *Acceptance:* Preview + field mapping + validation before commit; row-level error reporting; no partial silent import.
- *Edge cases:* Duplicate detection; malformed rows quarantined, not dropped silently.

### Trades / Divisions (TRADE)

**TRADE-001 — Trade/division taxonomy**
- *Statement:* Provide a standard construction-division taxonomy (e.g., CSI MasterFormat divisions) and allow org customization.
- *Role:* Admin. *Priority:* P1. *Deps:* ORG-001.
- *Acceptance:* Requirements, subs, and template items can be tagged by trade/division; used by rules engine.
- *Edge cases:* Custom trades; retiring a trade preserves historical tags.

### Requirement Templates (TMPL)

**TMPL-001 — Create/version requirement templates**
- *Statement:* Admin/PM build reusable templates listing requirement items with attributes (type, trade, default reviewer chain, mandatory/optional, expected format).
- *Role:* Admin/PM. *Priority:* P0. *Deps:* TRADE-001.
- *Acceptance:* Templates are versioned; editing creates a new version; existing projects reference the version applied.
- *Edge cases:* Editing a template does **not** retroactively change projects already using an earlier version unless explicitly re-applied (see TMPL-003).

**TMPL-002 — Default template library**
- *Statement:* Ship starter templates by project type (restaurant, retail, medical, warehouse, etc.).
- *Role:* System/admin. *Priority:* P1. *Deps:* TMPL-001.
- *Acceptance:* New orgs get a curated set; templates are editable copies.
- *Edge cases:* Starter content must be reviewed by a construction professional before shipping (see completion review).

**TMPL-003 — Re-apply/merge template into an existing project**
- *Statement:* A user can re-apply an updated template to a project, choosing to add new items without destroying existing progress.
- *Role:* PM. *Priority:* P2. *Deps:* TMPL-001, REQ-001.
- *Acceptance:* Merge previews additions/changes; never deletes submitted/approved items silently; audited.
- *Edge cases:* Conflicts between template item and locally modified requirement resolved by explicit user choice.

### Rules Engine (RULE)

**RULE-001 — Conditional requirement inclusion**
- *Statement:* Rules include/require template items based on conditions (project type, present trades, contract value threshold, owner type).
- *Role:* Admin/PM. *Priority:* P2 (basic conditions may be P1). *Deps:* TMPL-001, TRADE-001.
- *Acceptance:* When a template is applied, rules evaluate and produce the concrete requirement set; each included/excluded item shows *which rule* caused it (explainability).
- *Edge cases:* Contradictory rules resolved by explicit precedence; changing project attributes re-evaluates with a preview (never silent removal of submitted items).

### Project Requirements (REQ)

**REQ-001 — Instantiate project requirements**
- *Statement:* Applying a template (via rules) creates concrete requirement records on the project.
- *Role:* PM/coordinator. *Priority:* P0. *Deps:* TMPL-001, RULE-001.
- *Acceptance:* Each requirement has type, trade, responsible party (to be assigned), status (`Not assigned`), reviewer chain, and due date.
- *Edge cases:* Applying multiple templates merges without duplicates (dedupe by item key).

**REQ-002 — Add project-specific requirement**
- *Statement:* PM/coordinator add ad-hoc requirements not in any template.
- *Role:* PM/coordinator. *Priority:* P0. *Deps:* REQ-001.
- *Acceptance:* Ad-hoc requirement behaves identically to templated ones; optionally promotable to a template item.
- *Edge cases:* Duplicate of a templated requirement flagged.

**REQ-003 — Assign requirement to responsible party**
- *Statement:* Assign a requirement to a subcontractor company/contact (or internal party).
- *Role:* PM/coordinator. *Priority:* P0. *Deps:* REQ-001, SUB-001.
- *Acceptance:* Assignment sets responsible party and due date; status → `Requested` on invite; assignee visible only to authorized users.
- *Edge cases:* Reassignment mid-flight preserves prior submissions; unassigned-but-due requirement flagged `Missing`.

**REQ-004 — Requirement status lifecycle**
- *Statement:* Requirements follow [statuses §B](./statuses.md), separate from document statuses.
- *Role:* System/PM/reviewer. *Priority:* P0. *Deps:* REQ-003, DOC-*, REV-*.
- *Acceptance:* Requirement completion is driven by review outcomes of its submissions, **not** by upload alone; a requirement is `Complete` only when its governing review chain approves.
- *Edge cases:* Multiple documents per requirement; partial submission; superseded documents.

**REQ-005 — Requirement exception request**
- *Statement:* An assignee or internal user can request an exception (extension, alternative document, or "not applicable").
- *Role:* Sub/internal → decided by PM. *Priority:* P1. *Deps:* REQ-003.
- *Acceptance:* Exception is recorded with reason; PM approves/denies; outcome audited; status reflects `Not applicable requested` etc.
- *Edge cases:* Exception on an already-approved requirement blocked; exception affecting package completeness surfaced in package check.

**REQ-006 — Mark requirement Not Applicable**
- *Statement:* PM marks a requirement N/A with a reason.
- *Role:* PM. *Priority:* P0. *Deps:* REQ-001.
- *Acceptance:* N/A removes it from "missing" counts but remains visible with reason and actor; audited; reversible.
- *Edge cases:* N/A after submissions exist warns and preserves the submissions.

**REQ-007 — Waive requirement**
- *Statement:* PM waives a requirement (accepting non-fulfillment) with a reason and optional approval gate.
- *Role:* PM (optionally two-person). *Priority:* P1. *Deps:* REQ-001.
- *Acceptance:* Waiver documented with justification and authority; distinct from N/A (waiver = "required but excused"; N/A = "was never required"); audited; may require owner-level permission for P0 items.
- *Edge cases:* Waiving a legally sensitive requirement surfaces a warning (see risk register).

### Upload Portal (PORT)

**PORT-001 — Account-free upload experience**
- *Statement:* A subcontractor opening a secure link sees only their assigned requirement checklist and can upload files per item.
- *Role:* Sub contributor. *Priority:* P0. *Deps:* AUTH-003, REQ-003.
- *Acceptance:* Mobile-first; shows requirement descriptions and expected formats; supports multi-file and photo upload; confirms submission; no other project data visible.
- *Edge cases:* Wrong file type warned but not hard-blocked (coordinator can reclassify); large files handled (NFR-FILE-003); offline/interrupted upload resumable where feasible.

**PORT-002 — Bulk & folder upload**
- *Statement:* Users can upload many files at once, including folder structures.
- *Role:* Sub, coordinator. *Priority:* P1. *Deps:* PORT-001, DOC-001.
- *Acceptance:* Progress per file; partial failures reported per file; successful files persist even if others fail.
- *Edge cases:* Duplicate filenames; nested folders; zip handling policy defined.

**PORT-003 — Submission confirmation & status visibility**
- *Statement:* After submitting, the assignee sees each item's status (submitted, under review, approved, rejected, replacement requested).
- *Role:* Sub. *Priority:* P1. *Deps:* PORT-001, REV-*.
- *Acceptance:* Assignee sees only their own items' statuses and reviewer feedback intended for them; internal notes hidden.
- *Edge cases:* Rejection with reason prompts re-upload; expired link → re-request.

### Document Management (DOC)

**DOC-001 — Upload & store documents**
- *Statement:* Files are uploaded, stored securely, and associated with a requirement (or later an equipment/warranty/etc.).
- *Role:* Sub, coordinator. *Priority:* P0. *Deps:* —
- *Acceptance:* Files scanned for malware; stored encrypted at rest; size/type limits enforced with clear errors; each file gets an immutable stored version.
- *Edge cases:* Malware detected → `Quarantined`; unsupported type; zero-byte file rejected.

**DOC-002 — Document versioning & history**
- *Statement:* Replacing a document creates a new version; prior versions are retained and never silently overwritten.
- *Role:* All uploaders. *Priority:* P0. *Deps:* DOC-001.
- *Acceptance:* Full version history with actor/time; an approved document cannot be replaced without creating a new version and re-triggering review; superseded versions are marked, not deleted.
- *Edge cases:* Concurrent uploads; replacing during active review supersedes the in-flight version with notice.

**DOC-003 — Document classification (AI-assisted + manual)**
- *Statement:* Documents are classified by type (O&M, warranty, as-built, etc.); AI suggests, humans confirm.
- *Role:* System (suggest), coordinator (confirm). *Priority:* P1. *Deps:* DOC-001.
- *Acceptance:* AI classification always shown as a *suggestion* with confidence and rationale; a human can accept/override; classification never auto-approves a requirement.
- *Edge cases:* Low-confidence → flagged for manual; misclassification correctable and audited.

**DOC-004 — Metadata extraction**
- *Statement:* Extract metadata (dates, model/serial, manufacturer, warranty terms) to pre-fill equipment/warranty records.
- *Role:* System (suggest), coordinator (confirm). *Priority:* P2. *Deps:* DOC-003.
- *Acceptance:* Extracted fields are suggestions requiring confirmation before they populate authoritative records; source and confidence shown.
- *Edge cases:* Wrong extraction must be easily corrected; never overwrite human-entered values silently.

**DOC-005 — Document lifecycle status**
- *Statement:* Documents follow [statuses §C](./statuses.md).
- *Role:* System. *Priority:* P0. *Deps:* DOC-001.
- *Acceptance:* Statuses reflect processing/availability/review state distinctly from requirement status.
- *Edge cases:* Failed processing retryable; quarantined recoverable by admin only.

**DOC-006 — AI completeness checking**
- *Statement:* AI flags likely-incomplete submissions (e.g., O&M missing sections) as *warnings with reasons*.
- *Role:* System. *Priority:* P2. *Deps:* DOC-003.
- *Acceptance:* Completeness findings are advisory, explainable, and never block or auto-approve; coordinator decides.
- *Edge cases:* False positives dismissible with note.

### Review Workflows (REV)

**REV-001 — Single-stage review**
- *Statement:* A submission is reviewed by one reviewer who approves, approves-with-conditions, or rejects with reasons.
- *Role:* Internal/external reviewer. *Priority:* P0. *Deps:* DOC-001, REQ-003.
- *Acceptance:* Decision recorded with reason and actor; approval advances the requirement per its rule; rejection notifies assignee.
- *Edge cases:* Reviewer unavailable → reassign; document superseded mid-review cancels the stale review.

**REV-002 — Multi-stage sequential review**
- *Statement:* A submission passes through an ordered chain (e.g., coordinator → PM → AE → owner), each stage gating the next.
- *Role:* Reviewers in chain. *Priority:* P1. *Deps:* REV-001.
- *Acceptance:* Later stages open only after earlier approval; any rejection returns to the assignee (configurable to return to a prior stage); each stage audited.
- *Edge cases:* Skipping a stage requires explicit authority; conditional approval carries conditions forward.

**REV-003 — Parallel review**
- *Statement:* Multiple reviewers review the same submission simultaneously; completion policy is configurable (all-approve vs. any-approve vs. quorum).
- *Role:* Reviewers. *Priority:* P2. *Deps:* REV-001.
- *Acceptance:* Policy explicit per requirement; conflicting decisions resolved by defined rule (default: any rejection blocks).
- *Edge cases:* One reviewer rejects while another approves → requirement not complete; recorded.

**REV-004 — Decision reasons & conditions**
- *Statement:* Approvals-with-conditions and rejections require a reason; conditions are tracked to closure.
- *Role:* Reviewer. *Priority:* P0. *Deps:* REV-001.
- *Acceptance:* Conditions appear on the requirement until satisfied; package completeness accounts for open conditions.
- *Edge cases:* Condition never closed blocks `Complete`.

**REV-005 — Review reassignment & delegation**
- *Statement:* A review stage can be reassigned/delegated to another qualified reviewer.
- *Role:* PM/admin. *Priority:* P1. *Deps:* REV-001.
- *Acceptance:* Reassignment audited; new reviewer notified; original context preserved.
- *Edge cases:* External reviewer removed mid-review → stage returns to internal queue.

**REV-006 — AI must not auto-approve**
- *Statement:* AI may recommend, flag, or pre-check, but the final approve/reject decision on any construction, legal, financial, inspection, warranty, or compliance document is made by a human.
- *Role:* System constraint. *Priority:* P0. *Deps:* DOC-003, REV-001.
- *Acceptance:* No code path allows an AI decision to set a requirement/document to an approved terminal state; every approval has a human actor in the audit log.
- *Edge cases:* Bulk "accept all AI suggestions" still records a human actor performing the bulk action.

### PDF Annotations (ANNO)

**ANNO-001 — View and annotate documents**
- *Statement:* Reviewers view PDFs in-browser and add highlights, comments, and stamps tied to the review.
- *Role:* Reviewers. *Priority:* P1. *Deps:* REV-001.
- *Acceptance:* Annotations are versioned with the document version they target; visible to authorized parties; exportable with the document.
- *Edge cases:* Non-PDF files (images, native formats) → view/annotate support is best-effort; large drawings must render performantly (NFR-PERF).

### Communication Center (COMM)

**COMM-001 — Requirement-level messaging**
- *Statement:* Participants exchange messages scoped to a requirement (e.g., coordinator ↔ sub).
- *Role:* Internal + assigned external. *Priority:* P1. *Deps:* REQ-003.
- *Acceptance:* External participants see only messages intended for them; internal notes are internal-only and clearly separated.
- *Edge cases:* External participant removed → loses access to thread going forward, history preserved internally.

**COMM-002 — Project-level messaging & internal notes**
- *Statement:* Internal team communicates at project scope; internal notes never exposed externally.
- *Role:* Internal. *Priority:* P1. *Deps:* PROJ-001.
- *Acceptance:* Clear visual and permission separation between internal notes and external-visible communication.
- *Edge cases:* Accidental external exposure prevented by default-internal for notes.

### Notifications (NOTIF)

**NOTIF-001 — Multi-channel notifications**
- *Statement:* The system sends email and in-app notifications (SMS as Expansion) for key events (assignment, reminder, rejection, approval, escalation, publish).
- *Role:* All. *Priority:* P0. *Deps:* workflows.
- *Acceptance:* Each notification has a lifecycle ([statuses §G](./statuses.md)); delivery tracked; users manage preferences; unsubscribe respected for non-transactional messages.
- *Edge cases:* Bounces flagged; suppressed addresses; external recipients with no account still receive email.

**NOTIF-002 — Automated reminders**
- *Statement:* Configurable reminder schedules nudge assignees about outstanding requirements.
- *Role:* System (configured by PM/coordinator). *Priority:* P0. *Deps:* REQ-003, NOTIF-001.
- *Acceptance:* Cadence configurable per project/requirement; reminders stop on submission; every reminder delivery is audited.
- *Edge cases:* Do-not-over-notify throttling; timezone-aware sending; opt-out handling.

**NOTIF-003 — Escalation rules**
- *Statement:* Missed deadlines escalate to defined internal roles (coordinator → PM → org leader).
- *Role:* System. *Priority:* P1. *Deps:* NOTIF-002.
- *Acceptance:* Escalation ladder configurable; escalation events audited and visible on dashboards.
- *Edge cases:* Escalation suppressed if requirement waived/N/A.

### Dashboards & Analytics (DASH / ANALYTICS)

**DASH-001 — Project dashboard**
- *Statement:* Per-project view of completeness, overdue items, pending reviews, risk, and recent activity.
- *Role:* PM/coordinator. *Priority:* P0. *Deps:* REQ/DOC/REV.
- *Acceptance:* Accurate real-time counts; drill-down to items; respects scope.
- *Edge cases:* Large projects paginate/perform (NFR-PERF).

**DASH-002 — Portfolio dashboard**
- *Statement:* Org/division-level view across projects.
- *Role:* Owner/admin/leaders. *Priority:* P1. *Deps:* DASH-001, TEAM-004.
- *Acceptance:* Aggregates only in-scope projects; at-risk projects surfaced.
- *Edge cases:* "Assigned only" users don't see portfolio.

**ANALYTICS-001 — Company analytics**
- *Statement:* Historical trends (cycle times, on-time %, rejection rates, sub performance).
- *Role:* Leaders. *Priority:* P2. *Deps:* data history.
- *Acceptance:* Metrics defined consistently with [Section J]; exportable.
- *Edge cases:* Small samples labeled as low-confidence.

### Project-Risk Engine (RISK)

**RISK-001 — Explainable project-risk score**
- *Statement:* Each project gets a risk score driven by measurable factors (overdue count, days-to-deadline, rejection rate, unresponsive subs, open conditions).
- *Role:* PM/leaders. *Priority:* P2. *Deps:* REQ/REV/NOTIF data.
- *Acceptance:* Score always accompanied by the specific drivers and their weights; no unexplained "black-box" number; drivers are actionable.
- *Edge cases:* New projects show "insufficient data"; score never blocks actions, only informs.

### Warranties, Equipment, Inspections, Training, Lien Waivers, As-Builts (WARR / EQUIP / INSP / TRAIN / LIEN / ASBUILT)

**WARR-001 — Warranty register**
- *Statement:* Track warranties with type (manufacturer/contractor), coverage, start/end dates, responsible party, and linked documents.
- *Role:* Coordinator/owner. *Priority:* P1. *Deps:* DOC-001.
- *Acceptance:* Start date logic tied to substantial completion or a defined event; documents linked; appears in owner portal.
- *Edge cases:* Unknown start date flagged; overlapping/duplicate warranties; **legal accuracy caveat** (see risk R-5).

**WARR-002 — Warranty expiration alerts**
- *Statement:* Notify owner/GC before warranties expire.
- *Role:* System. *Priority:* P2. *Deps:* WARR-001, NOTIF-001.
- *Acceptance:* Configurable lead time; owner portal shows upcoming expirations.
- *Edge cases:* Owner opted out; expired-but-still-listed for record.

**EQUIP-001 — Equipment registry**
- *Statement:* Record building assets with manufacturer, model, serial, location, linked manuals/warranties.
- *Role:* Coordinator/owner. *Priority:* P1. *Deps:* DOC-001.
- *Acceptance:* Asset records link to O&M docs and warranties; appear in owner portal and digital O&M.
- *Edge cases:* Assets created from extracted metadata require confirmation (DOC-004).

**EQUIP-002 — Equipment QR codes**
- *Statement:* Generate QR codes linking to an equipment record (owner-portal scope).
- *Role:* Coordinator/owner. *Priority:* P2. *Deps:* EQUIP-001, OWNER-*.
- *Acceptance:* QR resolves to the correct asset in a permission-appropriate view; works post-handoff.
- *Edge cases:* QR after project deletion handled (see OWNER-009).

**INSP-001 — Inspections & certificates register**
- *Statement:* Track inspections and certificates (including Certificate of Occupancy) with issuing authority, dates, and documents.
- *Role:* Coordinator. *Priority:* P1. *Deps:* DOC-001.
- *Acceptance:* CO and key certs tracked as first-class records; feed package/owner portal.
- *Edge cases:* Conditional/temporary CO tracked distinctly from final CO.

**TRAIN-001 — Owner training records**
- *Statement:* Record training sessions, attendees, materials, and owner acknowledgment.
- *Role:* Coordinator. *Priority:* P1. *Deps:* PROJ-001.
- *Acceptance:* Training records link to equipment/systems and appear in handoff.
- *Edge cases:* Owner sign-off optional; disputes over attendance.

**LIEN-001 — Lien-waiver tracking**
- *Statement:* Track lien waivers by subcontractor and pay milestone, with type (conditional/unconditional, progress/final) and status.
- *Role:* Coordinator/PM. *Priority:* P1. *Deps:* SUB-001.
- *Acceptance:* Status tracking only — CloseoutFlow does **not** assert legal validity; types clearly labeled; documents attached.
- *Edge cases:* Jurisdictional differences; final-waiver-before-final-payment gating is advisory only. **Attorney review required.**

**ASBUILT-001 — As-built / record drawing management**
- *Statement:* Manage as-built and record-drawing revision sets with version history and review.
- *Role:* Coordinator/AE. *Priority:* P1. *Deps:* DOC-002.
- *Acceptance:* Revision history preserved; latest approved set identified; feeds package/O&M.
- *Edge cases:* Large drawing files (NFR-FILE); mismatched sheet sets.

### Package Builder & Digital O&M (PKG / OM)

**PKG-001 — Assemble closeout package**
- *Statement:* PM/coordinator assemble a package by selecting scope (all approved requirements, equipment, warranties, certs, training, drawings) and structure.
- *Role:* PM/coordinator. *Priority:* P0. *Deps:* approved records.
- *Acceptance:* Package reflects only approved/complete items by default; structure is organized and navigable; generation is asynchronous with progress.
- *Edge cases:* Including a waived/N/A item requires explicit choice with annotation.

**PKG-002 — Completeness check**
- *Statement:* Before publishing, run a completeness check listing missing/rejected/open-condition items with explanations.
- *Role:* System. *Priority:* P0. *Deps:* PKG-001.
- *Acceptance:* Check is explainable (why each item is flagged); publishing with gaps requires explicit acknowledgment (or is blocked for P0 items per policy).
- *Edge cases:* False "missing" due to N/A must be excluded correctly.

**PKG-003 — Generate package artifacts**
- *Statement:* Produce downloadable/structured package outputs (organized document set + index; optional single combined PDF).
- *Role:* System. *Priority:* P0. *Deps:* PKG-001.
- *Acceptance:* Deterministic structure; index/table of contents; branding applied; large-package generation reliable (NFR-FILE).
- *Edge cases:* Generation failure retryable; partial artifacts never published.

**PKG-004 — Package lifecycle & versioning**
- *Statement:* Packages follow [statuses §E](./statuses.md); publishing freezes a version; updates create new versions.
- *Role:* PM. *Priority:* P0. *Deps:* PKG-003.
- *Acceptance:* A published package is immutable; a new version supersedes it while retaining the prior; owners can see current + history per policy.
- *Edge cases:* Republish after corrections; superseded package retained for audit.

**OM-001 — Digital O&M manual**
- *Statement:* Produce a structured, navigable digital O&M organized by building system/equipment, linking manuals, warranties, drawings, and training.
- *Role:* Coordinator/owner. *Priority:* P1. *Deps:* EQUIP-001, WARR-001, DOC-001.
- *Acceptance:* Navigable by system/space/equipment; each asset links its docs; remains useful post-handoff.
- *Edge cases:* Sparse data still produces a coherent structure.

### Owner Portal (OWNER)

**OWNER-001 — Publish to owner portal**
- *Statement:* Publishing a package makes an owner portal available for the building's owner reps.
- *Role:* PM. *Priority:* P0. *Deps:* PKG-004.
- *Acceptance:* Owner portal shows only published, approved records; branded; searchable within its scope.
- *Edge cases:* Re-publish updates portal to new version with change visibility.

**OWNER-002 — Invite owner representatives**
- *Statement:* Invite owner reps via account-free link and/or optional account.
- *Role:* PM/admin. *Priority:* P0. *Deps:* OWNER-001, AUTH-003.
- *Acceptance:* Owner reps access only their building(s); link expiration/revocation supported; download policy configurable.
- *Edge cases:* Multiple owner reps; owner org change over time.

**OWNER-003 — Owner search & download**
- *Statement:* Owner reps browse, search, and download published records (subject to download policy).
- *Role:* Owner rep. *Priority:* P0. *Deps:* OWNER-001, SEARCH-*.
- *Acceptance:* Search scoped to their building; downloads audited; restricted downloads honored.
- *Edge cases:* Bulk download of full package; per-file restrictions.

**OWNER-009 — Long-term owner access & data-lifecycle interaction**
- *Statement:* Owner portals remain available after project archival and are handled explicitly if the org is closed/deleted.
- *Role:* System/owner. *Priority:* P1. *Deps:* PROJ-003, ORG-005.
- *Acceptance:* Archival keeps the portal live; org deletion forces an explicit decision on owner-access continuity (transfer/retain/export) — never silent loss.
- *Edge cases:* Retention/cost tradeoffs defined in NFR-RET.

### Search, Reports, Imports/Exports (SEARCH / RPT / IMP / EXP)

**SEARCH-001 — Permission-aware search**
- *Statement:* Search across projects, documents, equipment, warranties, and comments, always scoped to the user's permissions.
- *Role:* Internal (in-scope), owner (own building). *Priority:* P1. *Deps:* data indexing.
- *Acceptance:* No result ever crosses tenant/scope boundaries; full-text + metadata filters; ranked results.
- *Edge cases:* Large indexes perform (NFR-SEARCH); newly uploaded content indexed promptly.

**RPT-001 — Standard reports & scheduled exports**
- *Statement:* Generate standard reports (completeness, overdue, sub performance, cycle time) and schedule exports.
- *Role:* Leaders/PM. *Priority:* P2. *Deps:* analytics.
- *Acceptance:* Consistent metric definitions; export formats (CSV/PDF); scheduling optional.
- *Edge cases:* Empty datasets; scope filtering.

**IMP-001 — Structured imports**
- *Statement:* Import contacts, subs, and requirement lists via validated mapped files.
- *Role:* Admin/coordinator. *Priority:* P1. *Deps:* —
- *Acceptance:* Preview, map, validate, commit; row-level errors; no silent partial import.
- *Edge cases:* Encoding issues; duplicates.

**EXP-001 — Exports**
- *Statement:* Export project and org data (documents + structured metadata).
- *Role:* Admin/PM. *Priority:* P1. *Deps:* —
- *Acceptance:* Complete, structured export; large exports produced asynchronously; audited.
- *Edge cases:* Export during active changes uses a consistent snapshot.

### Integrations, API, Webhooks (INT / API)

**INT-001 — Storage & email integrations**
- *Statement:* Connect external storage (SharePoint/Drive/Dropbox/OneDrive) and email/SMS providers.
- *Role:* Admin. *Priority:* P2. *Deps:* —
- *Acceptance:* OAuth-based connection; scoped access; disconnect revokes; never a hidden second system of record without user intent.
- *Edge cases:* Token expiry; provider outages.

**INT-002 — Construction-platform integrations (Procore/ACC)**
- *Statement:* Optional sync with Procore/Autodesk for contacts, projects, and documents.
- *Role:* Admin. *Priority:* P3. *Deps:* API-001.
- *Acceptance:* Standalone operation never depends on these; sync is additive and conflict-safe.
- *Edge cases:* API rate limits; schema drift.

**API-001 — Public API & webhooks**
- *Statement:* Provide a scoped REST API and webhooks for events.
- *Role:* Enterprise admin/devs. *Priority:* P3. *Deps:* AUTH, TEAM.
- *Acceptance:* Keyed, scoped, rate-limited, versioned; webhooks signed and retriable.
- *Edge cases:* Key leakage rotation; webhook endpoint failures.

### Billing (BILL)

**BILL-001 — Subscription billing**
- *Statement:* Manage plans, seats, trials, and invoices.
- *Role:* Owner/admin. *Priority:* P0. *Deps:* ORG-001.
- *Acceptance:* Trials, plan changes, dunning for past-due; feature gating by plan; billing changes audited and MFA-gated.
- *Edge cases:* Past-due suspends per [statuses §H](./statuses.md) with grace period; downgrade with excess usage handled.

**BILL-002 — Per-project billing option**
- *Statement:* Support per-project pricing in addition to/instead of seats.
- *Role:* Owner. *Priority:* P2. *Deps:* BILL-001.
- *Acceptance:* Clear per-project metering; owner sees cost before creating billable projects.
- *Edge cases:* Cancelled project mid-cycle; refunds/credits policy.

### Platform Administration (ADMIN) & Security/Audit (SEC)

**ADMIN-001 — Tenant & plan administration**
- *Statement:* Platform admins manage tenants, plans, and feature flags.
- *Role:* Platform admin. *Priority:* P0. *Deps:* ORG-001.
- *Acceptance:* Actions audited; no access to tenant document contents without a consented, logged support session.
- *Edge cases:* Emergency suspension of abusive tenants.

**ADMIN-002 — Support impersonation (consented, audited)**
- *Statement:* Platform support may impersonate a user only with recorded justification and (where required) customer consent; every impersonated action is audited and visibly attributed.
- *Role:* Platform admin. *Priority:* P1. *Deps:* SEC-001.
- *Acceptance:* Impersonation sessions time-boxed, fully logged, and surfaced to the org's audit log.
- *Edge cases:* Consent policy configurable per plan; break-glass documented.

**SEC-001 — Comprehensive audit logging**
- *Statement:* All important actions are recorded immutably with actor, scope, time, and context.
- *Role:* System. *Priority:* P0. *Deps:* all modules.
- *Acceptance:* Covers uploads, replacements, approvals, rejections, comments, requirement changes, reminder delivery, permission changes, publishing, downloads, and support access; logs are tamper-evident and exportable by authorized admins.
- *Edge cases:* High-volume events don't degrade UX; retention per NFR-RET.

**SEC-002 — Access-control enforcement**
- *Statement:* Every request is authorized against role + scope before data access.
- *Role:* System. *Priority:* P0. *Deps:* TEAM, ORG.
- *Acceptance:* Deny-by-default; automated authorization tests per entity; external links strictly scoped.
- *Edge cases:* Revoked access takes effect immediately.

---

## H. Nonfunctional requirements

| ID | Area | Requirement | Acceptance / target |
|----|------|-------------|---------------------|
| NFR-SEC-001 | Security | Encrypt data in transit (TLS 1.2+) and at rest. | All endpoints TLS; storage encrypted. |
| NFR-SEC-002 | Security | Deny-by-default authorization scoped to org/project/requirement/document. | Cross-tenant/scoping tests pass on every entity. |
| NFR-SEC-003 | Security | Secure account-free links: high-entropy tokens, expiration, revocation, no PII in URL. | Tokens ≥128-bit entropy; revocation immediate. |
| NFR-SEC-004 | Security | Malware scanning on all uploads before availability. | Infected files quarantined, never served. |
| NFR-SEC-005 | Security | MFA for sensitive actions; SSO/SCIM for enterprise. | Step-up enforced per user-roles §D. |
| NFR-PERF-001 | Performance | Interactive pages respond quickly under normal load. | p95 primary views < 2s; dashboards < 3s. |
| NFR-PERF-002 | Performance | Large PDF/drawing viewing remains usable. | First render of large drawings < 5s p95. |
| NFR-REL-001 | Reliability | No silent data loss; uploads either fully succeed or fail visibly. | Partial failures reported per file. |
| NFR-AVAIL-001 | Availability | Core platform uptime target. | ≥ 99.9% monthly (launch aim; validate). |
| NFR-A11Y-001 | Accessibility | Meet WCAG 2.1 AA for core internal and external flows. | Automated + manual audits pass. |
| NFR-MOB-001 | Mobile | Subcontractor upload, reviewer approve, comment flows fully usable on phone browsers. | Verified on iOS Safari + Android Chrome. |
| NFR-SCALE-001 | Scalability | Support growth in orgs, projects, documents without redesign. | Handle 10k+ projects/org, 100k+ docs/project region. |
| NFR-AUDIT-001 | Auditability | Immutable, queryable audit trail for all important actions. | See SEC-001 coverage list. |
| NFR-SEARCH-001 | Search | Permission-aware full-text + metadata search. | Results scoped; p95 query < 2s at scale. |
| NFR-FILE-001 | File storage | Secure, versioned object storage; configurable size limits. | Default max per-file limit defined; overrides per plan. |
| NFR-FILE-002 | File storage | Deduplicate identical stored bytes where safe to control cost. | Cost-control measure documented. |
| NFR-FILE-003 | Large uploads | Resumable/chunked uploads for large files & bulk sets. | Interrupted large upload resumes. |
| NFR-RET-001 | Data retention | Configurable retention; owner records retained long-term by policy. | Retention schedule documented; owner portal longevity guaranteed per plan. |
| NFR-BACKUP-001 | Backups | Regular automated backups with tested restores. | RPO ≤ 24h (aim ≤ 1h for critical), documented. |
| NFR-DR-001 | Disaster recovery | Documented DR plan with recovery objectives. | RTO/RPO defined and tested periodically. |
| NFR-PRIV-001 | Privacy | Collect minimal PII; support data-subject requests. | Export/delete supported per policy. |
| NFR-PRIV-002 | Privacy | No PII/sensitive data in URLs, query strings, or logs. | Enforced in code and log scrubbing. |
| NFR-MON-001 | Monitoring | Health, error, and processing-pipeline monitoring with alerts. | Failed file processing alerts on-call. |
| NFR-ERR-001 | Error handling | User-facing errors are clear and actionable; failures never leave inconsistent state. | Transactions atomic; retriable operations idempotent. |
| NFR-EMAIL-001 | Email deliverability | Authenticated sending (SPF/DKIM/DMARC), bounce/complaint handling. | Deliverability monitored; suppression lists honored. |
| NFR-BROWSER-001 | Browser compatibility | Support current + prior major versions of Chrome, Edge, Safari, Firefox. | Verified matrix; PWA installable. |
| NFR-MAINT-001 | Maintainability | Modular architecture aligned to the module inventory; clear boundaries. | Modules independently testable. |
| NFR-TEST-001 | Testability | Automated tests for authorization, lifecycle transitions, and file pipeline. | Coverage gates in CI (defined Phase 2). |

---

## I. Assumptions and constraints

### I-1. Current assumptions (labeled)
- **A-1:** Buyers will adopt a *closeout-only* tool alongside their existing PM system rather than demanding all-in-one. *(Validate with customer interviews.)*
- **A-2:** Subcontractors will use account-free links at high rates if the flow is truly one-tap and mobile-first. *(Core adoption bet.)*
- **A-3:** A per-seat + optional per-project pricing model fits GC buying behavior. *(Validate.)*
- **A-4:** CSI MasterFormat-style divisions are an acceptable default taxonomy. *(Construction-pro review.)*
- **A-5:** Owners will value a long-term portal enough to justify retention costs. *(Validate; affects NFR-RET/cost.)*
- **A-6:** English-only, US construction conventions at launch; internationalization deferred.
- **A-7:** E-signature and legal validity of waivers are handled by integrations/attorneys, not first-party.

### I-2. Known unknowns
- Exact willingness-to-pay and pricing tiers.
- Real subcontractor link-completion rates.
- Storage cost curve at scale (large drawings/photos).
- Depth of Procore/ACC integration customers will demand.
- Regulatory expectations for records retention by jurisdiction.

### I-3. Product constraints
- Must operate fully standalone (no dependency on Procore/ACC).
- Must never let AI make final approvals on important documents.
- Must preserve version and audit integrity everywhere.
- Web + PWA only at launch (no native apps).
- Multi-tenant isolation is non-negotiable.

### I-4. Legal / industry concerns (flag for expert review)
- Lien-waiver types and jurisdictional validity (**attorney**).
- Warranty start-date and coverage representations (**attorney + construction pro**).
- Certificate of Occupancy and inspection semantics vary by AHJ (**construction pro**).
- Records retention obligations and owner data ownership (**attorney**).
- E-signature legality if ever offered first-party (**attorney**).

### I-5. Third-party service dependencies (categories, not vendors)
- Object storage, email/SMS delivery, malware scanning, PDF rendering/annotation, AI classification/extraction, e-signature, and PM-system APIs. *(Specific vendors chosen in Phase 2.)*

### I-6. Areas requiring expert or legal review
- Default template content and requirement lists (construction pro).
- Lien waiver, warranty, and retention language (attorney).
- Accessibility conformance claims (a11y specialist).

---

## J. Product success metrics

| Metric | Definition | Source | Target |
|--------|------------|--------|--------|
| Requirement request→submission time | Median days `Requested`→`Submitted` | Requirement events | ≤ 10 days |
| % requirements complete by deadline | Completed on/before due date ÷ total due | Requirement statuses | ≥ 80% |
| Average review time | Median hours `Assigned`→decision per stage | Review events | ≤ 48h internal |
| Reminder response rate | Submissions within 72h of a reminder ÷ reminders sent | NOTIF + submissions | ≥ 35% |
| Rejection rate | Rejected submissions ÷ total submissions | Review events | Track; investigate > 25% |
| Subcontractor portal completion rate | Links resulting in ≥1 accepted submission ÷ links sent | PORT/AUTH events | ≥ 70% |
| Time to generate final package | Median minutes to produce package artifact | PKG events | ≤ 10 min p95 |
| Owner portal usage | Portals accessed ≥1× after 90 days ÷ published | OWNER events | ≥ 40% |
| Customer retention (logo) | 12-month logo retention | Billing | ≥ 85% |
| Net revenue retention | Expansion − churn/contraction | Billing | ≥ 110% |
| Support volume | Tickets per active org per month | Support system | Track & reduce |
| File-processing failure rate | Failed processings ÷ total uploads | DOC pipeline | < 1% |

---

## K. Major product risks

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|-----------|------------|
| R-1 | GCs refuse "another platform." | High | Medium | Position as closeout-only add-on; standalone; fast time-to-value; integrate later; strong ROI story (faster final payment). |
| R-2 | Subcontractors ignore portal requests. | High | High | Zero-login mobile links; smart reminders/escalation; make GC the enforcer; keep sub effort < 2 minutes. |
| R-3 | Integrations (Procore/ACC) are hard/fragile. | Medium | High | Never depend on them; treat as additive Expansion/Enterprise; abstract integration layer. |
| R-4 | File-storage costs balloon (drawings/photos). | Medium | Medium | Dedup, tiered storage, retention policies, plan-based limits; monitor cost/GB per org. |
| R-5 | Legal reliance on inaccurate records (warranty dates, waivers, CO). | High | Medium | Explicit disclaimers; human confirmation; attorney-reviewed language; never assert legal validity; audit trails. |
| R-6 | AI extraction/classification errors mislead users. | Medium | Medium | AI is suggestion-only; human confirmation required; show confidence + rationale; never auto-approve. |
| R-7 | Complex customer-specific workflows overwhelm the product. | Medium | Medium | Explicit configurable primitives (templates, rules, review chains) rather than infinite flexibility; say no to non-closeout scope. |
| R-8 | Weak willingness to pay. | High | Medium | Validate pricing early; tie price to measurable savings (labor hours, faster retention release). |
| R-9 | Security breach / cross-tenant leak. | Critical | Low-Med | Deny-by-default, automated isolation tests, encryption, MFA, audit logs, least-privilege support access, pen testing. |
| R-10 | Large file-processing failures. | Medium | Medium | Chunked/resumable uploads, retries, monitoring/alerts, no partial publishes. |
| R-11 | Competition from larger construction platforms adding closeout depth. | High | Medium | Win on focus, subcontractor experience, and owner portal longevity; move faster in the niche. |
| R-12 | Over-scoping beyond closeout. | Medium | Medium | Enforce the non-goal principle in every design review. |

---

*End of product-requirements.md. Continue to [user-roles.md](./user-roles.md).*

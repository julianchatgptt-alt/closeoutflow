# FILE: /docs/product/user-roles.md

> **Document status:** Phase 1 blueprint — permanent role & permission source of truth.
> **Companion documents:** [product-requirements.md](./product-requirements.md), [workflows.md](./workflows.md), [statuses.md](./statuses.md).
> **Core principle:** A role is an *assignment of a role type within a scope*, never a global user attribute. The same person can be an Organization Owner in Org A, a subcontractor contributor in Org B, and an owner representative for a building in Org C — simultaneously and without any data crossing between them.

---

## A. Permission model

### A-1. Permission scopes (levels)

Permissions resolve at seven nested scopes. A permission check names both an **action** and the **scope** it targets.

| Scope | Meaning | Example holders |
|-------|---------|-----------------|
| **Platform** | Across all tenants (CloseoutFlow staff). | Platform Administrator |
| **Organization** | One tenant/company workspace. | Org Owner, Org Admin |
| **Office / Division** | A subset of an org's projects/users. | Division-scoped Admin/PM |
| **Project** | One project. | PM, Coordinator, Internal Reviewer |
| **Requirement** | One requirement within a project. | Assigned subcontractor, assigned reviewer |
| **Document** | One document/version. | Uploader, reviewer, annotator |
| **Owner-portal** | A published building record. | Owner Representative, Read-only viewer |

### A-2. Inheritance & overrides

- **Downward inheritance:** A grant at a higher scope inherits to lower scopes *unless narrowed*. An Org Admin implicitly has admin rights on all projects in the org (subject to division scoping). A PM with a project grant has requirement- and document-level rights within that project.
- **Scope narrowing:** A role can be explicitly limited (e.g., PM limited to *assigned* projects, or an Admin limited to one division). Narrowed scope always wins over inherited breadth.
- **Explicit denies win:** An explicit deny at any scope overrides an inherited allow. (Example: a suspended user is denied at org scope regardless of project grants.)
- **External grants never inherit upward or sideways:** A requirement-level grant to a subcontractor gives access to *that requirement only* — never the project, never sibling requirements, never the org.
- **Owner-portal scope is isolated:** Owner-portal grants convey read/download on *published* records only and never reach into in-progress internal data.
- **Most-specific wins on conflict:** When multiple grants apply, the most specific scope's rule governs; between equal specificity, deny wins.

### A-3. Resolution order (deny-by-default)

1. Start from **deny**.
2. Apply platform status (suspended/blocked → deny).
3. Apply the highest applicable **allow** grant for the action+scope.
4. Apply any **scope narrowing**.
5. Apply any **explicit deny**.
6. Apply **sensitive-action gates** (MFA/step-up/two-person) from Section D.

Every resolved decision on a state-changing action is auditable (SEC-001).

---

## B. Role matrix

Legend: **✔** allowed · **▲** allowed but gated (MFA/confirm/two-person — see §D) · **A** own-assigned scope only · **P** own-project scope only · **R** read-only · **—** not allowed · **PA** platform-only (gated/consented).

| Action | Platform Admin | Org Owner | Org Admin | Project Mgr | Closeout Coord. | Internal Reviewer | Ext. AE Reviewer | Ext. Consultant | Sub Company Admin | Sub Contributor | Owner Rep | Read-only Viewer |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| View org settings | PA | ✔ | ✔ | R | R | — | — | — | — | — | — | R |
| Edit org settings | PA | ✔ | ✔ | — | — | — | — | — | — | — | — | — |
| Manage billing | — | ▲ | ▲ | — | — | — | — | — | — | — | — | — |
| Transfer org ownership | — | ▲ | — | — | — | — | — | — | — | — | — | — |
| Delete/close org | — | ▲ | — | — | — | — | — | — | — | — | — | — |
| Invite internal users | PA | ✔ | ✔ | P* | — | — | — | — | — | — | — | — |
| Remove/suspend users | PA | ✔ | ✔ | P* | — | — | — | — | — | — | — | — |
| Manage roles | PA | ✔ | ✔ | P* | — | — | — | — | — | — | — | — |
| Create projects | — | ✔ | ✔ | ✔ | ✔ | — | — | — | — | — | — | — |
| Archive projects | — | ✔ | ✔ | P | — | — | — | — | — | — | — | — |
| Cancel projects | — | ✔ | ✔ | ▲P | — | — | — | — | — | — | — | — |
| Transfer project | — | ✔ | ✔ | P | — | — | — | — | — | — | — | — |
| View all projects | R(PA) | ✔ | ✔ | opt | opt | — | — | — | — | — | — | opt |
| View assigned projects | — | ✔ | ✔ | A | A | A | A | A | A(own co.) | A(own req) | own bldg | A |
| Add/edit contacts & subs | — | ✔ | ✔ | P | P | — | — | — | own co. | — | — | — |
| Create/edit templates | — | ✔ | ✔ | ▲ | ▲ | — | — | — | — | — | — | — |
| Configure rules engine | — | ✔ | ✔ | ▲ | — | — | — | — | — | — | — | — |
| Create project requirements | — | ✔ | ✔ | P | P | — | — | — | — | — | — | — |
| Assign requirements | — | ✔ | ✔ | P | P | — | — | — | — | — | — | — |
| Upload documents | — | ✔ | ✔ | P | P | — | — | — | A | A | — | — |
| Classify documents | — | ✔ | ✔ | P | P | — | — | — | — | — | — | — |
| Review documents | — | ✔ | ✔ | P | P(stage) | A(stage) | A(stage) | A(stage) | — | — | — | — |
| Approve documents | — | ✔ | ✔ | ▲P | ▲P(stage) | ▲A | ▲A | ▲A | — | — | — | — |
| Reject documents | — | ✔ | ✔ | P | P(stage) | A | A | A | — | — | — | — |
| Waive requirement | — | ▲ | ▲ | ▲P | — | — | — | — | — | — | — | — |
| Mark requirement N/A | — | ✔ | ✔ | P | P | — | — | — | — | — | — | — |
| Annotate PDFs | — | ✔ | ✔ | P | P | A | A | A | — | — | — | — |
| Requirement messaging | — | ✔ | ✔ | P | P | A | A | A | A | A | — | — |
| Publish packages | — | ▲ | ▲ | ▲P | — | — | — | — | — | — | — | — |
| Access owner portals | — | ✔ | ✔ | P | P | — | — | — | — | — | own bldg | R(if granted) |
| Invite owner reps | — | ✔ | ✔ | ▲P | — | — | — | — | — | — | — | — |
| Download files | PA(consented) | ✔ | ✔ | P | P | A | A | A | A(own) | A(own) | ▲(policy) | ▲(if granted) |
| View analytics | R(PA) | ✔ | ✔ | P | P | — | — | — | — | — | — | R(if granted) |
| Export data | — | ▲ | ▲ | ▲P | ▲P | — | — | — | ▲own | — | ▲(policy) | — |
| Manage integrations | — | ▲ | ▲ | — | — | — | — | — | — | — | — | — |
| Manage API keys | — | ▲ | ▲ | — | — | — | — | — | — | — | — | — |
| View audit logs | PA | ✔ | ✔ | P(project) | P(project) | — | — | — | — | — | — | — |
| Support impersonation | ▲PA | — | — | — | — | — | — | — | — | — | — | — |

`P*` = only when the PM has been explicitly granted user-management for their project team (org-configurable; off by default). `opt` = available only if granted the "view all / view division" option. `(stage)` = only for review stages assigned to them. `A(own co.)` = the subcontractor's own company data only.

---

## C. External access

### C-1. Account-free subcontractor links
- Generated per assignment/target; grant access only to the linked requirement checklist for that subcontractor.
- Carry a **high-entropy token** (no PII in URL), an **expiration**, and are **revocable** instantly.
- State-changing actions (uploads) capture a **confirmed actor identity** (name/email; optional one-time email code).
- All actions are audited under the link identity and, once confirmed, the actor identity.

### C-2. Optional subcontractor accounts
- A contributor/admin may convert a link into a permanent account to see everything assigned to their company across projects/orgs that invited them.
- Accounts see only their own company's assigned items; never other subs, internal notes, or unrelated project data.

### C-3. External reviewer access
- AE/consultant reviewers receive **scoped, time-limited** links (or optional accounts) granting access only to the review stages assigned to them.
- They may view/annotate the specific document versions under review and approve/reject with reasons; they cannot browse the project or download unrelated files.

### C-4. Owner representative access
- Owner reps access a **published owner portal** for their building(s) via link or optional account.
- Read/search/download only, subject to per-portal download policy; no access to in-progress review, rejected drafts, or internal notes.

### C-5. Link expiration, revocation, identity, downloads, reauth
- **Expiration:** Every external link has a configurable expiry; expired links present a re-request flow.
- **Revocation:** Any authorized internal user can revoke a link immediately; revoked links fail closed.
- **Identity verification:** Optional one-time email code (step-up) for higher-assurance external actions (e.g., external approvals).
- **Download restrictions:** Owner-portal and reviewer downloads can be restricted (view-only, watermark, or per-file block) by policy.
- **Reauthentication:** Sensitive external actions (external approval, bulk download) can require a fresh identity confirmation regardless of link age.

---

## D. Sensitive actions

Actions requiring extra assurance. "Gate" columns: **MFA** (step-up multi-factor), **Confirm** (explicit typed/checkbox confirmation), **Audit** (always logged), **Owner** (owner-level permission required), **Reauth** (fresh auth), **2-Person** (second authorized approver).

| Action | MFA | Confirm | Audit | Owner | Reauth | 2-Person |
|--------|:--:|:--:|:--:|:--:|:--:|:--:|
| Manage/change billing | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Transfer org ownership | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (recommended) |
| Delete/close organization | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Bulk-delete / hard-delete data | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Waive a P0/legally-sensitive requirement | — | ✔ | ✔ | ✔ | — | ✔ (recommended) |
| Publish a closeout package | — | ✔ | ✔ | — | — | — |
| Approve a legal/compliance/warranty document | ✔(int.) / code(ext.) | ✔ | ✔ | — | ✔ | — |
| Invite owner representatives | — | ✔ | ✔ | — | — | — |
| Manage integrations / API keys | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Change a user's role / grant admin | ✔ | ✔ | ✔ | — | — | — |
| Export full organization data | ✔ | ✔ | ✔ | ✔ | ✔ | — |
| Support impersonation (platform) | ✔ | ✔ | ✔ | — | ✔ | consent |

**AI note:** No AI action ever satisfies an approval gate. Every gated approval requires a human actor recorded in the audit log (REV-006).

---

## E. Permission edge cases

| Case | Rule |
|------|------|
| **User in multiple organizations** | Memberships are independent; context is explicit; permissions and data never cross orgs; audit records the active org per action. |
| **Different roles across projects** | Roles are per-project grants; a user can be PM on Project A and Read-only on Project B; resolution uses the grant for the targeted project only. |
| **Project transferred between employees** | New PM receives full project rights; former PM's grant is removed (history preserved). Open assignments, reviews, and links continue unaffected. Transfer is audited. |
| **External reviewer removed** | Access revoked immediately; any in-flight review stage returns to the internal queue for reassignment (REV-005); prior annotations/decisions preserved. |
| **Subcontractor contact leaves their company** | Contact is deactivated (not deleted); their open assignments are reassigned to another contributor; issued links can be revoked and reissued; history preserved. |
| **Organization owner leaves** | Ownership must be transferred before removal (cannot remove the last Owner); transfer is a gated sensitive action; if no successor, platform-assisted, audited recovery process applies. |
| **Suspended user** | Denied at org scope (login blocked); data and history preserved; re-activation restores prior grants; suspension does not affect the user's memberships in *other* orgs. |
| **Archived project** | Read-only for everyone; owner portal remains live; no new uploads/reviews/assignments; unarchive is possible and audited. |
| **Published owner portal** | Reads only published, approved, current-version records; internal drafts/rejections never exposed; new package versions update the portal with change visibility; revoking an owner link fails closed. |
| **Deleted or replaced documents** | Documents are superseded/soft-handled, not silently destroyed; replacement creates a new version and re-triggers review; audit preserves who/when; hard-delete is a gated sensitive action and never removes audit records of the action. |
| **Requirement reassigned mid-review** | Prior submissions/reviews preserved; new assignee sees the requirement fresh; stale in-flight external links revocable. |
| **Owner organization changes over time** | New owner reps can be invited and old ones revoked without losing records; building record persists across owner-rep turnover. |

---

*End of user-roles.md. Continue to [workflows.md](./workflows.md).*

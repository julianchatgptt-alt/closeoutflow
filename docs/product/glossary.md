# FILE: /docs/product/glossary.md

> **Document status:** Phase 1 blueprint — permanent terminology source of truth.
> **Purpose:** Establish consistent language every future coding agent, designer, and document must use. When a term is defined here, code identifiers, UI labels, and docs should follow it.
> **Format per term:** *Definition* · *How CloseoutFlow uses it* · *Do not confuse with*.

---

## Construction & closeout terms

### Closeout
- **Definition:** The final phase of a construction project in which required documentation is collected, reviewed, approved, and delivered so the project can be formally finished and handed to the owner.
- **CloseoutFlow use:** The entire scope of the product. CloseoutFlow owns the closeout phase — not the whole project.
- **Do not confuse with:** *Punch list* (physical corrective work) or *Substantial completion* (a milestone within/near closeout).

### Project closeout
- **Definition:** The specific closeout effort for one project.
- **CloseoutFlow use:** Everything scoped under a single `Project` record.
- **Do not confuse with:** *Company-wide analytics*, which aggregate across many project closeouts.

### Substantial completion
- **Definition:** The milestone at which the work is sufficiently complete for the owner to use the building for its intended purpose, even if minor items remain.
- **CloseoutFlow use:** A reference event that often triggers warranty start dates and closeout activity; recorded on the project.
- **Do not confuse with:** *Final completion* (all work incl. punch list done) or *Certificate of Occupancy* (an AHJ permission to occupy).

### Final completion
- **Definition:** The point at which all contract work, including punch-list items, is finished.
- **CloseoutFlow use:** A later milestone than substantial completion; relevant to final payment and final lien waivers.
- **Do not confuse with:** *Substantial completion* (earlier) or *Project `Complete` status* (a CloseoutFlow lifecycle state).

### Punch list
- **Definition:** A list of minor deficiencies to be corrected before final completion.
- **CloseoutFlow use:** Out of core scope (it is field corrective work, not documentation), though its resolution may be referenced. Not a CloseoutFlow module.
- **Do not confuse with:** *Closeout requirement* (a documentation obligation, not a physical fix).

### O&M manual (Operations & Maintenance manual)
- **Definition:** A compiled set of instructions and documentation for operating and maintaining a building's equipment and systems.
- **CloseoutFlow use:** A key deliverable; CloseoutFlow produces a **structured digital O&M manual** (OM-001) organized by system/equipment and linked to documents/warranties.
- **Do not confuse with:** *Handoff package* (the broader closeout deliverable that may contain the O&M plus certs, waivers, drawings, etc.).

### As-built drawing
- **Definition:** Drawings marked up during construction to reflect what was actually built, including field changes.
- **CloseoutFlow use:** Managed with revision history (ASBUILT-001); feeds the package and O&M.
- **Do not confuse with:** *Record drawing* (a formalized, often architect-produced version) or *Shop drawing* (fabrication detail).

### Record drawing
- **Definition:** A cleaned-up, formalized drawing set incorporating as-built information, often prepared by the design professional.
- **CloseoutFlow use:** Tracked alongside as-builts; the authoritative approved set is identified.
- **Do not confuse with:** *As-built drawing* (the field-marked source) — record drawings are the refined output.

### Shop drawing
- **Definition:** Detailed drawings prepared by a contractor/fabricator/supplier showing how a component will be made or installed.
- **CloseoutFlow use:** Generally a pre-closeout submittal artifact; referenced if part of closeout documentation but not a core module.
- **Do not confuse with:** *As-built* / *record drawing* (post-construction) — shop drawings are produced before installation.

### Submittal
- **Definition:** Documentation (shop drawings, product data, samples) a contractor submits for approval during construction.
- **CloseoutFlow use:** Primarily a pre-closeout PM-system concern; CloseoutFlow's analog for the closeout phase is a **Submission** against a **closeout requirement**. Distinguish carefully.
- **Do not confuse with:** *Submission* (below) — CloseoutFlow uses "Submission" for closeout document delivery, not the general-construction "submittal."

### Warranty
- **Definition:** A guarantee covering defects/performance for a defined period.
- **CloseoutFlow use:** Tracked in the **warranty register** (WARR-001) with type, coverage, and start/end dates.
- **Do not confuse with:** *Contractor guarantee* (a GC/sub's own promise) vs. *Manufacturer warranty* (product maker's promise) — both are warranty records but different sources.

### Manufacturer warranty
- **Definition:** A warranty issued by the maker of a product/equipment.
- **CloseoutFlow use:** A warranty-register entry with `type = manufacturer`, linked to equipment.
- **Do not confuse with:** *Contractor guarantee* (workmanship promise by the installer/GC).

### Contractor guarantee
- **Definition:** A promise by the general or subcontractor covering workmanship for a defined period.
- **CloseoutFlow use:** A warranty-register entry with `type = contractor`.
- **Do not confuse with:** *Manufacturer warranty* (product-based) — the responsible party differs.

### Equipment schedule
- **Definition:** A tabular list of equipment with attributes (type, model, capacity, location).
- **CloseoutFlow use:** Source data for the **equipment registry** (EQUIP-001).
- **Do not confuse with:** *Construction schedule* (a timeline — out of scope) — despite the shared word "schedule."

### Commissioning
- **Definition:** The process of verifying that building systems are installed and perform as intended.
- **CloseoutFlow use:** Commissioning reports are a closeout requirement type; commissioning agents may act as external reviewers/consultants.
- **Do not confuse with:** *Startup report* (initial equipment startup) or *Testing and balancing* (a specific commissioning-related activity).

### Testing and balancing
- **Definition:** Measuring and adjusting building systems (often HVAC) to meet design performance.
- **CloseoutFlow use:** A testing-report requirement type; documents attach to equipment/systems.
- **Do not confuse with:** *Commissioning* (broader verification) — T&B is one part of it.

### Startup report
- **Definition:** Documentation of an equipment manufacturer's initial startup and verification.
- **CloseoutFlow use:** A closeout requirement/document type, often tied to warranty start.
- **Do not confuse with:** *Commissioning report* (system-level verification) — startup is equipment-level.

### Certificate of Occupancy (CO)
- **Definition:** A document from the authority having jurisdiction permitting a building to be occupied.
- **CloseoutFlow use:** A first-class record in the inspections/certificates register (INSP-001); temporary/conditional CO tracked distinctly from final CO.
- **Do not confuse with:** *Substantial completion* (a contractual milestone, not a regulatory permission).

### Lien waiver
- **Definition:** A document by which a party waives its right to file a mechanic's lien, typically in exchange for payment.
- **CloseoutFlow use:** **Tracked** (LIEN-001) by sub and milestone with type/status; CloseoutFlow does **not** assert legal validity. Attorney-reviewed.
- **Do not confuse with:** *Conditional* vs. *Unconditional* waiver (below), and *Warranty* (unrelated).

### Conditional waiver
- **Definition:** A lien waiver effective only once the referenced payment is actually received/cleared.
- **CloseoutFlow use:** A lien-waiver `type = conditional`, further split by progress/final.
- **Do not confuse with:** *Unconditional waiver* (effective immediately regardless of payment) — a critical legal distinction.

### Unconditional waiver
- **Definition:** A lien waiver effective immediately, whether or not payment is received.
- **CloseoutFlow use:** A lien-waiver `type = unconditional`; higher risk, flagged accordingly.
- **Do not confuse with:** *Conditional waiver* — mixing these has legal/financial consequences.

### General contractor (GC)
- **Definition:** The primary contractor responsible for delivering the construction project.
- **CloseoutFlow use:** The **primary paying customer**; typically the `Organization`.
- **Do not confuse with:** *Subcontractor* (specialized trades under the GC) or *Owner* (the client).

### Subcontractor (sub)
- **Definition:** A specialized contractor performing a portion of the work under the GC.
- **CloseoutFlow use:** An **external participant** who fulfills assigned closeout requirements, usually via account-free links.
- **Do not confuse with:** *General contractor* (the customer) or *Supplier/manufacturer* (product source, not necessarily a sub).

### Owner
- **Definition:** The party that owns the building/project and receives the handoff.
- **CloseoutFlow use:** Receives the **owner portal**; represented by **Owner Representative** users.
- **Do not confuse with:** *Organization Owner* (a CloseoutFlow role — the customer's account owner), which is entirely different from the building *Owner*.

### Architect
- **Definition:** The design professional responsible for the building's design.
- **CloseoutFlow use:** Often an **external reviewer** (AE) for design-related closeout items.
- **Do not confuse with:** *Engineer* (discipline-specific design professional) or *Consultant* (specialist).

### Engineer
- **Definition:** A licensed professional responsible for engineering aspects (structural, MEP, civil).
- **CloseoutFlow use:** An **external AE reviewer** for engineering-related items.
- **Do not confuse with:** *Architect* (overall design) — both may review, in different disciplines.

### Authority having jurisdiction (AHJ)
- **Definition:** The governmental body/official with authority to enforce codes and issue approvals (e.g., building department).
- **CloseoutFlow use:** The issuing authority recorded on inspections/certificates (e.g., the CO issuer).
- **Do not confuse with:** *Owner* or *Architect* — the AHJ is a regulator, not a project party.

### Specification section
- **Definition:** A numbered section of the project specifications (often organized by CSI MasterFormat) describing requirements for a scope of work.
- **CloseoutFlow use:** May be referenced by closeout requirements to tie an obligation to its spec source.
- **Do not confuse with:** *Construction division* (the broader grouping that contains sections).

### Construction division
- **Definition:** A top-level grouping of related work (e.g., CSI MasterFormat divisions like Division 23 – HVAC).
- **CloseoutFlow use:** The **trade/division taxonomy** (TRADE-001) used to tag requirements, subs, and template items and to drive rules.
- **Do not confuse with:** *Office/division* of the GC company (an organizational unit in CloseoutFlow) — same word, different meaning.

---

## CloseoutFlow product terms

### Closeout requirement
- **Definition:** A single documentation obligation that must be fulfilled to close out a project (e.g., "HVAC O&M manual").
- **CloseoutFlow use:** The core `Requirement` entity with its own lifecycle ([statuses §B](./statuses.md)); fulfilled by submissions and completed by review approval.
- **Do not confuse with:** *Document* (a file) or *Submission* (an act of delivering documents). A requirement is the obligation, not the file.

### Requirement template
- **Definition:** A reusable, versioned checklist of requirement items.
- **CloseoutFlow use:** `Template` (TMPL-001); applied to projects (via rules) to generate concrete requirements.
- **Do not confuse with:** *Project requirement* (the concrete instance) — the template is the blueprint, the requirement is the instance.

### Requirement assignment
- **Definition:** The act of designating a responsible party (usually a subcontractor) for a requirement.
- **CloseoutFlow use:** Sets responsible party + due date (REQ-003); moves the requirement to `Requested` when invited.
- **Do not confuse with:** *Review assignment* (designating a reviewer) — assignment of *fulfillment* vs. assignment of *evaluation*.

### Submission
- **Definition:** A discrete act of delivering one or more documents to fulfill a requirement.
- **CloseoutFlow use:** The `Submission` entity links documents to a requirement and enters the review pipeline; **submission ≠ approval**.
- **Do not confuse with:** *Submittal* (general-construction term) or *Document* (the file). Uploading a submission does not complete a requirement.

### Document version
- **Definition:** A specific stored iteration of a document; replacing a document creates a new version.
- **CloseoutFlow use:** `Document` + `Version` (DOC-002); approved documents are never silently overwritten (version integrity).
- **Do not confuse with:** *Superseded document* (an older version retained after replacement) — superseded is a status of a version.

### Reviewer
- **Definition:** A person who evaluates a submission and approves, approves-with-conditions, or rejects it.
- **CloseoutFlow use:** Internal or external; may be one of several stages; **AI is never a reviewer of record** for approvals (REV-006).
- **Do not confuse with:** *Contributor* (uploads) or *Approver stage* (a position in the chain).

### Approval stage
- **Definition:** One step in a multi-stage review chain.
- **CloseoutFlow use:** A `Review` stage with its own status ([statuses §D](./statuses.md)); later stages open only after earlier approval (sequential) or per parallel policy.
- **Do not confuse with:** *Requirement status* — a requirement completes only after its governing chain approves.

### Exception
- **Definition:** A request to deviate from a requirement as specified (extension, alternative document, or proposed N/A).
- **CloseoutFlow use:** REQ-005; decided by the PM; recorded with reason.
- **Do not confuse with:** *Waiver* (excusing an unmet requirement) or *Not applicable* (it never applied) — an exception is a request that may lead to either.

### Waiver
- **Definition:** A decision to accept a requirement as unfulfilled, with documented justification.
- **CloseoutFlow use:** Status `Waived` (REQ-007); means "required but excused." Distinct from N/A.
- **Do not confuse with:** *Lien waiver* (a construction legal document) or *Not applicable* (never required). "Waiver" alone in CloseoutFlow means a requirement waiver.

### Not applicable (N/A)
- **Definition:** A determination that a requirement never applied to this project.
- **CloseoutFlow use:** Statuses `Not applicable requested`/`approved` (REQ-006); excluded from missing counts.
- **Do not confuse with:** *Waiver* (applied but excused) — the difference affects completeness reasoning and records.

### Handoff package
- **Definition:** The compiled, organized set of approved closeout deliverables given to the owner.
- **CloseoutFlow use:** `Package` (PKG-001); versioned and immutable once published; contains documents, O&M, registers, drawings.
- **Do not confuse with:** *O&M manual* (a component) or *Owner portal* (the delivery surface).

### Owner portal
- **Definition:** The web surface where owner representatives access their building's published records long-term.
- **CloseoutFlow use:** `Owner Portal` (OWNER-001); shows only published, approved, current records; persists after project archival.
- **Do not confuse with:** *Handoff package* (the content) — the portal is the delivery/consumption surface.

### Asset
- **Definition:** A physical building item of ongoing interest (equipment, system component).
- **CloseoutFlow use:** Represented by an **equipment record**; may have QR codes, linked manuals/warranties.
- **Do not confuse with:** *Document* (a file about the asset) — the asset is the physical thing, the document describes it.

### Equipment record
- **Definition:** The structured record of a building asset (manufacturer, model, serial, location).
- **CloseoutFlow use:** `Equipment` (EQUIP-001); anchors the digital O&M and owner portal asset views.
- **Do not confuse with:** *Warranty record* (coverage info, often linked to the equipment) — different entities.

### Warranty register
- **Definition:** The collection of all warranty records for a project/building.
- **CloseoutFlow use:** The set of `Warranty` entries (WARR-001) surfaced in the owner portal.
- **Do not confuse with:** *Inspection register* (certificates/inspections) — a parallel but distinct register.

### Inspection register
- **Definition:** The collection of inspection and certificate records (including CO).
- **CloseoutFlow use:** `Inspections/Certificates` (INSP-001); feeds package and owner portal.
- **Do not confuse with:** *Warranty register* — different record type and purpose.

### Audit log
- **Definition:** The immutable, queryable record of important actions with actor, scope, time, and context.
- **CloseoutFlow use:** SEC-001; every status transition and sensitive action is recorded; tamper-evident.
- **Do not confuse with:** *Communication/messages* (deliberate conversation) — the audit log is a system record, not a chat.

### Organization
- **Definition:** A customer's company workspace — the multi-tenant isolation boundary.
- **CloseoutFlow use:** `Organization` (ORG-001); contains users, projects, templates, settings; strictly isolated.
- **Do not confuse with:** *Owner* (the building owner) or *Office/division* (a subset within an organization).

### Tenant isolation
- **Definition:** The guarantee that one organization's data is never accessible to another.
- **CloseoutFlow use:** A non-negotiable principle (ORG-004, NFR-SEC-002); enforced deny-by-default and tested per entity.
- **Do not confuse with:** *Scope narrowing* (limiting a user within one org) — isolation is between orgs; scoping is within one.

### External participant
- **Definition:** Any non-customer user who participates (subcontractor, external reviewer, owner rep).
- **CloseoutFlow use:** Accesses only assigned/published data, usually via secure links; never sees org-internal data.
- **Do not confuse with:** *Internal user* (a member of the customer organization) — external participants are outside the tenant boundary except for their granted scope.

### Secure access link
- **Definition:** A high-entropy, scoped, expiring, revocable tokenized URL granting account-free access to a specific scope.
- **CloseoutFlow use:** `Secure Link` (AUTH-003); powers subcontractor uploads, external reviews, and owner access without accounts; no PII in the URL.
- **Do not confuse with:** *Invitation* (which may create an account) — a secure link grants access without requiring one, though an invitation can be delivered via a secure link.

---

*End of glossary.md.*

---

# Phase 1 completion review

## Major decisions made

1. **Product boundary held to closeout only.** Every non-goal from the brief is preserved; a "non-goal principle" is baked into design reviews (R-12). CloseoutFlow works standalone and treats Procore/ACC as *later, additive* integrations, never dependencies.
2. **Clean separation of core concepts.** Requirement (obligation) ≠ Submission (act of delivery) ≠ Document (file/version) ≠ Review (evaluation) ≠ Approval (decision). A requirement reaches `Complete` **only** through human review approval — never by upload alone.
3. **Statuses separated from permissions, flags, and events.** [statuses.md](./statuses.md) explicitly reclassifies several brief concepts: "Missing" and "Corrections required" are computed flags/indicators, not stored statuses; verbose project sub-phases collapse into `Closeout In Progress`/`Owner Review` with dashboard indicators. The final project model is **Draft → Active → Closeout In Progress → Owner Review → Published → Complete → Archived (+ Cancelled)**.
4. **Human-controlled AI enforced structurally.** REV-006 states no code path lets AI reach an approved terminal; AI is suggestion-only with confidence + rationale everywhere (classification, extraction, completeness, risk).
5. **Version integrity guaranteed.** Approved documents are never silently overwritten; replacement creates a new version and restarts review.
6. **External participation is account-free-first.** Secure, scoped, expiring, revocable links with no PII in URLs; optional permanent accounts layered on top.
7. **Permission model is scope-based, not user-global.** A person can hold different roles across orgs/projects; deny-by-default with explicit gates for sensitive actions.
8. **Owner-portal longevity treated as a first-class, long-term concern**, including an explicit org-deletion continuity decision (OWNER-009) so owner access is never silently lost.
9. **Waiver vs. Not Applicable are distinct** ("required but excused" vs. "never required") with different completeness math and records.
10. **Roadmap gates ordered around load-bearing foundations** — architecture + permissions before features; versioned documents before reviews; human approval before packages; packages before owner portal; AI/integrations only on stable seams.

## Assumptions that still require founder validation
- **Willingness to pay** and the seat + per-project pricing model (A-3, R-8).
- **Subcontractor account-free completion rates** — the core adoption bet (A-2, R-2).
- **Buyers accept a closeout-only tool** alongside existing PM systems (A-1, R-1).
- **Owners value a long-term portal** enough to justify retention cost (A-5, R-4).
- **CSI MasterFormat as default taxonomy** (A-4).
- **US-only, English-only at launch** (A-6).
- Target uptime/RPO/RTO figures in the NFR table are aims to confirm.

## Highest-risk product areas
- **Subcontractor adoption** of the portal (R-2) — the product fails if subs don't submit.
- **Legal reliance on records** — lien waivers, warranty dates, CO semantics (R-5).
- **Tenant isolation / security** — a leak is existential (R-9).
- **File-storage cost and large-file processing** at scale (R-4, R-10).
- **AI extraction/classification errors** eroding trust (R-6).

## Items to be reviewed by a construction professional
- Default requirement-template content and the master requirement list by project type.
- Trade/division taxonomy and how requirements map to divisions/spec sections.
- Semantics of substantial vs. final completion, CO/temporary CO, commissioning vs. startup vs. T&B.
- Warranty start-date conventions (tie to substantial completion vs. equipment startup).

## Items to be reviewed by an attorney
- Lien-waiver types, jurisdictional validity, and the advisory-only final-waiver/final-payment gate (LIEN-001).
- Warranty coverage/date representations and disclaimers (WARR-001, R-5).
- Records-retention obligations, owner data ownership, and org-deletion/owner-continuity policy (ORG-005, OWNER-009, NFR-RET).
- Any future first-party e-signature offering (currently deferred to integration).
- Privacy obligations and data-subject request handling (NFR-PRIV).

## Items that must be finalized before Phase 2 begins
1. **Confirm the entity model names** used throughout (Organization, Project, Requirement, Submission, Document/Version, Review, Equipment, Warranty, Package, Owner Portal) — these become schema.
2. **Confirm the audit-event catalog** implied by [statuses.md](./statuses.md) and [workflows.md](./workflows.md) (event names like `requirement.status_changed`) — Phase 2 designs the audit table around them.
3. **Confirm the permission scopes** (platform/org/office/project/requirement/document/owner-portal) and deny-by-default resolution order — Phase 4 depends on these.
4. **Confirm the secure-link security requirements** (entropy, expiry, revocation, no-PII-in-URL, identity confirmation) — foundational to the external experience.
5. **Confirm the final project/requirement/document/review/package status models** — they drive core tables and are expensive to change later.
6. Founder sign-off that the **product boundary and non-goals** are correct.

These are **decision confirmations**, not open design work — the blueprint proposes a concrete answer for each; Phase 2 only needs founder acceptance to proceed.

## Verdict

**READY FOR PHASE 2.**

The six documents are internally consistent and mutually cross-referenced: the module inventory and functional requirements in [product-requirements.md](./product-requirements.md) align with the roles in [user-roles.md](./user-roles.md), the step-by-step flows in [workflows.md](./workflows.md), the lifecycle definitions in [statuses.md](./statuses.md), the build order in [feature-roadmap.md](./feature-roadmap.md), and the terminology in [glossary.md](./glossary.md). Core concepts are cleanly separated, statuses are distinguished from permissions/flags/events, AI is structurally prevented from making approvals, and the roadmap sequences foundations before dependent features. The open items above are founder confirmations and expert reviews, not gaps in the blueprint's structure — Phase 2 (technical architecture) can proceed against this source of truth.

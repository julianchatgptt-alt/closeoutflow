# CloseoutFlow documentation

The repository documentation is organized by source-of-truth layer. Read the layers in order before implementing a phase.

## Product blueprint

Approved Phase 1 product behavior lives in [`product/`](./product/):

- [Product requirements](./product/product-requirements.md)
- [User roles](./product/user-roles.md)
- [Workflows](./product/workflows.md)
- [Statuses](./product/statuses.md)
- [Feature roadmap](./product/feature-roadmap.md)
- [Glossary](./product/glossary.md)

## Architecture foundation

Approved Phase 2 architecture and implementation evidence live in [`architecture/`](./architecture/). Begin with [Architecture overview](./architecture/architecture-overview.md), then read the document for the area being changed. The Phase 2 audit and remediation records must remain preserved.

## Frontend design foundation

Approved Phase 3 design specifications live in [`design/`](./design/):

- [Design direction](./design/design-direction.md)
- [Design tokens](./design/design-tokens.md)
- [Application shell](./design/application-shell.md)
- [Navigation and routes](./design/navigation-and-routes.md)
- [Components](./design/components.md)
- [Patterns](./design/patterns.md)
- [Accessibility and responsive behavior](./design/accessibility-and-responsive.md)
- [Placeholder pages](./design/phase-3-placeholder-pages.md)
- [Implementation plan](./design/phase-3-implementation-plan.md)
- [Open design decisions](./design/open-design-decisions.md)
- [Implementation progress](./design/phase-3-implementation-progress.md)
- [Exit review](./design/phase-3-exit-review.md)
- [Independent audit](./design/phase-3c-audit.md)
- [Audit remediation](./design/phase-3d-remediation.md)

Phase 3 is limited to the design system, shell, presentational components, static labeled mock content, placeholder routes, and their tests. It does not authorize authentication, business persistence, business APIs, billing, integrations, AI processing, or external portals.

## Closeout requirements and templates

Phase 6A planning specifications live in [`requirements/`](./requirements/). Begin with [Phase 6 overview](./requirements/phase-6-overview.md); the ordered build plan is [Phase 6 implementation plan](./requirements/phase-6-implementation-plan.md) and founder inputs are in [Open decisions](./requirements/open-decisions.md).

Phase 6 is limited to requirement configuration: categories, versioned templates, template application, project requirements, responsibility, due dates, N/A, archive, bulk operations, permissions/RLS, and audit. It does not authorize file uploads, document versions, reviews/approvals, portals, secure external links, notifications, package generation, AI, integrations, or billing.

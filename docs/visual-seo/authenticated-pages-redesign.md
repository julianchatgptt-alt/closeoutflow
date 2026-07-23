# FILE: /docs/visual-seo/authenticated-pages-redesign.md

> **Document status:** Phase 6E-A specification — per-page-group redesign direction for the authenticated product. **All redesigns are presentation-only: no server-action, RPC, RLS, permission, or audit change.** Data sources and behavior are preserved exactly.

## Global rules (apply to every group)

- Inherit the surface ladder, type scale, table system, state system, and dialog/sheet composition from [design-system-evolution.md](./design-system-evolution.md). No route-specific CSS.
- Every page defines all applicable states: first-use empty, filtered no-results, loading skeleton, recoverable error, permission-denied, missing/archived record, conflict recovery. No blank cards, spinners, or raw errors.
- One dominant element + one primary action per view. Wide width for tables/registers; reading width for forms/detail.
- No later-phase language; honest previews keep the `PreviewPill`.

## 1. Projects

- **List (`/projects`, P1):** premium `DataTable` — Name (+ number sub-line) · Type · Status (StatusBadge) · Closeout target (friendly date) · Team (avatar stack) · Updated; hairline rules, sticky header, comfortable density, quiet zebra. Strong first viewport: title + New project primary + toolbar (search, status/assigned/type/archived filters, sort) as a quiet inset, not a heavy card. Mobile → `RecordCard`. Empty = the Phase 5 sales moment (retained). Risk column stays honest em-dash "Phase 11".
- **Create (`/projects/new`, P3):** one-field dialog primary (retained), full-page fallback refined to reading width.
- **Overview (`/projects/[id]`, P1):** apply the surface ladder so panels differ (identity header raised; setup checklist focal when under-populated; dates/team/companies/contacts/requirements as quiet panels). The Phase 6 **requirements panel is real — keep and elevate it**. Design a **growth-safe panel grid**: a fixed 2-column region with a defined slot order so future phases (documents/reviews/warranties) drop into new quiet panels without re-layout; closeout-readiness stays an honest placeholder until those systems exist.
- **Setup checklist (P1):** refined to a quiet stepper with the activated "Add closeout requirements" step; per-step CTA; derived progress meter (real).
- **Settings (`/settings`, P2):** sectioned reading-width form (`FormSection`), per-section save + conflict recovery; lifecycle actions (status/cancel/archive/restore) in a distinct lower-emphasis-but-clear zone with confirm dialogs.
- **Team / Companies / Contacts tabs (P2):** consistent list + add-dialog composition on quiet surfaces; clear internal-team vs external-directory distinction (retained); stale-relationship chips.
- **Activity (P2):** audit timeline with human phrasing, quiet rows, hairline separators, cursor "load more".

## 2. Requirements (flagship — P0)

Make the register the product's showcase.
- **Populated register:** category `<tbody>` group sections, sticky column header, hairline internal rules (not spreadsheet grid), quiet zebra, one raised toolbar band with summary chips (total / needs-attention / not-applicable) as filter shortcuts; lean row: title + source line, responsible company/contact, internal owner, friendly due date + "Planned date passed" tint, quiet StatusBadge (Planned / Not applicable). No later-phase columns.
- **Bulk bar:** refined bottom action bar (non-sticky on mobile, retained), premium spacing, typed-count confirm dialogs; live-region announcements retained.
- **Empty register:** strong first-run — "Every closeout starts with the scope" + Apply template / Add requirement (retained, elevated).
- **Needs-attention filter:** a first-class quiet chip; counts match rows.
- **Detail (`/requirements/[rid]`):** reading-width, sectioned (Details / Responsibility / Due date / Provenance / Actions), honest "requests sent when the portal arrives" note; N/A + archive as clearly-consequenced dialogs (N/A reason validated inline per 6D).
- **Apply flow:** two-screen composition on a raised surface; preview groups; duplicate-skip counts; role/date resolution; ≤90s target.
- **Custom create:** title-first dialog/sheet, "add another", advisory duplicate warning.
- **Mobile:** `RecordCard` conversion; bulk via select mode; filters in a sheet.
- **Large datasets:** cursor "load more" (retained); no client-side heavy work; scale-safe (2,000 rows proven).

## 3. Templates (P0/P1) — communicate time saved + standardization

- **Library (`/templates`, P0):** first-class surface (sidebar item retained). Refined table/cards with version+status chips; empty state sells reuse ("Capture your closeout standard once — apply it to every project"); prominent starter disclaimer; viewer read-only framing. Add a quiet value line ("Templates set up a project's closeout scope in minutes instead of rebuilding it each time").
- **Detail / builder (`/templates/[id]`, P0):** restructure the long stacked builder into a clear two-zone layout — left: template identity + category-grouped item list with inline edit and keyboard reorder (6D adjacent-move, accessible); right: publish/version/clone/archive actions + category manager. Version chain as quiet pills; published = read-only with "Edit as new version". Human breadcrumb (template name, not id — 6C fix retained).
- **Apply from template:** shared with §2 apply flow.
- **Mobile builder:** read-mostly with move controls (no drag-only); editing supported, optimized for tablet/desktop.

## 4. Companies & contacts (P1/P2)

- **Directories:** premium `DataTable` + `RecordCard` mobile; quiet toolbar; reuse-first empty states.
- **Detail pages:** reading width; relationship presentation (a company's projects+roles, a contact's affiliations+participations) on quiet panels; duplicate warnings advisory (retained); archive state banner.
- **Contact-vs-user clarity:** explicit "external contact — not a Closeout user account" framing (retained, strengthened); reserved portal affordance stays an honest "Phase 7" note.
- Long company/contact names truncate with tooltip.

## 5. Team & settings (P2) — no generic settings-card grid

- **Two-pane settings** (left settings nav, right reading-width content) on quiet surfaces; `FormSection` grouping; no grid of identical cards.
- **Org team / members / roles / invitations:** premium table + invite dialog; suspended members clearly marked; ownership transfer + role change keep their gated flows (visual only). Consolidate `/team` and `/settings/team` presentation (decide canonical per FD-4; default: `/settings/team` canonical, `/team` a quiet alias) — **no route/logic removal in 6E**, presentation alignment only.
- **Security / MFA / preferences / sessions:** consistent forms; dangerous actions (delete/transfer) get a distinct destructive treatment with confirm + reauth (existing gates untouched).
- **Disabled settings** (billing/integrations/api-keys/security-audit/trades): honest disabled treatment, kept.

## 6. Authentication & onboarding (P3 — refine only, do not redesign)

Phase 5E is strong; change only what composition needs:
- Consistent split-screen desktop / centered mobile; **logo sizing** aligned to the new scale; trust-panel copy unchanged (truthful, no fake proof); form width normalized to reading width; error states use the shared error system; mobile spacing/safe-areas.
- Invitation (masked preview retained), organization creation/selection, MFA challenge, recovery codes: layout consistency + logo sizing only. No novelty redesign. Exact-email enforcement and all auth logic untouched.

## 7. Global state pages (P2)

- Branded 404 (`not-found.tsx`), root error boundary (`error.tsx`), route `loading.tsx` skeletons, `PermissionDenied`, non-enumerating project/template 404: all adopt the shared state system; calm, on-brand, recoverable; no raw messages.

## Acceptance criteria (authenticated product)

- Every group uses the surface ladder (visibly differentiated panels; dark-mode elevation on raised).
- Register + template library read as flagship, premium operational surfaces.
- No later-phase language on real surfaces; honest previews preserved.
- Every page has designed empty/loading/error/permission/conflict states.
- Zero business-logic/data-source/permission change (diff review confirms presentation-only).
- Light + dark + mobile captured for all P0/P1 surfaces ([screenshot-review-matrix.md](./screenshot-review-matrix.md)).

---

*Continue to [public-site-architecture.md](./public-site-architecture.md).*

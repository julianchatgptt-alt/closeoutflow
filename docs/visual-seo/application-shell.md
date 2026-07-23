# FILE: /docs/visual-seo/application-shell.md

> **Document status:** Phase 6E-A specification — the authenticated shell. **Reuse existing shell components; refine, don't fork.**
> **Grounding:** `components/shell/{app-shell,sidebar,app-header,primary-navigation,navigation,command-palette,breadcrumbs,project-subnav}.tsx`.
> **Principle:** the shell should feel *elegant and quiet*, receding so operational content (the register, projects) leads.

## 1. Sidebar

- **Grouped rail**, not one flat list:
  - **Work** (primary): Dashboard · Projects · Companies · Contacts · Templates.
  - **Organization** (utility, quieter, small overline separator): Team · Settings. Reports stays here, honestly disabled ("Later").
- **Active state:** replace the heavy solid-fill block with a **left accent bar + tinted text + subtle quiet-surface background** (`--nav-item-active-*` tokens). No oversized filled rectangle.
- **Proportions:** 240px expanded / 64px collapsed (icon-only with accessible labels + tooltips); consistent 12–14px item padding; brand lockup top with correct Keystone Fold sizing (§7).
- **Disabled/later items:** greyed with a small "Later" chip + tooltip; never look clickable; future destinations honestly disabled or hidden, never faked.
- **Collapsed behavior:** icons with `aria-label`; active accent still visible; tooltips on hover/focus.
- The dev "Issue" badge is not part of the product shell (dev-only overlay) — ensure it is absent from captures/production.

## 2. Header

- Quiet, thin header: org switcher (left, truncating with `title`), breadcrumbs, then right cluster: **Search / command palette**, Notifications (honest placeholder — see §6), Help, User menu.
- No competing color; single-row; sticky; safe-area aware on mobile.

## 3. Organization switcher

- Truncates long names with accessible `title` (already correct); refine to a quieter control with clear "switch organization" affordance; keeps the server-validated `cof-active-org` behavior unchanged (no logic change).

## 4. Search + command palette

- Keep the `Ctrl/Cmd-K` command palette (accessible, focus-trapped — already strong). Refine visuals to the overlay composition ([design-system-evolution §7](./design-system-evolution.md)).
- Command routes should include the new Templates surface and honest current destinations only; no commands for non-existent features.
- The header "Search" affordance opens the palette (do not imply a full search product that doesn't exist).

## 5. User menu

- Account (profile/preferences/security/sessions), theme toggle, density toggle, sign out. Consolidated, quiet dropdown using the shared menu composition.

## 6. Notifications (honest placeholder)

- Notifications infrastructure is **not implemented** (Phase 10). The bell must be either **hidden** or render an **honest empty state** ("No notifications yet — reminders arrive with the notifications system") — never a fake unread count or fabricated items. Recommend a quiet bell with an honest empty popover (keeps the shell shape without lying). Founder decision FD-? not required; default = honest empty.

## 7. Logo & brand use

- Keystone Fold horizontal lockup in expanded sidebar; compact symbol in collapsed + mobile header. **No redesign** — only sizing/spacing/optical alignment refinements for the new rail proportions. Favicon/PWA/OG assets unchanged.

## 8. Breadcrumbs

- Keep the server-resolved human breadcrumbs (project name, template name — the 6C-fixed pattern); never show raw UUIDs. Pattern `{Section} › {Entity} › {Sub}`; last crumb is current (non-link); long names truncate with tooltip. Extend the context providers only as needed for any new labels (no logic change).

## 9. Project sub-nav

- Horizontal tab strip under the header inside `/projects/[id]`. Refine: quieter inactive tabs, clear active underline (accent), honest disabled tabs for later-phase modules (documents/reviews/etc.) with the `PreviewPill` treatment. On narrow widths collapse to a "Section ▾" selector (keep existing behavior; refine visuals).

## 10. Mobile navigation

- Off-canvas left drawer via header hamburger (the grouped rail), full-height, focus-trapped, `Esc`/backdrop dismiss (existing behavior — refine visuals + grouping).
- Project sub-nav → scrollable tab strip / "Section ▾".
- Settings nav → top "Settings section ▾".
- 44px targets; safe-area insets; no bottom tab bar (desktop-primary app).

## 11. Content-width system

- Adopt `--content-wide` for operational pages (dashboard, projects list, register, directories) and `--content-max` (reading width) for forms/detail/settings ([design-system-evolution §6](./design-system-evolution.md)). The shell provides the width class; pages opt into wide vs. reading.

## 12. Theme behavior

- Light/dark toggle in the user menu (existing, pre-paint initializer preserved — do not weaken). Every shell element themed with the surface ladder; dark gets real elevation on raised/overlay surfaces.

## 13. Acceptance criteria (shell)

- Sidebar active state is a light accent, not a filled block; rail is visibly grouped (Work vs. Organization).
- Header is a single quiet row; no fake notification counts.
- No raw UUIDs in breadcrumbs; long org/project/template names truncate accessibly.
- Mobile drawer + project sub-nav usable at 375px with 44px targets, no horizontal clipping.
- Keystone Fold correctly sized in expanded/collapsed/mobile; light and dark both captured.

---

*Continue to [dashboard-redesign.md](./dashboard-redesign.md).*

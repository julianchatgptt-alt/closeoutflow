# FILE: /docs/visual-seo/design-system-evolution.md

> **Document status:** Phase 6E-A specification — shared token/primitive evolution. **Change the system, not the pages.** Every improvement here is a token or shared primitive so pages inherit it; route-specific CSS is prohibited (§Governance).
> **Grounding:** `packages/ui/src/tokens.css`, `packages/ui/src/*`, Phase 3E visual direction. IBM Plex + engineered-blue retained.

## 1. Governance (prevents redesign sprawl)

- All visual change flows through **tokens** (`packages/ui/src/tokens.css`) and **shared primitives** (`packages/ui/src/*`) + a small set of shell/page components. **No per-route stylesheets, no one-off color/spacing literals** beyond documented utilities.
- **No parallel design system.** Refine existing primitives in place; do not fork `Card`/`Button`/`DataTable`.
- Backward compatibility: keep current component APIs; add variants rather than breaking props. Deprecations are explicit (§9).

## 2. Surface system (the core fix)

Replace the uniform "shadow + border ring on everything" with a **four-tier surface ladder**, differentiated by tone + elevation, so hierarchy comes from the system, not from adding containers.

| Tier | Token(s) | Use | Treatment |
|------|----------|-----|-----------|
| **Canvas** | `--background` (tinted graphite light / near-black dark) | page background, the "desk" | no border, no shadow |
| **Quiet** | `--surface-sunken` | grouping regions, insets, table zebra base, form section backing | subtle tone shift, **no border**, no shadow |
| **Panel** | `--surface` | the default content surface ("paper") | 1px hairline border **only where content needs a boundary**; no drop shadow by default |
| **Raised** | `--surface-raised` + new `--shadow-raised` | the **one** focal element per view, popovers, dialogs, sheets, the dashboard hero | real, restrained elevation; **no border ring** |

Rules:
- **Dark mode gets a real elevation token.** Add `--shadow-raised` for dark (soft ambient shadow), so raised surfaces read as elevated rather than as identical outlines. Retire the "border-ring-as-shadow" `--shadow-card` default; keep a hairline `--border` for tables/insets only.
- **One raised element per viewport.** Everything else is panel/quiet. This creates the missing focal point.
- Nested cards are prohibited; use quiet backing + spacing for sub-grouping.

## 3. Border strategy

- Borders become **intentional accents**: table header/row rules, inset dividers, input outlines, the sidebar's single active accent. Not the default frame for every box.
- Introduce `--hairline` (lower-contrast than `--border`) for internal table/list dividers to reduce "spreadsheet clutter"; reserve `--border` for outer boundaries.

## 4. Shadow strategy

- Two shadows only: `--shadow-raised` (focal/overlay) and `--shadow-overlay` (dialogs/sheets/popovers, slightly stronger). Panels use none. Removes the faint universal `shadow-card`.
- Light and dark tuned separately; both subtle (no "floating marketplace card" look).

## 5. Typography scale

Retain IBM Plex Sans/Mono. Refine steps (no new fonts):

| Role | Now | 6E |
|------|-----|----|
| Page title (h1) | ~24–28 | **30/36 semibold**, tighter tracking, owns the first viewport |
| Section (h2/overline) | 11 overline | keep overline for panels; add a 18/24 medium section title for major regions |
| Body | 14 | 14/22 (unchanged) |
| Secondary | 13 muted | **13.5–14, raised contrast** (min AA on quiet surfaces) — stop using the lightest muted for scannable metadata |
| Data / metric | tabular | formalize **`--metric` treatment**: 28–34 tabular-nums, tight leading, label in secondary above/below |
| Table cell | 14 | 14 with 13 sub-line at raised contrast |

Long-title handling: single-line truncate + accessible `title`, two-line clamp on cards. Balanced line lengths (max ~68ch for prose regions, marketing included).

## 6. Spacing, radius, content width

- Keep the 4px base scale; standardize page padding via a **content-width system**: `--content-max` (reading/settings ~72rem), `--content-wide` (operational tables/register ~full gutter). Operational pages (register, directories, list) go **wide**; forms/detail go **reading width**.
- Radius: keep `--radius` family; standardize panel = `--radius-lg`, inputs/controls = `--radius-md`, chips = `--radius-full`.

## 7. Component-level systems (shared, not per-page)

- **Navigation tokens:** `--nav-item`, `--nav-item-active-fg`, `--nav-item-active-accent` (a left accent + tinted text, replacing the solid fill); grouped rail spacing tokens.
- **Table density:** one `DataTable` density system (comfortable default, compact toggle) with hairline internal rules, sticky header, group headers as `<tbody>` sections (matches the register's Firefox-safe pattern), zebra via quiet surface — no heavy dividers.
- **Mobile-card system:** a single `RecordCard` primitive (title + source line + 2–3 label:value pairs + status) that every table degrades to below `md`, replacing bespoke per-page card markup.
- **Status system:** one `StatusBadge` vocabulary (tone + icon + label), restrained palette, no raw enum text, no badge overload; attention indicators are quiet chips (warning-subtle), not red alarms. Consistent across register/projects/templates.
- **Metric/stat primitive:** `Metric` (value + label + optional attention affordance) replacing the generic StatStrip; used sparingly, one row max.
- **Empty-state system:** `EmptyState` refined (icon + title + one-line value + one primary CTA); first-use vs. no-results variants standardized.
- **Loading skeletons:** a `Skeleton` layout system that mirrors each surface (rows, panels, register groups) — no generic spinners; route-level `loading.tsx` uses it.
- **Error system:** `ErrorState` (calm message + retry) + `PermissionDenied` (ask-an-admin) + non-enumerating not-found; raw DB/text never shown.
- **Form sections:** a `FormSection` primitive (overline + description + fields), per-section save + `updated_at` conflict recovery pattern standardized; destructive actions get a distinct lower-emphasis-but-clear treatment.
- **Dialog/sheet composition:** one composition (title, description, body, action row) → renders as centered dialog on desktop, bottom sheet on mobile; consistent focus trap/return; premium spacing; no cramped forms.
- **Focus states:** unified visible focus ring token (`--ring`) across all interactives; AA-contrast in light/dark.
- **Motion:** a small motion token set (`--dur-fast/base`, ease), used only for state transitions/overlays; **reduced-motion** zeroes durations (already honored) — no animation libraries, no decorative motion.

## 8. Marketing-page tokens (public site)

- The public site **reuses the same tokens** (surface ladder, type scale, engineered-blue, Keystone Fold) so product and marketing read as one system.
- Add marketing-only utilities: `--section-pad` (generous vertical rhythm), hero type step (larger than app h1), a `ProductFrame` primitive for screenshots (device/browser chrome framing of real product captures — never stock imagery).
- No new marketing color system; no gradients-as-brand.

## 9. Component disposition

| Component | Disposition | Note |
|-----------|-------------|------|
| `Card` / `Section` | **Refine** | adopt surface ladder; drop default ring; add `tier` variant |
| `DataTable` | **Refine** | hairline rules, group `<tbody>`, sticky header, one density system |
| `StatusBadge` / `RiskIndicator` | **Consolidate** | keep `StatusBadge`; **deprecate `RiskIndicator`** (Phase 11 risk not implemented) |
| `StatStrip` + dashboard widgets | **Rebuild** | replace with `Metric` + real-data panels (dashboard redesign) |
| `PreviewPill` | **Keep, refine** | valid for honest later-phase placeholders; **remove from dashboard** |
| `EmptyState`/`ErrorState`/`PermissionDenied`/`Skeleton` | **Refine** | formalize the state system |
| `Button`/`Input`/`Select`/`Field`/`Textarea` | **Keep** | focus-ring + section polish only |
| `Dialog`/`AlertDialog`/`Sheet` | **Refine** | single composition, sheet-on-mobile |
| `Sidebar`/`PrimaryNavigation` | **Rebuild** | grouped rail + light active state |
| `RecordCard` (mobile) | **New primitive** | consolidate per-page mobile cards |
| `Metric` | **New primitive** | replaces StatStrip KPI row |
| `ProductFrame` | **New (marketing)** | screenshot framing |
| `RiskIndicator`, mock `attention-list`/`activity-list`/`project-health`/`supporting-rail` | **Deprecate/Remove** | fabricated later-phase content |

## 10. Light/dark parity

Every token defined for both themes; dark gets real elevation (§2); contrast re-validated to AA on quiet/panel/raised surfaces; the screenshot matrix ([screenshot-review-matrix.md](./screenshot-review-matrix.md)) requires dark captures for every redesigned surface.

---

*Continue to [application-shell.md](./application-shell.md).*

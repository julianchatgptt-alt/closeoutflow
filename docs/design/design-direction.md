# FILE: /docs/design/design-direction.md

> **Document status:** Phase 3A design — visual identity & principles. **Design specification only; no implementation.**
> **Depends on Phase 1:** [product-requirements.md](../product/product-requirements.md), [user-roles.md](../product/user-roles.md), [statuses.md](../product/statuses.md).
> **Depends on Phase 2:** [architecture-overview.md](../architecture/architecture-overview.md), [technology-stack.md](../architecture/technology-stack.md) (Tailwind + shadcn/ui + strict RSC), [security-and-operations.md](../architecture/security-and-operations.md) (nonce CSP).
> **Sibling design docs:** [design-tokens.md](./design-tokens.md), [application-shell.md](./application-shell.md), [navigation-and-routes.md](./navigation-and-routes.md), [components.md](./components.md), [patterns.md](./patterns.md), [accessibility-and-responsive.md](./accessibility-and-responsive.md), [phase-3-placeholder-pages.md](./phase-3-placeholder-pages.md), [phase-3-implementation-plan.md](./phase-3-implementation-plan.md), [open-design-decisions.md](./open-design-decisions.md).

---

## 1. Product visual philosophy

CloseoutFlow is the **command center for the last, most document-heavy phase of a construction project**. The interface earns trust the way a good set of project records does: it is **organized, legible, and calm under a large amount of information**. Every screen should make a project manager feel that *nothing is falling through the cracks*.

The guiding metaphor is **"the well-run closeout binder, made live"** — the credibility of a meticulously tabbed submittal binder, but searchable, current, and shared. We borrow the *discipline* of construction documentation (structure, labels, status, provenance) without cosplaying the *jobsite* (no hazard stripes, hard hats, or blueprint wallpaper).

**One-line positioning:** *A precise, professional operations tool for people who are accountable for getting a building's documentation closed out and handed over.*

---

## 2. Brand personality

| Trait | What it means here | How it shows up |
|-------|--------------------|-----------------|
| **Credible** | Feels safe to trust with a $20M project's records. | Restrained palette, real structure, no gimmicks. |
| **Precise** | Every status, date, and version is exact and legible. | Tabular numerics, clear status system, provenance always visible. |
| **Calm** | Handles dense data without feeling loud. | Generous but not wasteful whitespace, few competing colors, quiet motion. |
| **Grounded** | Built for construction professionals, not tech insiders. | Plain domain language, industrial-neutral palette, no trendy jargon or novelty. |
| **Efficient** | Respects the time of PMs juggling many projects. | Keyboard access, command palette, dense tables, fast scanning. |

**Voice pairing (UI copy):** direct, professional, plainspoken. "Assign requirement," not "Let's get this assigned!" Errors are specific and blameless.

---

## 3. Visual keywords

**Yes:** engineered · structured · legible · document-forward · quiet · durable · precise · flat · tabular · grounded.
**No:** playful · glossy · gradient-heavy · neon · consumer · gamified · "AI-magical" · skeuomorphic · trendy.

---

## 4. Design principles

1. **Information first, decoration last.** Chrome recedes; content (statuses, documents, dates, people) leads. No decorative illustration in the core app.
2. **Never color alone.** Status is always **icon + text label + color** (WCAG + colorblind safety). Color reinforces; it never carries meaning by itself.
3. **Borders over shadows.** Structure comes from hairline borders and spacing, not drop shadows. Elevation is reserved for things that truly float (menus, modals, drawers).
4. **One accent, used sparingly.** A single warm accent (amber) signals *attention/overdue/warning* only — it is not a decorative brand splash. The everyday brand color is a calm engineered blue.
5. **Density is a feature, not a bug.** Design for many rows and many projects. Provide a comfortable default and a compact mode; both must stay readable.
6. **Consistent status language everywhere.** The same status vocabulary from [statuses.md](../product/statuses.md) looks identical on a dashboard, a table cell, or a detail header.
7. **Provenance is always visible.** Who did what, when, and which version — surfaced, not buried. This is the product's trust differentiator.
8. **Quiet, purposeful motion.** Motion clarifies state changes; it never entertains. Everything respects `prefers-reduced-motion`.
9. **Accessible by construction.** WCAG 2.1 AA is a build constraint, not a later pass ([accessibility-and-responsive.md](./accessibility-and-responsive.md)).
10. **Professional in light mode first.** The product must look complete and credible in light mode; dark mode is a first-class option, never the crutch that makes it look "designed."

---

## 5. Density

- **Default: "comfortable-dense."** Tuned for professionals scanning many items — tighter than a consumer app, looser than a spreadsheet. Base body text 14px; table rows ~44px.
- **Compact mode** (user-toggleable, persisted): ~40px rows, tighter padding — for power users on large monitors.
- Density affects table row height, control height, and list padding via tokens; it never changes type legibility below AA.

## 6. Whitespace

- Whitespace is **structural**, used to group and separate, not to pad emptiness. Page gutters are generous (24px desktop); intra-component spacing is efficient.
- Dense data areas (tables) trade outer whitespace for scannable rows; surrounding page keeps breathing room so density feels intentional, not cramped.

## 7. Borders

- **Primary separation mechanism.** Hairline (1px) borders in a low-contrast neutral define cards, tables, inputs, and regions.
- Two border weights: **default** (subtle, most separations) and **strong** (emphasis, active/selected, table outer frame).
- Inputs use a visible-but-quiet border that strengthens on hover and becomes the focus ring color on focus.

## 8. Radius

- **Moderate, consistent radius.** Base 8px (`--radius`), giving a professional, slightly-softened feel — not sharp/severe, not pill-soft/consumer.
- Scale: controls/inputs/buttons use `md` (6px), cards/menus/modals use `lg` (8px), small chips use `sm` (4px), avatars/switches/loaders use `full`. Badges use `sm`/`md`, never full pills for statuses (rectangular-rounded reads more "record/label" than "tag").

## 9. Elevation

- **Flat by default.** Cards and panels sit on the canvas separated by borders and surface tint, not shadow.
- **Shadows only for true overlays:** dropdowns/popovers (`shadow-md`), modals/drawers/command palette (`shadow-lg`). Toasts use `shadow-md`.
- In **dark mode**, elevation is expressed by **lighter surface tint + border**, not heavier shadow (shadows read poorly on dark).

## 10. Motion

- **Fast and quiet.** 120–240ms, ease-out. Purposeful only: overlay enter/exit, drawer/sidebar slide, toast in/out, skeleton shimmer, focus/hover transitions.
- **No** looping, parallax, bounce, confetti, or attention-seeking animation. **No** motion that blocks input.
- Full `prefers-reduced-motion` support: transforms/shimmer become instant or opacity-only. See [design-tokens.md §motion](./design-tokens.md) and [patterns.md](./patterns.md).

## 11. Iconography

- **One line-icon set: Lucide** (already in the shadcn/ui ecosystem, tree-shakeable, OFL/ISC-licensed). Consistent 1.5px stroke, 20px default in UI, 16px in dense tables.
- **Line icons, not filled** — matches the flat, engineered character. Icons are functional (status, actions, file types, navigation), never decorative mascots.
- **Import individually** (`import { FileText } from "lucide-react"`) to protect the bundle ([performance in patterns/plan]).
- Status icons are a **fixed, semantic set** (see [patterns.md §status](./patterns.md)) so a status always pairs with the same glyph.

## 12. Data-visualization style

- **Restrained, functional, few colors.** Charts (later, Phase 11) follow the semantic palette: neutral grids, primary for the main series, status colors only when charting status. No 3D, no gradients-as-data, no rainbow categoricals.
- Foundational data viz in Phase 3 is limited to **progress bars, metric cards, and simple completeness meters** — labeled with real numbers, no decorative sparklines that imply analytics that don't exist yet.
- Follows the project's dataviz skill guidance when real charts arrive; Phase 3 introduces only the token groundwork.

## 13. Construction-industry positioning (credible, not cliché)

**Credible cues we use (subtle):**
- **Blueprint-blue heritage** expressed as a *deep engineered blue* primary — a nod to drawings/precision without literal blueprint grids.
- **A single warm amber accent** for attention/overdue — a restrained echo of jobsite hi-vis, used *only* semantically (warnings), never as decoration.
- **Warm-leaning neutral grays** ("concrete/graphite") rather than cold blue-grays — feels material and grounded.
- **Structure and labeling** (tabs, registers, provenance) that mirror how closeout binders and specs are organized — the credibility is in the *information architecture*, not imagery.
- **Domain-accurate language** everywhere (Requirement, Submission, Lien Waiver, Substantial Completion) from [glossary.md](../product/glossary.md).

**Clichés we explicitly avoid** (see §14).

## 14. Examples of what to avoid

- ❌ Hazard/caution stripes, hard-hat or traffic-cone icons, wrench/gear mascots.
- ❌ Blueprint-grid backgrounds or faux-paper textures.
- ❌ Safety-orange as a dominant/brand color (amber is a *sparing semantic accent* only).
- ❌ Generic admin-template look (purple gradient sidebar, rounded-pill everything, emoji, stock illustrations).
- ❌ "AI startup" gradients, glow, or glassmorphism.
- ❌ Banking-app navy-and-gold formality or consumer fintech playfulness.
- ❌ Colorful PM-clone (Trello/Asana) multi-color boards and bright category chips.
- ❌ Dark-mode-only "cool" screenshots that fall apart in light mode.
- ❌ Motion that entertains (bounce, confetti, parallax).

## 15. Light and dark visual direction

- **Light theme (primary):** warm-neutral near-white canvas, white surfaces, hairline borders, deep engineered-blue primary, near-black warm-gray text. This is the reference look and must feel finished on its own.
- **Dark theme (first-class):** deep desaturated slate canvas (not pure black), slightly lighter panel surfaces, brighter primary blue for contrast, softened foreground (not pure white) to reduce halation in long sessions. Elevation via surface tint + border, not shadow.
- **System-preference aware**, user-overridable, persisted, flash-free (nonce'd init script) — see [design-tokens.md](./design-tokens.md) and [accessibility-and-responsive.md](./accessibility-and-responsive.md).
- **Contrast target:** both themes meet WCAG 2.1 AA for text and UI components; status colors are chosen to pass in both themes and to remain distinguishable for common color-vision deficiencies (reinforced by icon + label).

---

*Continue to [design-tokens.md](./design-tokens.md).*

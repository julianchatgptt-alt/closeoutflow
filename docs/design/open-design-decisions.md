# FILE: /docs/design/open-design-decisions.md

> **Document status:** Phase 3A design — decisions that genuinely need **founder approval**. Everything else is decided in the design docs. Each item has a professional default that Codex can proceed on unless the founder objects.
> **Format:** Decision · Why it matters · Recommended choice · Alternatives · Visual/product consequence · When to decide · Blocks Phase 3B?

---

## OD-1 — Primary UI typeface
- **Decision:** IBM Plex Sans vs. Inter (vs. system stack) for `--font-sans`.
- **Why it matters:** Sets the product's whole character and its legibility in dense tables; changing later is a visible, repo-wide reflow.
- **Recommended:** **IBM Plex Sans + IBM Plex Mono** (engineering heritage, distinctive-but-serious, OFL, self-hosted, dense-table legible).
- **Alternatives:** **Inter + JetBrains/IBM Plex Mono** (maximally neutral, most compact — safest for density but "generic SaaS"); **system stack** (zero cost, least distinctive).
- **Consequence:** Plex feels more "engineered/credible"; Inter feels more "clean/neutral." Both are license-safe and drop-in via the same tokens.
- **When:** before/at Task 2. **Blocks 3B?** **No** — default proceeds; a swap is a one-token change if founder prefers Inter.

## OD-2 — Brand mark placement & logo
- **Decision:** Brand/logo in **sidebar top** (recommended) vs. header-left; and whether a real logo/wordmark exists yet.
- **Why it matters:** Anchors the shell layout (org switcher placement depends on it) and first impression.
- **Recommended:** **Logo mark + wordmark in the sidebar top**, mark-only when collapsed; header begins at the sidebar's right edge with the org switcher first. Use a simple typographic wordmark placeholder until a real logo exists.
- **Alternatives:** brand in header-left (org switcher then moves right).
- **Consequence:** affects header composition and the collapsed-rail top.
- **When:** before Task 6. **Blocks 3B?** **No** — placeholder wordmark proceeds; real logo can drop in later.

## OD-3 — Primary brand color exact value
- **Decision:** Confirm the **engineered-blue** primary (`--blue-600 ≈ 216 68% 36%`) and the **amber** accent, vs. a different brand hue.
- **Why it matters:** The single most visible brand decision; pervades buttons, links, focus, active nav.
- **Recommended:** **Deep engineered blue** primary + **amber** as the sparing attention/warning accent + warm-neutral grays (per [design-tokens.md](./design-tokens.md)). Distinct from bright-SaaS-blue and banking-navy; construction-credible without cliché.
- **Alternatives:** graphite/near-black primary with blue accent (more monochrome/severe); teal or deep green primary (fresher, less "infrastructure").
- **Consequence:** sets the entire palette's temperature; status hues are chosen to coexist with it.
- **When:** Task 1 (founder approves the swatch). **Blocks 3B?** **Soft** — Task 1 needs sign-off on the palette before primitives are themed; a hue change after primitives are built is rework. Recommend deciding at Task 1.

## OD-4 — Status color/icon system sign-off
- **Decision:** Approve the status→tone→icon mapping in [patterns.md §9](./patterns.md) (green/amber/red/blue/slate/violet; ≤3 tones per screen).
- **Why it matters:** Status is CloseoutFlow's core visual language; it must be consistent and product-wide from the start.
- **Recommended:** the mapping as specified (color + icon + label, muted for closed states, violet reserved for owner/external review).
- **Alternatives:** fewer hues (drop violet, fold owner-review into blue) for maximum restraint.
- **Consequence:** changing status semantics later touches every list/detail/dashboard.
- **When:** Task 5. **Blocks 3B?** **No** (default proceeds), but founder review at Task 5 is recommended before mass use.

## OD-5 — Density default (Comfortable vs Compact)
- **Decision:** Default table/list density.
- **Why it matters:** First impression of "calm vs. dense"; power users may want compact.
- **Recommended:** **Comfortable-dense default** (44px rows) + a **Compact** toggle (40px), persisted.
- **Alternatives:** compact-by-default (more data, busier first impression).
- **Consequence:** affects perceived professionalism/density on first run.
- **When:** Task 1/9. **Blocks 3B?** **No** — both are built; default is a one-line choice.

## OD-6 — Component gallery: dedicated `/design` vs. reuse `/playground`
- **Decision:** New `/design` route vs. extending the existing gated `/playground`.
- **Why it matters:** Minor, but affects where the living design reference lives and the gating code reused.
- **Recommended:** **Extend the existing gated `/playground` → rename/alias `/design`**, reusing the proven `playground/access.ts` runtime gate (local/test only, dynamic, 404 in prod). **No Storybook** (avoids tooling weight; the app itself is the reference).
- **Alternatives:** adopt Storybook (more tooling/CI weight, separate build); brand-new route (duplicate gating).
- **Consequence:** Storybook would add maintenance; the in-app gallery keeps one source of truth.
- **When:** Task 12. **Blocks 3B?** **No.**

## OD-7 — Settings ↔ Team duplication
- **Decision:** Is member management primarily **Team** (`/team`) or **Settings → Members** (`/settings/members`)?
- **Why it matters:** Avoids two competing homes for the same data.
- **Recommended:** **Team** is the primary destination (sidebar); **Settings → Members** links/redirects to it. Single source.
- **Alternatives:** members only under Settings (drop the sidebar Team item — but Team is a frequent destination for admins).
- **Consequence:** navigation clarity; avoids duplicate tables later.
- **When:** Task 11. **Blocks 3B?** **No.**

## OD-8 — Owner-portal & subcontractor-portal branding scope (forward-looking)
- **Decision:** How much visual customization customers may eventually apply (logo, accent) and what CloseoutFlow controls.
- **Why it matters:** The owner portal is a long-term GC-branded surface; setting boundaries now prevents customers from breaking accessibility/semantics later.
- **Recommended:** **CloseoutFlow controls** the neutral system, status colors, typography, layout, and a11y; **customers may later customize** logo + a single accent within contrast-safe bounds (owner portal shows GC logo/name). Status colors and semantic tokens are **not** customer-overridable.
- **Alternatives:** full white-label (much larger scope; not for the initial product).
- **Consequence:** guides Phase 14 owner-portal design; no Phase 3 build impact.
- **When:** before Phase 14 (not now). **Blocks 3B?** **No** — documented for later; the token architecture already reserves an org-accent layer.

## OD-9 — Dark mode at launch: on by default (system) vs. opt-in
- **Decision:** Default theme = **System** (follow OS) vs. force Light until user opts in.
- **Why it matters:** Sets first impression; dark must be first-class but light is the reference.
- **Recommended:** **Default to System**, user-overridable to Light/Dark, persisted. Light remains the design reference (product looks complete in light).
- **Alternatives:** default Light (safest for "professional in light mode" perception).
- **Consequence:** dark-preference users get dark immediately; both must be polished (they are, per tokens).
- **When:** Task 3. **Blocks 3B?** **No.**

---

## Summary: what blocks Phase 3B
**Nothing hard-blocks.** All items have safe defaults Codex can build on. The only **soft gates** are founder **visual sign-offs** at specific tasks (not open questions):
- **OD-3 (palette)** at **Task 1**, **OD-1 (typeface)** at **Task 2**, **OD-4 (status system)** at **Task 5**, and overall shell/mobile/product look at **Tasks 6, 8, 11, 15**.

If the founder is unavailable, Codex may proceed on the recommended defaults through Task 1–5 and gather the sign-offs at the Task 6/11 screenshot reviews; a later palette/typeface change is a bounded token swap, not a rebuild.

---

*End of open-design-decisions.md. See the design set index in [design-direction.md](./design-direction.md).*

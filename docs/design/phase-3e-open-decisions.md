# FILE: /docs/design/phase-3e-open-decisions.md

> **Document status:** Phase 3E-A — the only decisions that genuinely need the founder. Everything else is decided in the sibling docs with professional defaults Codex builds on. **Nothing here hard-blocks Phase 3E-B** — each has a safe default; founder review happens at the named screenshot checkpoints.
> **Format:** Question · Recommended default · Why · Alternatives · Visual impact · Implementation cost · Blocks 3E-B?

---

## OD-3E-1 — Tinted canvas depth (the core light-theme move)
- **Question:** How pronounced should the graphite "desk" tint behind the white paper surfaces be? Spec value: `--background: 216 20% 95.5%`.
- **Recommended default:** the spec value — clearly visible tint, still unmistakably light mode.
- **Why:** this single token is what kills the "white admin template" look; too subtle (today's 98%) reads as white, too deep (<94%) starts feeling like a gray app.
- **Alternatives:** subtler `96.5%` (safer, less transformation) · deeper `94.5%` (more contrast, slightly heavier).
- **Visual impact:** the highest of any Phase 3E change — defines the product's first impression.
- **Cost:** one token; adjustable in minutes at any point.
- **Blocks 3E-B?** No — default proceeds at Task 2; founder confirms at the Task 2 before/after screenshot.

## OD-3E-2 — Preview honesty consolidated to one pill per page
- **Question:** Is a single page-level **Preview pill** (with explanatory popover) sufficient honesty, replacing per-card "Sample data" captions, per-row "Sample driver explanation"/"Static provenance example" text, and disclaimer paragraphs?
- **Recommended default:** yes — one pill per placeholder page, popover carries the full disclosure, obviously-fictional sample names remain.
- **Why:** the current UI's loudest message is its own disclaimer (five kinds on the dashboard alone); honesty is preserved at the page level while the product gets to look like a product. A new e2e assertion enforces exactly one pill per placeholder page.
- **Alternatives:** keep a second indicator on data containers (tables/stat strip) — more explicit, restores some noise.
- **Visual impact:** large — most of the perceived "demo-ware" feel disappears.
- **Cost:** part of Task 7 either way.
- **Blocks 3E-B?** No — but this is a **product-integrity call**, so the founder should explicitly okay it at the Task 7 checkpoint.

## OD-3E-3 — Removing the "Customize — Phase 11" affordance from the dashboard
- **Question:** Delete the dead Customize button entirely (spec) or keep a quiet locked-outline version?
- **Recommended default:** delete; the future Phase 11 affordance is documented in the gallery instead.
- **Why:** a permanently disabled control in the page's prime action slot earns nothing and anchors the "demo" feel; nothing else in the app previews Phase 11 chrome.
- **Alternatives:** locked-outline button (consistent with the new pattern, keeps the roadmap visible in-product).
- **Visual impact:** moderate (page-header cleanliness, especially on mobile where it's currently the first full-width element).
- **Cost:** trivial either way.
- **Blocks 3E-B?** No — default proceeds at Task 11.

## OD-3E-4 — Dark-theme desaturation degree
- **Question:** Approve the shift from blue-gray (27–33% sat) dark surfaces to desaturated graphite steps (12–20% sat) per [visual-direction §6](./phase-3e-visual-direction.md).
- **Recommended default:** the spec values — graphite with blue reserved for interactive/status ink.
- **Why:** eliminates navy-on-navy monotony; surfaces separate by lightness steps the eye can actually read.
- **Alternatives:** keep more blue in the neutrals (~22% sat) for a "bluer" brand feel at some cost in surface separation.
- **Visual impact:** high for dark-mode users; zero for light mode.
- **Cost:** one token block; adjustable anytime.
- **Blocks 3E-B?** No — founder confirms at the Task 3 dark screenshots.

## OD-3E-5 — Paper shadow (`--shadow-card`) vs. strictly flat
- **Question:** Accept the whisper shadow on light-mode paper surfaces (a deliberate softening of the original "borders over shadows" principle), or stay border-only?
- **Recommended default:** accept — `0 1px 2px @ 5% + border ring`, light mode only, prohibited on controls/rows/dark mode.
- **Why:** the tinted canvas needs a hint of lift for the paper metaphor to land; at 5% opacity it's felt, not seen, and the flat character survives.
- **Alternatives:** border-only (purist flat — slightly less depth); stronger shadow (rejected: violates the calm direction).
- **Visual impact:** subtle but compounding across every card/table.
- **Cost:** one token + Card class.
- **Blocks 3E-B?** No — bundled with Task 2's checkpoint.

---

## Summary
No decision blocks Phase 3E-B. Codex proceeds on all defaults; the founder's **soft screenshot gates** are Task 2 (canvas + shadow), Task 3 (dark), Task 7 (preview honesty), Task 11 (dashboard), and Task 19 (final set). Only a major contradiction at those gates pauses work — otherwise review notes feed forward without stopping the sequence.

---

*End of the Phase 3E-A set: [visual-audit](./phase-3e-visual-audit.md) · [visual-direction](./phase-3e-visual-direction.md) · [dashboard-redesign](./phase-3e-dashboard-redesign.md) · [component-polish](./phase-3e-component-polish.md) · [implementation-plan](./phase-3e-implementation-plan.md) · this file.*

# Phase 5D visual evidence manifest

> Capture command: `$env:PHASE5D_CAPTURE_DIR='<absolute-output-directory>'; pnpm capture:phase5d`
> Seed: migrations `0000`–`0021` plus `supabase/seed/seed.sql`; the harness resets the local database.
> Evidence commit: `aded4e8` (with navigation/date foundation in `825b279`).
> Recorded output: `C:\Users\julia\.codex\visualizations\2026\07\20\phase-5d`.

Screenshot binaries stay outside Git to avoid repository growth and accidental authentication artifacts. The committed capture command is deterministic, Windows/OneDrive-safe, uses local Supabase only, creates a dedicated seeded owner session, reduces animation, and excludes the Next.js development toolbar. The completed run passed 2/2 Playwright capture steps and generated the following 24 files.

| Capture identifier | Route/state | Viewport | Theme | Review target | Status |
| --- | --- | --- | --- | --- | --- |
| `projects--desktop--light` | `/projects` | 1440×900 | Light | list, friendly dates, no horizontal overflow | Passed — reviewed |
| `projects--desktop--dark` | `/projects` | 1440×900 | Dark | graphite theme and contrast | Passed — reviewed |
| `projects--mobile--light` | `/projects` | 390×844 | Light | cards and singular/plural copy | Passed — reviewed |
| `project-create--desktop--light` | `/projects/new` | 1440×900 | Light | name-only creation | Passed — reviewed |
| `project-overview--desktop--light` | seeded project | 1440×900 | Light | breadcrumb, overview, setup | Passed — reviewed |
| `project-overview--mobile--light` | seeded project | 390×844 | Light | reflow and horizontal containment | Passed — reviewed |
| `project-overview--long-name--desktop--light` | capture-created project | 1440×900 | Light | accessible long-name breadcrumb | Passed — reviewed |
| `project-settings--desktop--light` | seeded settings | 1440×900 | Light | date inputs, conflicts, lifecycle | Passed — reviewed |
| `setup-checklist--desktop--light` | seeded overview | 1440×900 | Light | real completion state | Passed — reviewed |
| `companies--desktop--light` | `/companies` | 1440×900 | Light | reusable directory | Passed — reviewed |
| `company-detail--desktop--light` | seeded company | 1440×900 | Light | reuse relationships | Passed — reviewed |
| `contacts--desktop--light` | `/contacts` | 1440×900 | Light | external contact directory | Passed — reviewed |
| `contact-detail--desktop--light` | seeded contact | 1440×900 | Light | friendly affiliation dates | Passed — reviewed |
| `project-companies--desktop--light` | project companies | 1440×900 | Light | reuse and role clarity | Passed — reviewed |
| `project-contacts--desktop--light` | project contacts | 1440×900 | Light | external contact clarity | Passed — reviewed |
| `project-team--desktop--light` | project team | 1440×900 | Light | organization role vs project responsibility | Passed — reviewed |
| `project-companies--mobile--light` | project companies | 390×844 | Light | mobile assignment | Passed — reviewed |
| `project-contacts--mobile--light` | project contacts | 390×844 | Light | mobile assignment | Passed — reviewed |
| `project-team--mobile--light` | project team | 390×844 | Light | mobile responsibility editor | Passed — reviewed |
| `project-archive-confirmation--desktop--light` | archive dialog | 1440×900 | Light | consequence and confirmation | Passed — reviewed |
| `project-permission-denied--desktop--light` | inaccessible project as viewer | 1440×900 | Light | non-enumerating recovery | Passed — reviewed |
| `company-duplicate-warning--desktop--light` | seeded duplicate query | 1440×900 | Light | visible, non-blocking warning | Passed — reviewed |
| `loading-and-error-states--desktop--light` | `/design` state specimens | 1440×900 | Light | inherited recovery patterns | Passed — reviewed |
| `friendly-dates--desktop--light` | seeded project overview | 1440×900 | Light | date-only presentation | Passed — reviewed |

## Review conclusion

Normal and long project names are human-readable; raw route UUIDs are absent from visible breadcrumbs; dates are friendly; no whole-document horizontal overflow was observed; relationship and internal-team distinctions remain clear on mobile; light/dark contrast passed axe; and loading, error, permission-denied, duplicate, archive, and stale-recovery states are understandable. The temporary Closeout mark and authentication visuals remain intentionally unchanged for the dedicated next phase.

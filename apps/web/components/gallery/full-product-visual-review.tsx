/*
 * Phase 6E-B1 — Full-Product Visual Direction Review (DEV-ONLY).
 * Static, production-quality visual prototypes for founder review, rendered inside
 * the local/test-gated /design gallery. Uses SCOPED prototype tokens
 * (full-product-visual-review.module.css) and never touches production tokens,
 * routes, data, or business logic. All data below is illustrative specimen data.
 */
import {
  AlertTriangle,
  Bell,
  Building2,
  ChevronLeft,
  ClipboardList,
  Contact,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Shield,
  UsersRound
} from "lucide-react";
import type { ReactNode } from "react";

import styles from "./full-product-visual-review.module.css";

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

/** A specimen surface at a fixed theme so light and dark can be compared side by side. */
function Specimen({
  label,
  theme = "light",
  className,
  children
}: {
  label: string;
  theme?: "light" | "dark";
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 grid gap-2">
      <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>
      <div className={theme === "dark" ? "dark" : undefined}>
        <div
          className={cx(styles.scope, styles.canvas, "overflow-hidden rounded-xl p-4", className)}
        >
          {children}
        </div>
      </div>
    </figure>
  );
}

function Board({
  id,
  title,
  intent,
  children
}: {
  id: string;
  title: string;
  intent: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid gap-4 border-t pt-8" aria-label={title}>
      <div>
        <h3 className="text-[length:var(--text-h2)] font-semibold">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{intent}</p>
      </div>
      {children}
    </section>
  );
}

function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {/* Corrected Keystone Fold symbol (unchanged asset; placement only). */}
      <img src="/brand/closeout-symbol.svg" alt="" aria-hidden width={22} height={22} />
      {!collapsed ? (
        <span className="text-[15px] font-semibold" style={{ color: "hsl(var(--pv-fg))" }}>
          Closeout
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Prototype 1 — Application shell
 * ------------------------------------------------------------------ */

const workNav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Projects", icon: FolderKanban },
  { label: "Companies", icon: Building2 },
  { label: "Contacts", icon: Contact },
  { label: "Templates", icon: ClipboardList }
];
const orgNav = [
  { label: "Reports", icon: LayoutDashboard, disabled: true },
  { label: "Team", icon: UsersRound },
  { label: "Settings", icon: Settings }
];

function ShellSidebar({ collapsed = false }: { collapsed?: boolean }) {
  // Prototype specimens are visual illustrations of the shell, not the navigable
  // app, so landmark elements are demoted to plain divs to avoid duplicate landmarks.
  return (
    <div
      className={cx(styles.panel, "flex shrink-0 flex-col gap-4 p-3")}
      style={{ width: collapsed ? 64 : 240 }}
    >
      <div className="px-1 py-1">{collapsed ? <Wordmark collapsed /> : <Wordmark />}</div>
      <div className="grid gap-1">
        {!collapsed ? <p className={cx(styles.overline, "px-3 pb-1")}>Work</p> : null}
        {workNav.map((item) => (
          <span
            key={item.label}
            className={cx(styles.navItem, item.active && styles.navItemActive)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed ? item.label : <span className="sr-only">{item.label}</span>}
          </span>
        ))}
        {!collapsed ? <p className={cx(styles.overline, "mt-3 px-3 pb-1")}>Organization</p> : null}
        {orgNav.map((item) => (
          <span
            key={item.label}
            className={cx(styles.navItem, item.disabled && styles.navDisabled)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed ? (
              <span className="flex flex-1 items-center justify-between">
                {item.label}
                {item.disabled ? (
                  <span className={cx(styles.chip, "text-[10px]")}>Later</span>
                ) : null}
              </span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </span>
        ))}
      </div>
      <span className={cx(styles.navItem, "mt-auto justify-center")}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="sr-only">Collapse sidebar</span>
      </span>
    </div>
  );
}

function ShellHeader() {
  return (
    <div className={cx(styles.panel, "flex items-center gap-3 px-3 py-2")}>
      <span className={cx(styles.chip, "gap-2")}>
        <Building2 className="h-3.5 w-3.5" aria-hidden />
        <span className="max-w-[10rem] truncate">Sample Construction Co.</span>
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <ol className="flex items-center gap-2" style={{ color: "hsl(var(--pv-muted))" }}>
          <li>Projects</li>
          <li aria-hidden>/</li>
          <li>Riverside Medical Office</li>
          <li aria-hidden>/</li>
          <li style={{ color: "hsl(var(--pv-fg))" }}>Requirements</li>
        </ol>
      </div>
      <span className={cx(styles.chip, "gap-2")}>
        <Search className="h-3.5 w-3.5" aria-hidden /> Search{" "}
        <kbd style={{ color: "hsl(var(--pv-muted))" }}>⌘K</kbd>
      </span>
      <Bell className="h-4 w-4" aria-hidden style={{ color: "hsl(var(--pv-muted))" }} />
      <HelpCircle className="h-4 w-4" aria-hidden style={{ color: "hsl(var(--pv-muted))" }} />
      <span
        className="grid h-7 w-7 place-items-center rounded-full text-xs font-semibold"
        style={{ background: "hsl(var(--pv-accent-tint))", color: "hsl(var(--pv-accent))" }}
      >
        OO
      </span>
    </div>
  );
}

function ShellPrototype({ collapsed = false, theme = "light" as "light" | "dark" }) {
  return (
    <Specimen label={`Shell — ${collapsed ? "collapsed" : "expanded"} · ${theme}`} theme={theme}>
      <div className="flex gap-3" style={{ minHeight: 260 }}>
        <ShellSidebar collapsed={collapsed} />
        <div className="grid flex-1 gap-3">
          <ShellHeader />
          <div className={cx(styles.quiet, "grid place-items-center p-8 text-center")}>
            <p className={styles.secondary}>Operational content renders here on a calm canvas.</p>
          </div>
        </div>
      </div>
    </Specimen>
  );
}

function MobileNavPrototype() {
  return (
    <Specimen label="Mobile navigation — drawer + grouped rail" className="max-w-[380px]">
      <div className={cx(styles.panel, "flex items-center gap-3 px-3 py-2")}>
        <Menu className="h-5 w-5" aria-hidden />
        <Wordmark />
      </div>
      <div className={cx(styles.raised, "mt-3 grid gap-1 p-3")}>
        <p className={cx(styles.overline, "px-3 pb-1")}>Work</p>
        {workNav.map((item) => (
          <span
            key={item.label}
            className={cx(styles.navItem, item.active && styles.navItemActive)}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </span>
        ))}
        <p className={cx(styles.overline, "mt-2 px-3 pb-1")}>Organization</p>
        {orgNav.map((item) => (
          <span
            key={item.label}
            className={cx(styles.navItem, item.disabled && styles.navDisabled)}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </span>
        ))}
      </div>
    </Specimen>
  );
}

/* ------------------------------------------------------------------ *
 * Prototype 2 — Dashboard Direction A (attention-first, truthful)
 * ------------------------------------------------------------------ */

const attentionProjects = [
  {
    name: "Riverside Medical Office",
    status: "Closeout In Progress",
    attention: 4,
    reasons: "3 unassigned · 1 without a date",
    progress: 40
  },
  {
    name: "Eastgate Retail Buildout",
    status: "Active",
    attention: 9,
    reasons: "9 requirements need setup",
    progress: 12
  },
  {
    name: "Grace Community Church",
    status: "Owner Review",
    attention: 1,
    reasons: "1 without a responsible company",
    progress: 92
  }
];

function DashHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h4 className={styles.title}>Dashboard</h4>
        <p className={styles.secondary}>Sample Construction Co.</p>
      </div>
      <span className={styles.btnPrimary}>New project</span>
    </div>
  );
}

function DashMetrics() {
  const items = [
    { label: "Active projects", value: "3" },
    { label: "Projects needing setup", value: "2" },
    { label: "Requirements needing attention", value: "14", attention: true }
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((m) => (
        <div key={m.label} className={cx(styles.quiet, "px-4 py-3")}>
          <p className={cx(styles.metric, m.attention && "flex items-center gap-2")}>
            {m.value}
            {m.attention ? (
              <AlertTriangle
                className="h-4 w-4"
                style={{ color: "hsl(var(--pv-warning-fg))" }}
                aria-label="Attention"
              />
            ) : null}
          </p>
          <p className={cx(styles.secondary, "text-[13px]")}>{m.label}</p>
        </div>
      ))}
    </div>
  );
}

function DashAttentionList({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cx(styles.raised, "overflow-hidden")}>
      <div className="flex items-center justify-between px-4 py-3">
        <p className={styles.overline}>Projects needing setup attention</p>
        <span className="text-xs font-medium" style={{ color: "hsl(var(--pv-accent))" }}>
          View all
        </span>
      </div>
      <ul className="grid">
        {attentionProjects.map((p) => (
          <li key={p.name} className={cx(styles.rowRule, "flex items-center gap-4 px-4 py-3.5")}>
            <div className="min-w-0 flex-1">
              <p
                className="truncate font-semibold"
                style={{ color: "hsl(var(--pv-fg))" }}
                title={p.name}
              >
                {p.name}
              </p>
              <p className={cx(styles.secondary, "truncate text-[13px]")}>
                {p.status} · {p.reasons}
              </p>
            </div>
            {!compact ? (
              <div className="w-28 shrink-0">
                <div className={styles.meterTrack}>
                  <div className={styles.meterFill} style={{ width: `${p.progress}%` }} />
                </div>
                <p
                  className="mt-1 text-right text-[11px]"
                  style={{ color: "hsl(var(--pv-muted))" }}
                >
                  {p.progress}% set up
                </p>
              </div>
            ) : null}
            <span className={styles.chipAttention}>{p.attention} to fix</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashRail() {
  return (
    <div className="grid gap-3">
      <div className={cx(styles.panel, "p-4")}>
        <p className={cx(styles.overline, "mb-2")}>Recently configured templates</p>
        <ul className="grid gap-2 text-sm">
          <li className="flex items-center justify-between">
            <span>Medical Office Closeout</span>
            <span className={styles.chip}>v1 · Published</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Warehouse Closeout</span>
            <span className={styles.chip}>v2 · Draft</span>
          </li>
        </ul>
      </div>
      <div className={cx(styles.quiet, "p-4")}>
        <p className={cx(styles.overline, "mb-1")}>Recommended next action</p>
        <p className={styles.secondary}>
          Assign a responsible company to 12 requirements across 2 projects.
        </p>
      </div>
    </div>
  );
}

function DashboardPrototype({ theme = "light" as "light" | "dark" }) {
  return (
    <Specimen label={`Dashboard — Direction A · ${theme}`} theme={theme}>
      <div className="grid gap-4">
        <DashHeader />
        <DashMetrics />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
          <DashAttentionList />
          <DashRail />
        </div>
      </div>
    </Specimen>
  );
}

function DashboardEmptyPrototype() {
  return (
    <Specimen label="Dashboard — empty organization">
      <DashHeader />
      <div className={cx(styles.raised, "mt-4 grid place-items-center gap-3 p-10 text-center")}>
        <div
          className="grid h-12 w-12 place-items-center rounded-full"
          style={{ background: "hsl(var(--pv-accent-tint))" }}
        >
          <FolderKanban
            className="h-6 w-6"
            style={{ color: "hsl(var(--pv-accent))" }}
            aria-hidden
          />
        </div>
        <p className="text-lg font-semibold">Create your first project</p>
        <p className={cx(styles.secondary, "max-w-md")}>
          Every closeout starts with a project. Create one and we'll help you assemble the
          requirement scope, team, and dates.
        </p>
        <span className={styles.btnPrimary}>New project</span>
      </div>
    </Specimen>
  );
}

function DashboardMobilePrototype() {
  return (
    <Specimen label="Dashboard — mobile" className="max-w-[380px]">
      <div className="grid gap-3">
        <div>
          <h4 className="text-2xl font-semibold">Dashboard</h4>
          <p className={styles.secondary}>Sample Construction Co.</p>
        </div>
        <span className={cx(styles.btnPrimary, "w-full")}>New project</span>
        <div className="grid grid-cols-2 gap-2">
          <div className={cx(styles.quiet, "px-3 py-2")}>
            <p className={styles.metric}>3</p>
            <p className="text-[12px]" style={{ color: "hsl(var(--pv-muted-strong))" }}>
              Active projects
            </p>
          </div>
          <div className={cx(styles.quiet, "px-3 py-2")}>
            <p className={cx(styles.metric, "flex items-center gap-1")}>
              14
              <AlertTriangle
                className="h-3.5 w-3.5"
                style={{ color: "hsl(var(--pv-warning-fg))" }}
                aria-hidden
              />
            </p>
            <p className="text-[12px]" style={{ color: "hsl(var(--pv-muted-strong))" }}>
              Need attention
            </p>
          </div>
        </div>
        <DashAttentionList compact />
      </div>
    </Specimen>
  );
}

/* ------------------------------------------------------------------ *
 * Prototype 3 — Requirement register
 * ------------------------------------------------------------------ */

const registerGroups = [
  {
    category: "O&M Manuals",
    rows: [
      {
        title: "HVAC O&M Manual",
        source: "From Medical Office Closeout v1",
        company: "Ace Mechanical",
        contact: "Morgan Chen",
        owner: "Casey Coordinator",
        due: "Sep 1, 2026",
        status: "Planned" as const
      }
    ]
  },
  {
    category: "Warranties",
    rows: [
      {
        title: "Roofing Warranty",
        source: "From Medical Office Closeout v1",
        company: "Gone Interiors",
        stale: "Company left project",
        owner: null,
        due: null,
        status: "Planned" as const
      }
    ]
  },
  {
    category: "As-Built Drawings",
    rows: [
      {
        title: "Architectural As-Built Drawings",
        source: "From Medical Office Closeout v1",
        company: null,
        owner: null,
        due: "Jul 1, 2026",
        datePassed: true,
        status: "Planned" as const
      }
    ]
  }
];

function RegisterTable() {
  return (
    <div className={cx(styles.panel, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-2 p-3">
        <span className={styles.chipInfo}>Requirements 4</span>
        <span className={styles.chip}>
          <AlertTriangle className="h-3 w-3" aria-hidden /> Needs attention 3
        </span>
        <span className={styles.chip}>Not applicable 1</span>
        <span className={cx(styles.chip, "ml-auto")}>
          <Search className="h-3 w-3" aria-hidden /> Search
        </span>
      </div>
      <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr className={styles.tableHead}>
            <th className="w-10 py-2 pl-4 text-left">
              <span className="sr-only">Select</span>
            </th>
            <th className="py-2 text-left">Requirement</th>
            <th className="w-40 py-2 text-left">Responsible</th>
            <th className="w-32 py-2 text-left">Owner</th>
            <th className="w-28 py-2 text-left">Due date</th>
            <th className="w-24 py-2 pr-4 text-left">Status</th>
          </tr>
        </thead>
        {registerGroups.map((g) => (
          <tbody key={g.category}>
            <tr className={styles.groupHead}>
              <th colSpan={6} className="py-2 pl-4 text-left">
                {g.category} <span className="font-normal">({g.rows.length})</span>
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.title} className={styles.rowRule}>
                <td className="py-3 pl-4">
                  <span
                    className="inline-block h-4 w-4 rounded border"
                    style={{ borderColor: "hsl(var(--pv-border))" }}
                  />
                </td>
                <td className="max-w-0 py-3 pr-3">
                  <p
                    className="truncate font-semibold"
                    style={{ color: "hsl(var(--pv-fg))" }}
                    title={r.title}
                  >
                    {r.title}
                  </p>
                  <p className="truncate text-[12px]" style={{ color: "hsl(var(--pv-muted))" }}>
                    {r.source}
                  </p>
                </td>
                <td className="py-3 pr-3">
                  {r.company ? (
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] font-medium"
                        style={{ color: "hsl(var(--pv-fg))" }}
                      >
                        {r.company}
                      </p>
                      {"contact" in r && r.contact ? (
                        <p
                          className="truncate text-[12px]"
                          style={{ color: "hsl(var(--pv-muted))" }}
                        >
                          {r.contact}
                        </p>
                      ) : null}
                      {"stale" in r && r.stale ? (
                        <span className={cx(styles.chipAttention, "mt-0.5 text-[11px]")}>
                          {r.stale}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: "hsl(var(--pv-warning-fg))" }}
                    >
                      Unassigned
                    </span>
                  )}
                </td>
                <td
                  className="py-3 pr-3 text-[13px]"
                  style={{ color: r.owner ? "hsl(var(--pv-fg))" : "hsl(var(--pv-muted))" }}
                >
                  {r.owner ?? "No owner"}
                </td>
                <td className="py-3 pr-3">
                  {r.due ? (
                    <span className="text-[13px] tabular-nums">
                      {r.due}
                      {"datePassed" in r && r.datePassed ? (
                        <span
                          className="mt-0.5 block text-[11px] font-medium"
                          style={{ color: "hsl(var(--pv-warning-fg))" }}
                        >
                          Planned date passed
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-[13px]" style={{ color: "hsl(var(--pv-muted))" }}>
                      No date
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className={styles.chipInfo}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <div className={cx(styles.quiet, "m-3 flex flex-wrap items-center gap-3 rounded-lg p-3")}>
        <span className={styles.overline}>Change selected</span>
        <span className={styles.chip}>Assign company ▾</span>
        <span className={styles.chip}>Set due date</span>
        <span className={cx(styles.btnPrimary, "ml-auto h-9")}>Apply to selected</span>
      </div>
    </div>
  );
}

function RegisterPrototype({ theme = "light" as "light" | "dark" }) {
  return (
    <Specimen label={`Requirement register — ${theme}`} theme={theme}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h4 className={styles.title}>Requirements</h4>
          <p className={styles.secondary}>The closeout scope for Riverside Medical Office.</p>
        </div>
        <div className="flex gap-2">
          <span className={styles.btnQuiet}>Apply template</span>
          <span className={styles.btnPrimary}>Add requirement</span>
        </div>
      </div>
      <RegisterTable />
    </Specimen>
  );
}

function RegisterMobilePrototype() {
  return (
    <Specimen label="Requirement register — mobile cards" className="max-w-[380px]">
      <h4 className="mb-2 text-2xl font-semibold">Requirements</h4>
      <div className="grid gap-2">
        {registerGroups.flatMap((g) =>
          g.rows.map((r) => (
            <div key={r.title} className={cx(styles.panel, "p-3")}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="text-[12px]" style={{ color: "hsl(var(--pv-muted))" }}>
                    {g.category}
                  </p>
                </div>
                <span className={styles.chipInfo}>{r.status}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
                <span
                  style={{ color: r.company ? "hsl(var(--pv-fg))" : "hsl(var(--pv-warning-fg))" }}
                >
                  {r.company ?? "Unassigned"}
                </span>
                <span style={{ color: "hsl(var(--pv-muted))" }}>{r.due ?? "No date"}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Specimen>
  );
}

function RegisterStatesPrototype() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Specimen label="Empty register">
        <div className={cx(styles.raised, "grid place-items-center gap-2 p-8 text-center")}>
          <ClipboardList
            className="h-8 w-8"
            style={{ color: "hsl(var(--pv-accent))" }}
            aria-hidden
          />
          <p className="font-semibold">Every closeout starts with the scope</p>
          <p className={cx(styles.secondary, "text-[13px]")}>
            Apply a template or add requirements one by one.
          </p>
          <span className={styles.btnPrimary}>Apply a template</span>
        </div>
      </Specimen>
      <Specimen label="No results">
        <div className={cx(styles.quiet, "grid place-items-center gap-2 p-8 text-center")}>
          <p className="font-semibold">No matching requirements</p>
          <p className={cx(styles.secondary, "text-[13px]")}>
            Try a broader search or clear the filters.
          </p>
        </div>
      </Specimen>
      <Specimen label="Loading skeleton">
        <div className={cx(styles.panel, "grid gap-2 p-4")}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 animate-pulse rounded"
              style={{ background: "hsl(var(--pv-quiet))" }}
            />
          ))}
        </div>
      </Specimen>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Prototype 4 — Template library
 * ------------------------------------------------------------------ */

function TemplateLibraryPrototype({ theme = "light" as "light" | "dark" }) {
  const templates = [
    {
      name: "Medical Office Closeout",
      note: "Reusable standard for medical office projects",
      version: "v1 · Published",
      draft: "v2 draft",
      items: 24,
      updated: "Jul 23, 2026"
    },
    {
      name: "Warehouse Closeout",
      note: "Standard for distribution and warehouse turnovers",
      version: "v3 · Published",
      draft: null,
      items: 18,
      updated: "Jul 20, 2026"
    }
  ];
  return (
    <Specimen label={`Template library — ${theme}`} theme={theme}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h4 className={styles.title}>Requirement Templates</h4>
          <p className={styles.secondary}>
            Capture your closeout standard once, then apply it to every project.
          </p>
        </div>
        <span className={styles.btnPrimary}>New template</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((t) => (
          <div key={t.name} className={cx(styles.raised, "p-4")}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold" style={{ color: "hsl(var(--pv-fg))" }}>
                {t.name}
              </p>
              <ClipboardList
                className="h-4 w-4"
                style={{ color: "hsl(var(--pv-accent))" }}
                aria-hidden
              />
            </div>
            <p className={cx(styles.secondary, "mt-0.5 text-[13px]")}>{t.note}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={styles.chipInfo}>{t.version}</span>
              {t.draft ? <span className={styles.chip}>{t.draft}</span> : null}
              <span className={cx(styles.chip, "ml-auto")}>{t.items} requirements</span>
            </div>
            <p className="mt-2 text-[12px]" style={{ color: "hsl(var(--pv-muted))" }}>
              Updated {t.updated}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px]" style={{ color: "hsl(var(--pv-muted))" }}>
        Editable starting point. Verify requirements against your contract documents and project
        obligations.
      </p>
    </Specimen>
  );
}

function TemplateVersionChainPrototype() {
  return (
    <Specimen label="Template detail — version chain (draft vs published)">
      <div className="mb-3">
        <h4 className={styles.title}>Medical Office Closeout</h4>
        <p className={styles.secondary}>
          v2 · Draft — add and order requirements, then publish to lock this version.
        </p>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={cx(styles.chip)}>v1 · Published</span>
        <span className={cx(styles.chipInfo)}>v2 · Draft</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(14rem,1fr)]">
        <div className={cx(styles.panel, "p-4")}>
          <p className={cx(styles.overline, "mb-2")}>Requirements (2)</p>
          <ul className="grid gap-2 text-sm">
            <li className="flex items-center justify-between">
              <span>
                HVAC O&M Manual{" "}
                <span style={{ color: "hsl(var(--pv-muted))" }}>
                  · 23 – HVAC · Usually the subcontractor
                </span>
              </span>
            </li>
            <li className={cx(styles.rowRule, "flex items-center justify-between pt-2")}>
              <span>
                Roofing Warranty <span style={{ color: "hsl(var(--pv-muted))" }}>· Optional</span>
              </span>
            </li>
          </ul>
        </div>
        <div className="grid gap-3">
          <div className={cx(styles.raised, "p-4")}>
            <p className={cx(styles.overline, "mb-1")}>Publish</p>
            <p className={cx(styles.secondary, "mb-2 text-[13px]")}>
              Publishing locks v2. Projects always apply published versions.
            </p>
            <span className={cx(styles.btnPrimary, "w-full")}>Publish template</span>
          </div>
          <div className={cx(styles.quiet, "p-4")}>
            <p className={cx(styles.overline, "mb-1")}>Time saved</p>
            <p className={styles.secondary}>
              Sets up a project's closeout scope in minutes instead of rebuilding it each time.
            </p>
          </div>
        </div>
      </div>
    </Specimen>
  );
}

function TemplateEmptyPrototype() {
  return (
    <Specimen label="Template library — empty" className="max-w-[420px]">
      <div className={cx(styles.raised, "grid place-items-center gap-2 p-8 text-center")}>
        <ClipboardList className="h-8 w-8" style={{ color: "hsl(var(--pv-accent))" }} aria-hidden />
        <p className="font-semibold">Capture your closeout standard once</p>
        <p className={cx(styles.secondary, "max-w-sm text-[13px]")}>
          Templates set up a project's closeout scope in minutes instead of rebuilding it each time.
        </p>
        <span className={styles.btnPrimary}>Create your first template</span>
      </div>
    </Specimen>
  );
}

/* ------------------------------------------------------------------ *
 * Prototype 5 — Public homepage (dev-only)
 * ------------------------------------------------------------------ */

function HomepagePrototype() {
  return (
    <Specimen label="Public homepage — desktop (development prototype)">
      <div className="grid gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Wordmark />
          <div
            className="hidden gap-4 text-sm md:flex"
            style={{ color: "hsl(var(--pv-muted-strong))" }}
          >
            <span>Product</span>
            <span>Requirements</span>
            <span>Templates</span>
            <span>Security</span>
            <span>About</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cx(styles.btnQuiet, "h-9")}>Sign in</span>
            <span className={cx(styles.btnPrimary, "h-9")}>Request access</span>
          </div>
        </div>
        {/* Hero */}
        <div
          className={cx(
            styles.hero,
            "grid items-center gap-6 p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          )}
        >
          <div className="grid gap-4">
            <p className={styles.overline}>Construction closeout software</p>
            <h4
              className="text-[2.25rem] font-semibold leading-[2.5rem]"
              style={{ color: "hsl(var(--pv-fg))" }}
            >
              Every closeout requirement, owner, and due date — organized before handoff.
            </h4>
            <p className={cx(styles.secondary, "max-w-md text-[15px]")}>
              Closeout gives commercial general contractors one place to organize project closeout
              requirements, assign responsibility, and track what still needs attention.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={styles.btnPrimary}>Request access</span>
              <span className={styles.btnQuiet}>See the product</span>
            </div>
          </div>
          {/* Real product framing */}
          <div className={styles.frame}>
            <div className={styles.frameBar}>
              <span className={styles.frameDot} />
              <span className={styles.frameDot} />
              <span className={styles.frameDot} />
            </div>
            <div className="scale-90 p-2">
              <RegisterTable />
            </div>
          </div>
        </div>
        {/* How it works */}
        <div>
          <p className={cx(styles.overline, "mb-3")}>How it works</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                n: "1",
                t: "Set up the project & team",
                d: "Create a project, add companies and contacts, and assign your internal team."
              },
              {
                n: "2",
                t: "Apply a template or add requirements",
                d: "Reuse a versioned requirement template, or add closeout requirements one by one."
              },
              {
                n: "3",
                t: "Assign responsibility & dates",
                d: "Set who's responsible and when it's due, then track what needs attention."
              }
            ].map((s) => (
              <div key={s.n} className={cx(styles.panel, "p-4")}>
                <span
                  className="grid h-7 w-7 place-items-center rounded-full text-sm font-semibold"
                  style={{
                    background: "hsl(var(--pv-accent-tint))",
                    color: "hsl(var(--pv-accent))"
                  }}
                >
                  {s.n}
                </span>
                <p className="mt-2 font-semibold">{s.t}</p>
                <p className={cx(styles.secondary, "mt-1 text-[13px]")}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Value: requirements + templates */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className={cx(styles.raised, "p-5")}>
            <ClipboardList
              className="h-5 w-5"
              style={{ color: "hsl(var(--pv-accent))" }}
              aria-hidden
            />
            <p className="mt-2 font-semibold">A clear closeout requirement register</p>
            <p className={cx(styles.secondary, "mt-1 text-[13px]")}>
              Track every requirement, who's responsible, and when it's due — grouped, filterable,
              and honest about what still needs setup.
            </p>
          </div>
          <div className={cx(styles.raised, "p-5")}>
            <ClipboardList
              className="h-5 w-5"
              style={{ color: "hsl(var(--pv-accent))" }}
              aria-hidden
            />
            <p className="mt-2 font-semibold">Reusable requirement templates</p>
            <p className={cx(styles.secondary, "mt-1 text-[13px]")}>
              Capture your closeout standard once and apply it to every project with versioned,
              editable templates.
            </p>
          </div>
        </div>
        {/* Coordination + security */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className={cx(styles.panel, "p-5")}>
            <UsersRound
              className="h-5 w-5"
              style={{ color: "hsl(var(--pv-accent))" }}
              aria-hidden
            />
            <p className="mt-2 font-semibold">Project & team coordination</p>
            <p className={cx(styles.secondary, "mt-1 text-[13px]")}>
              Reuse companies and contacts across projects, and give your internal team the right
              access to each job.
            </p>
          </div>
          <div className={cx(styles.panel, "p-5")}>
            <Shield className="h-5 w-5" style={{ color: "hsl(var(--pv-accent))" }} aria-hidden />
            <p className="mt-2 font-semibold">Controlled access & audit history</p>
            <p className={cx(styles.secondary, "mt-1 text-[13px]")}>
              Tenant isolation, role-based access, and an immutable audit trail keep every project's
              closeout data private.
            </p>
          </div>
        </div>
        {/* Who it's for + FAQ */}
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className={cx(styles.quiet, "p-5")}>
            <p className={cx(styles.overline, "mb-2")}>Who it's for</p>
            <p className={styles.secondary}>
              Commercial general contractors, project managers, and closeout coordinators organizing
              project handoff.
            </p>
          </div>
          <div className={cx(styles.panel, "p-5")}>
            <p className={cx(styles.overline, "mb-2")}>FAQ</p>
            <div className="grid gap-3 text-[13px]">
              <div>
                <p className="font-medium">What does Closeout do today?</p>
                <p style={{ color: "hsl(var(--pv-muted-strong))" }}>
                  Organizes closeout requirements, responsibility, and due dates across your
                  projects.
                </p>
              </div>
              <div>
                <p className="font-medium">Does it handle document uploads or reviews yet?</p>
                <p style={{ color: "hsl(var(--pv-muted-strong))" }}>
                  Not yet — Closeout organizes the requirement scope first. Document and review
                  workflows come later.
                </p>
              </div>
              <div>
                <p className="font-medium">Is my data isolated?</p>
                <p style={{ color: "hsl(var(--pv-muted-strong))" }}>
                  Yes — every organization's data is isolated, with role-based access and an audit
                  trail.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* CTA */}
        <div className={cx(styles.raised, "flex flex-wrap items-center justify-between gap-4 p-6")}>
          <div>
            <p className="text-lg font-semibold">Request access to Closeout</p>
            <p className={cx(styles.secondary, "text-[13px]")}>
              An early, focused product for commercial construction closeout. We'll be in touch.
            </p>
          </div>
          <div className="flex gap-2">
            <span className={styles.btnQuiet}>Sign in</span>
            <span className={styles.btnPrimary}>Request access</span>
          </div>
        </div>
        {/* Footer */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-[13px]"
          style={{ borderColor: "hsl(var(--pv-hairline))", color: "hsl(var(--pv-muted))" }}
        >
          <Wordmark />
          <div className="flex flex-wrap gap-4">
            <span>Product</span>
            <span>Security</span>
            <span>About</span>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Sign in</span>
          </div>
          <span>closeoutflow.com</span>
        </div>
      </div>
    </Specimen>
  );
}

function HomepageMobilePrototype() {
  return (
    <Specimen label="Public homepage — mobile" className="max-w-[380px]">
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <Wordmark />
          <span className={cx(styles.btnPrimary, "h-9")}>Request access</span>
        </div>
        <div className={cx(styles.hero, "grid gap-3 p-5")}>
          <p className={styles.overline}>Construction closeout software</p>
          <p className="text-xl font-semibold leading-tight">
            Every closeout requirement, owner, and due date — organized before handoff.
          </p>
          <p className={cx(styles.secondary, "text-[13px]")}>
            One place for commercial GCs to organize closeout requirements, responsibility, and
            dates.
          </p>
          <span className={cx(styles.btnPrimary, "w-full")}>Request access</span>
          <span className={cx(styles.btnQuiet, "w-full")}>Sign in</span>
        </div>
        <div className={styles.frame}>
          <div className={styles.frameBar}>
            <span className={styles.frameDot} />
            <span className={styles.frameDot} />
          </div>
          <div className="p-2">
            <div className="scale-[0.8] origin-top">
              <RegisterMobileInline />
            </div>
          </div>
        </div>
      </div>
    </Specimen>
  );
}

function RegisterMobileInline() {
  return (
    <div className="grid gap-2">
      {registerGroups.slice(0, 2).flatMap((g) =>
        g.rows.map((r) => (
          <div key={r.title} className={cx(styles.panel, "p-2")}>
            <p className="truncate text-[13px] font-semibold">{r.title}</p>
            <p className="text-[11px]" style={{ color: "hsl(var(--pv-muted))" }}>
              {g.category}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shared surface comparison + current-vs-proposed
 * ------------------------------------------------------------------ */

function SurfaceLadder() {
  return (
    <div className="grid gap-3">
      <div className={cx(styles.quiet, "p-3")}>
        <span className={styles.overline}>Quiet surface</span>
      </div>
      <div className={cx(styles.panel, "p-3")}>
        <span className={styles.overline}>Panel surface (hairline)</span>
      </div>
      <div className={cx(styles.raised, "p-3")}>
        <span className={styles.overline}>Raised surface (real elevation)</span>
      </div>
      <div className={cx(styles.overlay, "p-3")}>
        <span className={styles.overline}>Overlay (dialog / sheet)</span>
      </div>
    </div>
  );
}

function SharedSurfacesPrototype() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Specimen label="Proposed surface ladder — light" theme="light">
        <SurfaceLadder />
      </Specimen>
      <Specimen
        label="Proposed surface ladder — dark (note real elevation, not identical rectangles)"
        theme="dark"
      >
        <SurfaceLadder />
      </Specimen>
    </div>
  );
}

function CurrentVsProposedDashboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <figure className="m-0 grid gap-2">
        <figcaption className="text-xs font-medium text-muted-foreground">
          Current dashboard (fabricated later-phase content)
        </figcaption>
        <div className="dark">
          <div
            className="grid gap-3 rounded-xl p-4"
            style={{ background: "hsl(224 18% 6.5%)", color: "hsl(210 20% 90%)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold">Dashboard</span>
              <span className="rounded-full border border-blue-500/40 px-2 py-0.5 text-[10px] text-blue-300">
                PREVIEW
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                ["Active projects", "3"],
                ["Due this week", "7"],
                ["Awaiting my review", "2"],
                ["Overdue", "1"]
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="rounded-lg p-3"
                  style={{ boxShadow: "0 0 0 1px hsl(217 12% 30%)" }}
                >
                  <p className="text-2xl font-semibold tabular-nums">{v}</p>
                  <p className="text-[12px] text-slate-400">{l}</p>
                </div>
              ))}
            </div>
            <div
              className="rounded-lg p-3 text-[13px] text-slate-300"
              style={{ boxShadow: "0 0 0 1px hsl(217 12% 30%)" }}
            >
              Needs attention:{" "}
              <span className="text-amber-300">Roofing Warranty · Missing submission</span> ·{" "}
              <span className="text-blue-300">1 review awaiting response</span> · Project health
              18/25 · Medium risk
            </div>
            <p className="text-[12px] text-red-300">
              ⚠ References Phase 8/9/11 systems that do not exist.
            </p>
          </div>
        </div>
      </figure>
      <figure className="m-0 grid gap-2">
        <figcaption className="text-xs font-medium text-muted-foreground">
          Proposed dashboard (Direction A — real Phase 5/6 data only)
        </figcaption>
        <div className="dark">
          <div className={cx(styles.scope, styles.canvas, "rounded-xl p-4")}>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-2xl font-semibold">Dashboard</h4>
                <span className={styles.btnPrimary}>New project</span>
              </div>
              <DashMetrics />
              <DashAttentionList compact />
            </div>
          </div>
        </div>
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Board root
 * ------------------------------------------------------------------ */

export function FullProductVisualReview() {
  return (
    <section aria-label="Full-Product Visual Direction Review" className="grid gap-8">
      <div className="rounded-xl border-l-4 border-l-primary bg-muted/40 p-4">
        <h2 className="text-[length:var(--text-h2)] font-semibold">
          Full-Product Visual Direction Review
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Phase 6E-B1 founder checkpoint. Development-only, production-quality prototypes using
          isolated prototype tokens. Nothing here is applied to production routes, tokens, data, or
          business logic. Toggle the gallery theme (top of page) to review light/dark; several
          specimens also show both themes side by side under equal conditions.
        </p>
        <nav className="mt-3 flex flex-wrap gap-2 text-xs" aria-label="Review sections">
          {[
            ["Surfaces", "pv-surfaces"],
            ["Shell", "pv-shell"],
            ["Dashboard", "pv-dashboard"],
            ["Register", "pv-register"],
            ["Templates", "pv-templates"],
            ["Homepage", "pv-homepage"],
            ["Current vs proposed", "pv-compare"],
            ["Risks & notes", "pv-notes"]
          ].map(([label, id]) => (
            <a key={id} href={`#${id}`} className="rounded-full border px-3 py-1 hover:bg-muted">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <Board
        id="pv-surfaces"
        title="Shared surfaces & token direction"
        intent="The core fix: a real surface ladder with genuine elevation (including a real dark-mode shadow) replacing the uniform border ring that made every panel an identical rectangle."
      >
        <SharedSurfacesPrototype />
      </Board>

      <Board
        id="pv-shell"
        title="Prototype 1 — Application shell"
        intent="Grouped rail (Work vs. Organization), a light-accent active state instead of a filled block, quieter header, honest 'Later' treatment for unbuilt destinations, Templates first-class. Keystone Fold placement only."
      >
        <div className="grid gap-4">
          <ShellPrototype theme="light" />
          <ShellPrototype theme="dark" />
          <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
            <ShellPrototype collapsed />
            <MobileNavPrototype />
          </div>
        </div>
      </Board>

      <Board
        id="pv-dashboard"
        title="Prototype 2 — Dashboard (Direction A)"
        intent="Attention-first operational project list on real Phase 5/6 signals only. No PREVIEW, no review/submission/approval/risk/deadline language, no four-card KPI strip, no fake charts."
      >
        <div className="grid gap-4">
          <DashboardPrototype theme="light" />
          <DashboardPrototype theme="dark" />
          <div className="grid gap-4 md:grid-cols-2 md:items-start">
            <DashboardEmptyPrototype />
            <DashboardMobilePrototype />
          </div>
        </div>
      </Board>

      <Board
        id="pv-register"
        title="Prototype 3 — Requirement register"
        intent="The flagship. Preserves the real Phase 6 IA (category groups, responsibility, owner, due date, source, derived attention, selection, bulk) with refined hierarchy, hairline rules, readable secondary type, and honest status language."
      >
        <div className="grid gap-4">
          <RegisterPrototype theme="light" />
          <RegisterPrototype theme="dark" />
          <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
            <RegisterMobilePrototype />
            <RegisterStatesPrototype />
          </div>
        </div>
      </Board>

      <Board
        id="pv-templates"
        title="Prototype 4 — Template library"
        intent="A first-class reuse surface — version status, draft vs published, requirement counts, last update, and the time-saved value — presented as cards, not a settings table. Starter disclaimer per FD-6."
      >
        <div className="grid gap-4">
          <TemplateLibraryPrototype theme="light" />
          <TemplateLibraryPrototype theme="dark" />
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <TemplateVersionChainPrototype />
            <TemplateEmptyPrototype />
          </div>
        </div>
      </Board>

      <Board
        id="pv-homepage"
        title="Prototype 5 — Public homepage (dev-only)"
        intent="Truthful marketing direction visually connected to the product. Advertises only Phase 4/5/6 capability; Request access primary / Sign in secondary (FD-3/FD-4). No fake proof, pricing, AI, or construction clichés. Not indexable — dev prototype only."
      >
        <div className="grid gap-4">
          <HomepagePrototype />
          <HomepageMobilePrototype />
        </div>
      </Board>

      <Board
        id="pv-compare"
        title="Current vs. proposed — dashboard"
        intent="Equal size and conditions. Left: today's fabricated Phase 8/9/11 dashboard. Right: the truthful Direction A rebuild."
      >
        <CurrentVsProposedDashboard />
      </Board>

      <Board
        id="pv-notes"
        title="Known risks & production implementation notes"
        intent="For founder awareness before 6E-B rollout."
      >
        <div className={cx("grid gap-3 md:grid-cols-2")}>
          <div className="rounded-lg border p-4 text-sm">
            <p className="font-semibold">Known risks</p>
            <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted-foreground">
              <li>
                Prototype tokens are scoped; global token migration (6E-B G1) must re-validate AA
                contrast in both themes.
              </li>
              <li>
                Dashboard uses specimen data; production Direction A reads real access-scoped data
                via existing readers (no new RPC per FD-2).
              </li>
              <li>
                Register/table refinements must preserve the Firefox-safe <code>table-fixed</code> +
                grouped <code>&lt;tbody&gt;</code> pattern.
              </li>
              <li>
                Homepage is a dev prototype; the real public site is a separate 6E-B track and stays
                noindex until approved.
              </li>
              <li>Keystone Fold asset is unchanged; only placement/sizing is refined.</li>
            </ul>
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <p className="font-semibold">Production implementation notes</p>
            <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted-foreground">
              <li>
                Apply via shared tokens/primitives first, then shell, then page groups (6E-B plan
                G1–G20).
              </li>
              <li>Presentation-only: no server-action, RPC, RLS, permission, or audit change.</li>
              <li>
                Dashboard rebuild removes the mock widgets (<code>stat-strip</code>,{" "}
                <code>attention-list</code>, <code>supporting-rail</code>,{" "}
                <code>project-health</code>, <code>activity-list</code>) and the{" "}
                <code>PreviewPill</code>.
              </li>
              <li>
                Deprecate <code>RiskIndicator</code> (Phase 11 risk not implemented).
              </li>
              <li>Public site + SEO metadata land only after founder Checkpoint 3.</li>
            </ul>
          </div>
        </div>
      </Board>
    </section>
  );
}

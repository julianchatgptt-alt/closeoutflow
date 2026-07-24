import Link from "next/link";

import { EmptyState, ErrorState, Skeleton } from "@closeoutflow/ui";

/**
 * Dev-only gallery specimens for the dashboard state system.
 *
 * The labels here previously read "Due this week", "Awaiting my review" and
 * "Overdue" — all later-phase systems that do not exist. They now mirror the
 * real dashboard metric trio so even the gallery specimens stay truthful.
 */
function StateMetricRow({ values }: { values: Array<string | number> }) {
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-lg bg-surface shadow-card sm:grid-cols-3">
      {["Active projects", "Projects needing setup", "Requirements needing attention"].map(
        (label, index) => (
          <div
            key={label}
            className={`px-4 py-3.5 ${index > 0 ? "border-t border-hairline sm:border-l sm:border-t-0" : ""}`}
          >
            <p className="text-overline">{label}</p>
            <p className="text-metric mt-1.5">{values[index]}</p>
          </div>
        )
      )}
    </div>
  );
}

export function DashboardEmptyState() {
  return (
    <div className="grid gap-6" data-capture="dashboard-empty">
      <StateMetricRow values={[0, 0, 0]} />
      <EmptyState
        title="No projects yet"
        description="Projects appear here once they are created."
        action={
          <Link
            href="/projects"
            className="inline-flex min-h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-muted"
          >
            Go to projects
          </Link>
        }
      />
    </div>
  );
}

export function DashboardLoadingState() {
  return (
    <div className="grid gap-6" aria-busy="true" data-capture="dashboard-loading">
      <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-surface shadow-card lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="min-h-[88px] border-l p-5 first:border-l-0">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-surface p-5 shadow-card">
        <Skeleton className="h-3 w-32" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[52px] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardErrorState() {
  return (
    <div className="grid gap-6" data-capture="dashboard-error">
      <StateMetricRow values={["—", "—", "—"]} />
      <ErrorState
        title="Dashboard section unavailable"
        description="This section could not be displayed safely."
        onRetry={() => undefined}
      />
    </div>
  );
}

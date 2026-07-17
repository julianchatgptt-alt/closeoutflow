import Link from "next/link";

import { EmptyState, ErrorState, Skeleton } from "@closeoutflow/ui";

function StateStatStrip({ values }: { values: Array<string | number> }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-surface shadow-card lg:grid-cols-4">
      {["Active projects", "Due this week", "Awaiting my review", "Overdue"].map((label, index) => (
        <div
          key={label}
          className={`min-h-[72px] px-4 py-3 sm:min-h-[88px] sm:px-5 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}
        >
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-[28px] font-semibold tabular-nums sm:text-[32px]">
            {values[index]}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DashboardEmptyState() {
  return (
    <div className="grid gap-6" data-capture="dashboard-empty">
      <StateStatStrip values={[0, 0, 0, "—"]} />
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
      <StateStatStrip values={["—", "—", "—", "—"]} />
      <ErrorState
        title="Dashboard section unavailable"
        description="This section could not be displayed safely."
        onRetry={() => undefined}
      />
    </div>
  );
}

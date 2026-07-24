import { Skeleton } from "@closeoutflow/ui";

/**
 * Mirrors the real project list — title, quiet toolbar, table rows — so the page
 * does not visibly re-flow when data arrives. No spinner.
 */
export default function ProjectsLoading() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading projects">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-lg bg-surface-sunken p-4">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="overflow-hidden rounded-lg bg-surface shadow-card">
        <div className="border-b border-hairline px-5 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-hairline">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-3.5">
              <div className="grid flex-1 gap-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
              <Skeleton className="hidden h-4 w-24 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

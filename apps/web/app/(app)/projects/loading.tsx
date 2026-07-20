import { Skeleton } from "@closeoutflow/ui";

export default function ProjectsLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading projects">
      <p className="text-sm font-medium text-muted-foreground" role="status">
        Loading projects…
      </p>
      <div className="flex items-end justify-between gap-4 rounded-lg border bg-surface p-4 shadow-card">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="rounded-lg border bg-surface p-4 shadow-card">
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="grid gap-3 rounded-lg border bg-surface p-4 shadow-card">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

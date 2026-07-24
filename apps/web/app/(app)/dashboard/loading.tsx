import { Card, Skeleton } from "@closeoutflow/ui";

/**
 * Mirrors the real dashboard layout — metric row, focal attention panel, quiet
 * rail — so the page does not visibly re-flow once data arrives. No spinner.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="grid gap-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <Card
        tier="panel"
        className="grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="px-4 py-3.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2.5 h-8 w-12" />
          </div>
        ))}
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]">
        <Card tier="raised" className="overflow-hidden">
          <div className="px-5 pb-4 pt-5">
            <Skeleton className="h-5 w-64" />
          </div>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-5 border-t border-hairline px-5 py-4">
              <div className="flex-1">
                <Skeleton className="h-4 w-1/2" />
                <div className="mt-2.5 flex gap-1.5">
                  <Skeleton className="h-5 w-40 rounded-full" />
                  <Skeleton className="h-5 w-32 rounded-full" />
                </div>
              </div>
              <div className="hidden w-44 sm:block">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </Card>

        <div className="grid gap-4">
          {Array.from({ length: 2 }, (_, index) => (
            <Card key={index} tier="quiet" className="p-5">
              <Skeleton className="h-3 w-40" />
              <div className="mt-4 grid gap-3">
                {Array.from({ length: 3 }, (_, row) => (
                  <Skeleton key={row} className="h-9 w-full" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

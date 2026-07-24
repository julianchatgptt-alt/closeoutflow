import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AttentionChip, Card, Meter } from "@closeoutflow/ui";

import { describeReason, type ProjectAttention } from "../../lib/dashboard-data";
import { StatusBadge } from "../projects/phase-5-ui";

/**
 * The dashboard's one focal element: the caller's active projects ranked by how
 * much closeout setup is still outstanding, with the real reasons and a direct
 * route into the work. This is the only `raised` surface on the page.
 */
export function AttentionPanel({ items }: { items: ProjectAttention[] }) {
  return (
    <Card tier="raised" className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pb-4 pt-5">
        <h2 className="text-section">Projects needing setup attention</h2>
        <p className="text-[13px] text-muted-foreground">
          {items.length} {items.length === 1 ? "project" : "projects"}
        </p>
      </div>
      <ul className="list-none p-0">
        {items.map((item) => {
          const empty = item.reasons.includes("no_requirements");
          // Send people where the next action actually is: the empty register
          // for projects with nothing configured, otherwise the attention view.
          const href = empty
            ? `/projects/${item.project.id}/requirements`
            : `/projects/${item.project.id}/requirements?attention=1`;
          return (
            <li key={item.project.id} className="border-t border-hairline">
              <Link
                href={href}
                className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span
                      title={item.project.name}
                      className="truncate font-semibold group-hover:text-primary"
                    >
                      {item.project.name}
                    </span>
                    <StatusBadge status={item.project.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.reasons.map((reason) => (
                      <AttentionChip key={reason}>
                        {describeReason(reason, item.summary)}
                      </AttentionChip>
                    ))}
                  </div>
                </div>

                {empty ? (
                  <p className="shrink-0 text-[13px] text-muted-foreground sm:w-44 sm:text-right">
                    Nothing configured yet
                  </p>
                ) : (
                  <div className="shrink-0 sm:w-44">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="text-muted-foreground">Set up</span>
                      <span className="tabular-nums">
                        {item.configured} of {item.total}
                      </span>
                    </div>
                    <Meter
                      value={item.configured}
                      max={item.total}
                      label={`${item.project.name}: ${item.configured} of ${item.total} requirements fully set up`}
                    />
                  </div>
                )}

                <ArrowRight
                  aria-hidden="true"
                  className="hidden h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

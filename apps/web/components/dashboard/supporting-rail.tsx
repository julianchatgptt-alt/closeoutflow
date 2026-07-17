import { Check } from "lucide-react";
import Link from "next/link";

import { reviews } from "../../src/mock/phase-3";
import { StatusBadge } from "../status/status-badge";

const deadlines = [
  { date: "Jul 30", item: "Fire Alarm Report", complete: true },
  { date: "Aug 5", item: "Roofing Warranty" },
  { date: "Aug 10", item: "As-built Drawings" }
] as const;

export function SupportingRail() {
  return (
    <aside className="grid rounded-lg bg-surface shadow-card md:grid-cols-2 xl:block">
      <section className="p-5 md:border-r xl:border-b xl:border-r-0">
        <h2 className="text-overline mb-2">
          Awaiting my review <span className="tabular-nums">(2)</span>
        </h2>
        <div className="divide-y">
          {reviews.slice(0, 2).map((review) => (
            <Link
              key={review.id}
              href="/projects/riverside-medical-office/reviews"
              className="flex min-h-12 items-center justify-between gap-3 py-2 transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{review.item}</span>
                <span className="block truncate text-xs text-muted-foreground">{review.stage}</span>
              </span>
              <StatusBadge category="review" status={review.status} />
            </Link>
          ))}
        </div>
      </section>
      <section className="p-5">
        <h2 className="text-overline mb-2">Upcoming deadlines</h2>
        <div className="divide-y">
          {deadlines.map((deadline) => (
            <div
              key={deadline.item}
              className="flex min-h-10 items-center gap-3 py-1.5 text-[13px]"
            >
              <time className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                {deadline.date}
              </time>
              <span className="min-w-0 flex-1 truncate">{deadline.item}</span>
              {"complete" in deadline ? (
                <Check aria-label="Complete" className="h-3.5 w-3.5 text-success" />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

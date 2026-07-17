import { AlertTriangle, ChevronRight, CircleDot } from "lucide-react";
import Link from "next/link";

import { Badge } from "@closeoutflow/ui";

const attention = [
  {
    title: "Riverside Medical Office",
    meta: "2 overdue requirements",
    date: "Jul 12",
    badge: "Medium",
    tone: "warning" as const,
    href: "/projects/riverside-medical-office/requirements",
    severe: true
  },
  {
    title: "Roofing Warranty",
    meta: "Missing submission",
    date: "Aug 5",
    badge: "Missing",
    tone: "warning" as const,
    href: "/projects/riverside-medical-office/warranties",
    severe: true
  },
  {
    title: "Eastgate Retail Buildout",
    meta: "1 review awaiting response",
    date: "1 waiting",
    badge: "Review",
    tone: "info" as const,
    href: "/projects/eastgate-retail-buildout"
  }
];

export function AttentionList() {
  return (
    <section className="overflow-hidden rounded-lg bg-surface shadow-card">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2 className="text-overline">
          Needs attention <span className="tabular-nums">(3)</span>
        </h2>
      </div>
      <div className="divide-y px-2 sm:px-3">
        {attention.map((item) => {
          const Icon = item.severe ? AlertTriangle : CircleDot;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="grid min-h-[52px] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50 sm:px-3"
            >
              <Icon
                aria-hidden="true"
                className={`h-4 w-4 ${item.severe ? "text-warning" : "text-info"}`}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block truncate text-[13px] text-muted-foreground">
                  {item.meta}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                  {item.date}
                </span>
                <Badge tone={item.tone}>{item.badge}</Badge>
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
              </span>
            </Link>
          );
        })}
      </div>
      <div className="border-t px-5 py-2.5 text-right">
        <Link href="/projects" className="text-[13px] font-medium text-primary hover:underline">
          View all <span aria-hidden="true">›</span>
        </Link>
      </div>
    </section>
  );
}

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Active projects", value: 3, href: "/projects" },
  {
    label: "Due this week",
    value: 7,
    href: "/projects/riverside-medical-office/requirements"
  },
  {
    label: "Awaiting my review",
    value: 2,
    href: "/projects/riverside-medical-office/reviews"
  },
  {
    label: "Overdue",
    value: 1,
    href: "/projects/riverside-medical-office/requirements",
    warning: true
  }
] as const;

export function StatStrip() {
  return (
    <section
      aria-label="Portfolio summary"
      className="grid grid-cols-2 overflow-hidden rounded-lg bg-surface shadow-card lg:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <Link
          key={stat.label}
          href={stat.href}
          className={`flex min-h-[72px] flex-col justify-center px-4 py-3 transition-colors hover:bg-muted/60 sm:min-h-[88px] sm:px-5 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} ${index > 0 ? "lg:border-l" : ""}`}
        >
          <span className="text-[13px] text-muted-foreground">{stat.label}</span>
          <span
            className={`mt-0.5 inline-flex items-center gap-1 text-[28px] font-semibold leading-9 tabular-nums sm:text-[32px] sm:leading-[38px] ${"warning" in stat ? "text-warning" : ""}`}
          >
            {stat.value}
            {"warning" in stat ? (
              <AlertTriangle aria-label="Attention required" className="h-4 w-4" />
            ) : null}
          </span>
        </Link>
      ))}
    </section>
  );
}

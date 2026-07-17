import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { projects } from "../../src/mock/phase-3";
import { RiskIndicator, type RiskLevel } from "../status/risk-indicator";
import { StatusBadge } from "../status/status-badge";

const health = [
  { complete: 18, total: 25 },
  { complete: 9, total: 25 },
  { complete: 23, total: 25 }
] as const;

export function ProjectHealth() {
  return (
    <section className="rounded-lg bg-surface p-5 shadow-card">
      <h2 className="text-overline mb-2">Project health</h2>
      <div className="divide-y">
        {projects.map((project, index) => {
          const progress = health[index]!;
          const value = Math.round((progress.complete / progress.total) * 100);
          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(12rem,1.3fr)_auto_minmax(8rem,0.8fr)_auto_auto_auto] sm:px-2"
            >
              <span className="min-w-0 truncate font-medium">{project.name}</span>
              <span className="justify-self-end">
                <StatusBadge category="project" status={project.status} />
              </span>
              <span
                className="hidden h-1.5 overflow-hidden rounded-full bg-muted sm:block"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${value}%` }}
                />
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {progress.complete}/{progress.total}
              </span>
              <span className="justify-self-end">
                <RiskIndicator level={project.risk as RiskLevel} />
              </span>
              <ChevronRight
                aria-hidden="true"
                className="hidden h-4 w-4 text-muted-foreground sm:block"
              />
            </Link>
          );
        })}
      </div>
      <p className="mt-2 border-t pt-3 text-xs text-muted-foreground">Trends arrive in Phase 11.</p>
    </section>
  );
}

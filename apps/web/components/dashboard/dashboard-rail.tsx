import Link from "next/link";

import { Card } from "@closeoutflow/ui";

import type { DashboardData } from "../../lib/dashboard-data";
import { formatRelativeTimestamp } from "../../lib/date-format";
import { StatusBadge } from "../projects/phase-5-ui";

/**
 * Quiet supporting context beside the focal attention panel. Everything here is
 * real: project `updated_at` from `search_projects` and template rows the
 * organization has actually configured.
 */
export function DashboardRail({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4">
      <Card tier="quiet" className="p-5">
        <h2 className="text-overline">Recently updated projects</h2>
        {data.recentProjects.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">No projects yet.</p>
        ) : (
          <ul className="mt-3 grid list-none gap-0.5 p-0">
            {data.recentProjects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span title={project.name} className="block truncate text-[13.5px] font-medium">
                      {project.name}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {formatRelativeTimestamp(project.updated_at)}
                    </span>
                  </span>
                  <StatusBadge status={project.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card tier="quiet" className="p-5">
        <h2 className="text-overline">Recently configured templates</h2>
        {data.templates.length === 0 ? (
          <>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Capture your closeout standard once and apply it to every project.
            </p>
            <Link
              href="/templates"
              className="mt-3 inline-flex text-[13.5px] font-medium text-primary hover:underline"
            >
              Set up a template
            </Link>
          </>
        ) : (
          <>
            <ul className="mt-3 grid list-none gap-0.5 p-0">
              {data.templates.map((template) => (
                <li key={template.id}>
                  <Link
                    href={`/templates/${template.id}`}
                    className="-mx-2 block rounded-md px-2 py-2 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      title={template.name}
                      className="block truncate text-[13.5px] font-medium"
                    >
                      {template.name}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      Version {template.version} · updated{" "}
                      {formatRelativeTimestamp(template.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/templates"
              className="mt-3 inline-flex text-[13.5px] font-medium text-primary hover:underline"
            >
              All templates
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

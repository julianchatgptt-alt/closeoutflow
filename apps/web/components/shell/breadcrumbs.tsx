"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBreadcrumbContext } from "./breadcrumb-context";

const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const labelsBySegment: Record<string, string> = {
  projects: "Projects",
  companies: "Companies",
  contacts: "Contacts",
  team: "Team",
  settings: "Settings",
  activity: "Activity",
  documents: "Documents",
  drawings: "Drawings",
  equipment: "Equipment",
  inspections: "Inspections",
  "lien-waivers": "Lien Waivers",
  package: "Package",
  requirements: "Requirements",
  reviews: "Reviews",
  training: "Training",
  warranties: "Warranties"
};

export type BreadcrumbItem = { href: string; label: string; current: boolean };

export function buildBreadcrumbItems(
  pathname: string,
  project: { id: string; name: string } | null,
  template: { id: string; name: string } | null = null
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  return segments.map((segment, index) => {
    const previous = index > 0 ? segments[index - 1] : undefined;
    const isIdentifier = UUID_SEGMENT.test(segment);
    const label = isIdentifier
      ? previous === "projects"
        ? project?.id === segment
          ? project.name
          : "Project"
        : previous === "templates"
          ? template?.id === segment
            ? template.name
            : "Template"
          : previous === "requirements"
            ? "Requirement"
            : "Details"
      : (labelsBySegment[segment] ??
        segment
          .split("-")
          .filter(Boolean)
          .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
          .join(" "));
    return {
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label,
      current: index === segments.length - 1
    };
  });
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { project, template } = useBreadcrumbContext();
  const items = buildBreadcrumbItems(pathname, project, template);
  return (
    <nav aria-label="Breadcrumbs" className="min-w-0 flex-1">
      <ol className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {items.map(({ href, label, current }, index) => {
          return (
            <li
              key={href}
              className={
                index < items.length - 2 ? "hidden md:flex" : "flex min-w-0 items-center gap-2"
              }
            >
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {current ? (
                <span aria-current="page" className="truncate text-foreground" title={label}>
                  {label}
                </span>
              ) : (
                <Link href={href} className="truncate hover:text-foreground" title={label}>
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

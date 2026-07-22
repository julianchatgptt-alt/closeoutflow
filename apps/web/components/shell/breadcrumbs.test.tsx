import { describe, expect, it } from "vitest";

import { buildBreadcrumbItems } from "./breadcrumbs";

const projectId = "50000000-0000-4000-8000-000000000002";

describe("project breadcrumbs", () => {
  it("uses the authorized project name and never UUID fragments", () => {
    const items = buildBreadcrumbItems(`/projects/${projectId}/activity`, {
      id: projectId,
      name: "Riverside Medical Office"
    });

    expect(items.map((item) => item.label)).toEqual([
      "Projects",
      "Riverside Medical Office",
      "Activity"
    ]);
    expect(items.some((item) => item.label.includes("50000000"))).toBe(false);
  });

  it("uses a non-sensitive fallback while the authorized name registers", () => {
    expect(buildBreadcrumbItems(`/projects/${projectId}`, null).map((item) => item.label)).toEqual([
      "Projects",
      "Project"
    ]);
  });

  it("preserves long project names as one breadcrumb label", () => {
    const name = "West Campus Central Utility Plant Modernization and Commissioning";
    const items = buildBreadcrumbItems(`/projects/${projectId}/team`, { id: projectId, name });
    expect(items[1]?.label).toBe(name);
  });
});

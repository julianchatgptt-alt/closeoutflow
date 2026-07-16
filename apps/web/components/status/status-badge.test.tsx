import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { STATUS_PRESENTATION, StatusBadge, statusValues } from "./status-badge";
import { RiskIndicator } from "./risk-indicator";

describe("StatusBadge", () => {
  it("has presentation metadata for every authoritative lifecycle label", () => {
    for (const [category, statuses] of Object.entries(statusValues)) {
      for (const status of statuses)
        expect(STATUS_PRESENTATION[category as keyof typeof statusValues][status]).toBeDefined();
    }
  });

  it("renders icon and text instead of color alone", () => {
    const { container } = render(<StatusBadge category="project" status="Owner Review" />);
    expect(screen.getByText("Owner Review")).toBeVisible();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("fails safely for an unexpected runtime status", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const RuntimeStatusBadge = StatusBadge as (props: {
      category: "project";
      status: string;
    }) => React.ReactNode;
    render(<RuntimeStatusBadge category="project" status="Unexpected runtime value" />);

    expect(screen.getByText("Unknown")).toBeVisible();
    expect(warning).toHaveBeenCalledWith("Unknown project status: Unexpected runtime value");
    warning.mockRestore();
  });

  it.each(["Low", "Medium", "High", "Insufficient data"] as const)("renders %s risk", (level) => {
    render(<RiskIndicator level={level} />);
    expect(screen.getByText(level)).toBeVisible();
  });

  it("exposes risk drivers as visible associated text", () => {
    render(<RiskIndicator level="High" drivers="Two overdue sample requirements" />);
    const badge = screen.getByText("High").closest("span");
    const driver = screen.getByText("Two overdue sample requirements");

    expect(driver).toBeVisible();
    expect(badge).toHaveAttribute("aria-describedby", driver.id);
  });
});

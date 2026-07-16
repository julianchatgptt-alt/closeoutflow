import { render, screen } from "@testing-library/react";

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

  it.each(["Low", "Medium", "High", "Insufficient data"] as const)("renders %s risk", (level) => {
    render(<RiskIndicator level={level} />);
    expect(screen.getByText(level)).toBeVisible();
  });
});

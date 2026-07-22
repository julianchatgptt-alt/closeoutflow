import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloseoutLogo, CloseoutMark } from "./closeout-logo";

describe("Closeout final logo", () => {
  it("exposes one accessible public brand name for the lockup", () => {
    const { container } = render(<CloseoutLogo />);

    expect(screen.getByRole("img", { name: "Closeout" })).toBeInTheDocument();
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.queryByText("CloseoutFlow")).not.toBeInTheDocument();
  });

  it("uses a filled faceted mark and a simplified compact cut", () => {
    const detailed = render(<CloseoutMark title="Detailed Closeout symbol" />);
    expect(detailed.container.querySelectorAll("path")).toHaveLength(4);
    expect(detailed.container.querySelector("path")).toHaveAttribute("fill", "currentColor");
    detailed.unmount();

    const compact = render(<CloseoutMark compact title="Compact Closeout symbol" />);
    expect(compact.container.querySelectorAll("path")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Compact Closeout symbol" })).toHaveAttribute(
      "viewBox",
      "0 0 48 48"
    );
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KeystoneRefinementReview, keystoneRefinements } from "./keystone-refinement-review";

describe("KeystoneRefinementReview", () => {
  it("presents three neutral review-only refinements with every required application", () => {
    render(<KeystoneRefinementReview />);

    expect(keystoneRefinements).toHaveLength(3);
    expect(screen.getByText(/do not replace the currently applied mark/i)).toBeInTheDocument();

    for (const refinement of keystoneRefinements) {
      expect(screen.getByRole("heading", { name: refinement.name })).toBeInTheDocument();
    }

    for (const label of [
      "Symbol only",
      "Horizontal wordmark",
      "Expanded sidebar",
      "Collapsed sidebar",
      "Authentication header",
      "16×16",
      "32×32",
      "48×48",
      "Dark mode",
      "Monochrome",
      "Inverse"
    ]) {
      expect(screen.getAllByText(label)).toHaveLength(3);
    }
  });
});

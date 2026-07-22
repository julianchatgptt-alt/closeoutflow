import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LogoFounderReview, LogoSymbol, logoConcepts } from "./logo-founder-review";

describe("Closeout logo founder review", () => {
  it("presents all three concepts under the same review structure without selecting one", () => {
    render(<LogoFounderReview />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Closeout Logo Founder Review" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("logo-neutral-comparison").children).toHaveLength(3);

    for (const concept of logoConcepts) {
      expect(screen.getAllByRole("heading", { name: concept.label })).toHaveLength(2);
      expect(
        screen.getByRole("img", { name: `Closeout ${concept.label} concept symbol` })
      ).toBeInTheDocument();
      expect(screen.getByTestId(`${concept.id}-identity-variants`)).toBeInTheDocument();
      expect(screen.getByTestId(`${concept.id}-applications`)).toHaveTextContent("Favicon 16×16");
      expect(screen.getByTestId(`${concept.id}-applications`)).toHaveTextContent(
        "Collapsed sidebar"
      );
      expect(screen.getByTestId(`${concept.id}-auth-previews`)).toHaveTextContent(
        "Invitation acceptance header"
      );
      expect(screen.getByTestId(`${concept.id}-auth-previews`)).toHaveTextContent(
        "Onboarding header"
      );
    }

    expect(screen.queryByRole("button", { name: /select/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/CloseoutFlow/)).not.toBeInTheDocument();
  });

  it("gives meaningful symbols one accessible name and hides decorative repetitions", () => {
    const { container, rerender } = render(
      <LogoSymbol accessibleName="Closeout Sealed Packet concept symbol" concept="sealed-packet" />
    );
    const meaningful = container.querySelector("svg");
    expect(meaningful).toHaveAttribute("role", "img");
    expect(meaningful).toHaveAttribute("aria-label", "Closeout Sealed Packet concept symbol");
    expect(meaningful).toHaveAttribute("focusable", "false");

    rerender(<LogoSymbol concept="sealed-packet" />);
    const decorative = container.querySelector("svg");
    expect(decorative).toHaveAttribute("aria-hidden", "true");
    expect(decorative).not.toHaveAttribute("role");
  });
});

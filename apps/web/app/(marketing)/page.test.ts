import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoundationPage } from "./page";

describe("foundation landing page", () => {
  it("states that the foundation is operational without product navigation", () => {
    render(FoundationPage());

    expect(
      screen.getByRole("heading", { level: 1, name: "CloseoutFlow is operational." })
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

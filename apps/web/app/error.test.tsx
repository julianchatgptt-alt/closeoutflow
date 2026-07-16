import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import ErrorPage from "./error";

describe("application error surface", () => {
  it("uses Closeout branding without exposing raw error details", () => {
    const reset = vi.fn();

    render(
      <ErrorPage
        error={Object.assign(new Error("private failure"), { digest: "abc" })}
        reset={reset}
      />
    );

    expect(screen.getByText("Closeout", { exact: true })).toBeVisible();
    expect(screen.queryByText("private failure")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});

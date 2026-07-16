import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { SampleValidationForm } from "./sample-form";

describe("SampleValidationForm", () => {
  it("associates errors and focuses the summary after submit", async () => {
    render(<SampleValidationForm />);
    fireEvent.click(screen.getByRole("button", { name: "Validate sample" }));
    const summary = (await screen.findByText("Review the highlighted fields.")).parentElement!;
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByLabelText(/Contact name/)).toHaveAttribute("aria-invalid", "true");
  });

  it("confirms before client-side navigation from a dirty form", () => {
    const onNavigate = vi.fn();
    render(
      <div>
        <SampleValidationForm onNavigate={onNavigate} />
        <a href="/projects">Projects</a>
      </div>
    );

    fireEvent.change(screen.getByLabelText(/Contact name/), { target: { value: "Jordan" } });
    fireEvent.click(screen.getByRole("link", { name: "Projects" }));
    expect(screen.getByRole("alertdialog", { name: "Discard changes?" })).toBeVisible();
    expect(onNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Discard and leave" }));
    expect(onNavigate).toHaveBeenCalledWith("/projects");
  });
});

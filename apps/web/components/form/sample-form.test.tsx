import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SampleValidationForm } from "./sample-form";

describe("SampleValidationForm", () => {
  it("associates errors and focuses the summary after submit", async () => {
    render(<SampleValidationForm />);
    fireEvent.click(screen.getByRole("button", { name: "Validate sample" }));
    const summary = (await screen.findByText("Review the highlighted fields.")).parentElement!;
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByLabelText(/Contact name/)).toHaveAttribute("aria-invalid", "true");
  });
});

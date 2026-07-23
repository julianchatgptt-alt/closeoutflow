import "@testing-library/jest-dom/vitest";

import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { NotApplicableAction } from "./not-applicable-action";

describe("NotApplicableAction", () => {
  it("shows an accessible inline error before opening confirmation for a short reason", async () => {
    const { container } = render(
      <NotApplicableAction
        action={vi.fn()}
        fields={{
          projectId: crypto.randomUUID(),
          requirementId: crypto.randomUUID(),
          updatedAt: "2026-07-23T12:00:00.000000+00:00"
        }}
      />
    );

    const reason = screen.getByLabelText(/Reason/);
    fireEvent.change(reason, { target: { value: "no" } });
    fireEvent.click(screen.getByRole("button", { name: "Mark not applicable" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a reason between 3 and 200 characters."
    );
    expect(reason).toHaveFocus();
    expect(reason).toHaveAttribute("aria-invalid", "true");
    expect((await axe(container)).violations).toEqual([]);
  });

  it("opens confirmation only after a valid reason and submits on approval", () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, "requestSubmit")
      .mockImplementation(() => undefined);
    render(
      <NotApplicableAction
        action={vi.fn()}
        fields={{
          projectId: crypto.randomUUID(),
          requirementId: crypto.randomUUID(),
          updatedAt: "2026-07-23T12:00:00.000000+00:00"
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: "Owner confirmed this scope never applied." }
    });
    fireEvent.click(screen.getByRole("button", { name: "Mark not applicable" }));
    const dialog = screen.getByRole("alertdialog", { name: "Mark not applicable?" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark not applicable" }));

    expect(requestSubmit).toHaveBeenCalledOnce();
    requestSubmit.mockRestore();
  });

  it("keeps reasons over the database limit out of the confirmation flow", () => {
    render(
      <NotApplicableAction
        action={vi.fn()}
        fields={{
          projectId: crypto.randomUUID(),
          requirementId: crypto.randomUUID(),
          updatedAt: "2026-07-23T12:00:00.000000+00:00"
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: "x".repeat(201) }
    });
    fireEvent.click(screen.getByRole("button", { name: "Mark not applicable" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Reason must be 200 characters or fewer.");
  });
});

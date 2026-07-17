import { fireEvent, render, screen } from "@testing-library/react";

import { DataTable } from "./data-table";

const rows = [
  { id: "2", name: "Zulu" },
  { id: "1", name: "Alpha" }
];

describe("DataTable", () => {
  it("searches, sorts, selects, and exposes accessible headers", () => {
    render(
      <DataTable
        caption="Samples"
        data={rows}
        columns={[{ key: "name", header: "Name" }]}
        emptyTitle="Empty"
        emptyDescription="Nothing here"
      />
    );
    const sort = screen.getByRole("button", { name: /Name/ });
    fireEvent.click(sort);
    expect(sort.closest("th")).toHaveAttribute("aria-sort", "ascending");
    fireEvent.change(screen.getByRole("textbox", { name: "Search Samples" }), {
      target: { value: "Alpha" }
    });
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.queryByText("Zulu")).not.toBeInTheDocument();
    expect(screen.getByText("Select all Samples")).toHaveClass("sr-only");
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Select Alpha" })[0]!);
    expect(screen.getByText("1 selected")).toBeVisible();
  });
});

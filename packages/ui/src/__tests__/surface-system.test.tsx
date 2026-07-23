import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import {
  AttentionChip,
  Card,
  CardContent,
  CardTitle,
  EmptyState,
  ErrorState,
  Meter,
  Metric,
  PermissionDenied,
  RecordCard
} from "../index";

describe("surface ladder", () => {
  it("renders quiet, panel, and raised tiers with distinct treatments", () => {
    const { container } = render(
      <div>
        <Card tier="quiet" data-testid="quiet" />
        <Card tier="panel" data-testid="panel" />
        <Card tier="raised" data-testid="raised" />
      </div>
    );

    // Quiet groups by tone alone — no boundary, no elevation.
    const quiet = screen.getByTestId("quiet");
    expect(quiet).toHaveClass("bg-surface-sunken");
    expect(quiet.className).not.toMatch(/shadow-/);

    // Panels carry a hairline boundary but never a drop shadow.
    expect(screen.getByTestId("panel")).toHaveClass("shadow-card");

    // Only the focal surface is elevated, and it does not also get a ring.
    const raised = screen.getByTestId("raised");
    expect(raised).toHaveClass("shadow-raised");
    expect(raised).not.toHaveClass("shadow-card");

    expect(container.querySelectorAll("div").length).toBe(4);
  });

  it("defaults to the panel tier so existing usage is unchanged", () => {
    render(<Card data-testid="default" />);
    expect(screen.getByTestId("default")).toHaveClass("bg-surface", "shadow-card");
  });

  it("keeps cards composable and accessible", async () => {
    const { container } = render(
      <Card tier="raised">
        <CardTitle>Projects needing setup attention</CardTitle>
        <CardContent>Two projects have requirements without a responsible company.</CardContent>
      </Card>
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("Metric", () => {
  it("shows a real count with its label and optional detail", () => {
    render(<Metric label="Active projects" value={7} detail="Across this organization" />);
    expect(screen.getByText("Active projects")).toBeVisible();
    expect(screen.getByText("7")).toBeVisible();
    expect(screen.getByText("Across this organization")).toBeVisible();
  });

  it("routes into the work it describes when given an href", () => {
    render(<Metric label="Requirements needing attention" value={12} href="/projects" />);
    expect(screen.getByRole("link", { name: /Requirements needing attention/ })).toHaveAttribute(
      "href",
      "/projects"
    );
  });

  it("marks attention with tone rather than an alarm colour", () => {
    render(<Metric label="Needs attention" value={3} attention />);
    expect(screen.getByText("3")).toHaveClass("text-warning-foreground");
  });
});

describe("RecordCard", () => {
  it("renders the single mobile record shape tables degrade to", async () => {
    const { container } = render(
      <RecordCard
        title="Riverside Medical Center — Phase 2 Fit-Out"
        href="/projects/abc"
        source="Project CF-1042"
        status={<AttentionChip>Unassigned</AttentionChip>}
        fields={[
          { label: "Responsible", value: "Atlas Electric" },
          { label: "Due", value: "12 August 2026" }
        ]}
      />
    );

    expect(
      screen.getByRole("link", { name: "Riverside Medical Center — Phase 2 Fit-Out" })
    ).toHaveAttribute("href", "/projects/abc");
    expect(screen.getByText("Atlas Electric")).toBeVisible();
    expect((await axe(container)).violations).toEqual([]);
  });

  it("truncates long titles with an accessible full value", () => {
    const title = "A ".repeat(60).trim();
    render(<RecordCard title={title} />);
    expect(screen.getByTitle(title)).toHaveClass("truncate");
  });
});

describe("Meter", () => {
  it("reports real progress to assistive technology", () => {
    render(<Meter value={3} max={8} label="Setup progress" />);
    const meter = screen.getByRole("progressbar", { name: "Setup progress" });
    expect(meter).toHaveAttribute("aria-valuenow", "3");
    expect(meter).toHaveAttribute("aria-valuemax", "8");
  });

  it("does not divide by zero when nothing is configured yet", () => {
    render(<Meter value={0} max={0} label="Setup progress" />);
    expect(screen.getByRole("progressbar", { name: "Setup progress" })).toBeVisible();
  });
});

describe("state system", () => {
  it("gives every state an explanation and keeps error states announced", async () => {
    const { container } = render(
      <div>
        <EmptyState
          title="No projects yet"
          description="Create your first project and we'll help you assemble the closeout scope."
        />
        <ErrorState description="We couldn't load this register." />
        <PermissionDenied />
      </div>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load this register.");
    expect(screen.getByText("You don't have permission to view this")).toBeVisible();
    expect((await axe(container)).violations).toEqual([]);
  });
});

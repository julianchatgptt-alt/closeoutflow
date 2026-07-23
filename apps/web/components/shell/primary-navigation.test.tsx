import "@testing-library/jest-dom/vitest";

import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { commandRoutes, globalNavigation, navigationGroups } from "./navigation";
import { PrimaryNavigation } from "./primary-navigation";

const pathname = vi.hoisted(() => ({ current: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("grouped primary navigation", () => {
  it("separates daily Work destinations from quieter Organization utilities", () => {
    expect(navigationGroups.map((group) => group.label)).toEqual(["Work", "Organization"]);

    const work = navigationGroups[0]!.items.map((item) => item.label);
    // Templates are a core Phase 6 capability, not a setting.
    expect(work).toEqual(["Dashboard", "Projects", "Companies", "Contacts", "Templates"]);

    const organization = navigationGroups[1]!.items.map((item) => item.label);
    expect(organization).toEqual(["Team", "Settings", "Reports"]);
  });

  it("renders each group as a labelled list", () => {
    render(<PrimaryNavigation />);
    expect(
      within(screen.getByRole("list", { name: "Work" })).getAllByRole("listitem")
    ).toHaveLength(5);
    expect(
      within(screen.getByRole("list", { name: "Organization" })).getAllByRole("listitem")
    ).toHaveLength(3);
  });

  it("marks the active destination with a light accent rather than a filled block", () => {
    pathname.current = "/projects";
    render(<PrimaryNavigation />);
    const active = screen.getByRole("link", { name: "Projects" });
    expect(active).toHaveAttribute("aria-current", "page");
    // Tinted background + accent bar + accent text, never a solid primary fill.
    expect(active.className).toContain("bg-[hsl(var(--nav-item-active-bg))]");
    expect(active.className).toContain("before:bg-[hsl(var(--nav-item-active-accent))]");
    expect(active.className).not.toContain("bg-primary");
    pathname.current = "/dashboard";
  });

  it("keeps a section active while inside its sub-routes", () => {
    pathname.current = "/projects/abc/requirements";
    render(<PrimaryNavigation />);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    pathname.current = "/dashboard";
  });

  it("marks unbuilt destinations honestly and never as links", () => {
    render(<PrimaryNavigation />);
    expect(screen.queryByRole("link", { name: "Reports" })).toBeNull();
    const reports = screen.getByText("Reports").closest("[aria-disabled='true']");
    expect(reports).not.toBeNull();
    expect(reports).toHaveTextContent("Later");
    expect(reports).toHaveTextContent("not available yet");
  });

  it("offers only reachable destinations to the command palette", () => {
    expect(commandRoutes.map((route) => route.label)).not.toContain("Reports");
    expect(commandRoutes).toHaveLength(globalNavigation.length - 1);
  });

  it("has no accessibility violations in either rail state", async () => {
    const expanded = render(<PrimaryNavigation />);
    expect((await axe(expanded.container)).violations).toEqual([]);
    expanded.unmount();

    const collapsed = render(<PrimaryNavigation collapsed />);
    expect((await axe(collapsed.container)).violations).toEqual([]);
  });

  it("keeps every item reachable by an accessible name when the rail is collapsed", () => {
    render(<PrimaryNavigation collapsed />);
    for (const item of globalNavigation.filter((entry) => !entry.disabled)) {
      expect(screen.getByRole("link", { name: item.label })).toBeVisible();
    }
  });
});

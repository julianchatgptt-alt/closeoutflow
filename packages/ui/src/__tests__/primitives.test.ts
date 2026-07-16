import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";

import { Button, Card, CardContent, CardTitle, Input, Skeleton } from "../index";

describe("UI primitives", () => {
  it("render accessibly", async () => {
    const { container } = render(
      createElement(
        Card,
        null,
        createElement(CardTitle, null, "Foundation"),
        createElement(
          CardContent,
          null,
          createElement("label", { htmlFor: "name" }, "Name"),
          createElement(Input, { id: "name" }),
          createElement(Button, null, "Save"),
          createElement(Skeleton, { className: "h-4 w-20" })
        )
      )
    );

    expect((await axe(container)).violations).toEqual([]);
  });

  it("defines explicit dark-mode design tokens", async () => {
    const tokens = await readFile("packages/ui/src/tokens.css", "utf8");

    expect(tokens).toContain(".dark");
    expect(tokens).toContain("--background");
    expect(tokens).toContain("color-scheme: dark");
  });
});

import { isDesignGalleryEnabled } from "./access";

describe("design gallery runtime gate", () => {
  it.each([
    ["local", true],
    ["test", true],
    ["preview", false],
    ["staging", false],
    ["production", false]
  ] as const)("returns %s access as %s", (environment, expected) => {
    expect(isDesignGalleryEnabled(environment)).toBe(expected);
  });
});

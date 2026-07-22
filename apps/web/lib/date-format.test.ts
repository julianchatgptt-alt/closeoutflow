import { describe, expect, it } from "vitest";

import { formatDateOnly, formatRelativeTimestamp, formatTimestamp } from "./date-format";

describe("formatDateOnly", () => {
  it("renders friendly absolute dates without shifting date-only values", () => {
    expect(formatDateOnly("2026-11-01")).toBe("Nov 1, 2026");
    expect(formatDateOnly("2026-01-12")).toBe("Jan 12, 2026");
  });

  it("leaves invalid input visible instead of inventing a date", () => {
    expect(formatDateOnly("Not set")).toBe("Not set");
  });

  it("formats timestamps in the requested timezone across midnight", () => {
    expect(formatTimestamp("2026-07-20T02:30:00.000Z", "America/New_York")).toContain(
      "Jul 19, 2026"
    );
    expect(formatTimestamp("2026-07-20T02:30:00.000Z", "Asia/Tokyo")).toContain("Jul 20, 2026");
  });

  it("preserves correct local times through daylight-saving transitions", () => {
    expect(formatTimestamp("2026-03-08T06:30:00.000Z", "America/New_York")).toContain("1:30 AM");
    expect(formatTimestamp("2026-03-08T07:30:00.000Z", "America/New_York")).toContain("3:30 AM");
  });

  it("uses readable relative activity labels with safe invalid fallback", () => {
    const now = Date.parse("2026-07-20T12:00:00.000Z");
    expect(formatRelativeTimestamp("2026-07-20T10:00:00.000Z", now)).toBe("2 hours ago");
    expect(formatRelativeTimestamp("invalid", now)).toBe("invalid");
  });
});

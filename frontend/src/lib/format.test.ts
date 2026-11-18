import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("formatting dates", () => {
  it("formats ISO strings", () => {
    expect(formatDate("2026-11-12T10:30:00.000Z")).toBe("12 Nov 2026");
    expect(formatDateTime("2026-11-12T10:30:00.000Z")).toMatch(/^12 Nov 2026, \d{2}:\d{2}$/);
  });

  it("shows a dash for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDateTime("not a date")).toBe("—");
  });
});

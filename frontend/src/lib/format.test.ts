import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatMessageDay, formatMessageTime } from "./format";

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

describe("message times", () => {
  const now = new Date(2026, 10, 12, 18, 0); // 12 Nov 2026, local time

  it("shows only the time for today and the day for earlier messages", () => {
    expect(formatMessageTime(new Date(2026, 10, 12, 9, 5).toISOString(), now)).toBe("09:05");
    expect(formatMessageTime(new Date(2026, 10, 10, 9, 5).toISOString(), now)).toBe("10 Nov, 09:05");
    expect(formatMessageDay(new Date(2026, 10, 12, 9, 5).toISOString(), now)).toBe("09:05");
    expect(formatMessageDay(new Date(2026, 10, 10, 9, 5).toISOString(), now)).toBe("10 Nov");
  });

  it("returns nothing for a missing date", () => {
    expect(formatMessageTime(null, now)).toBe("");
    expect(formatMessageDay("junk", now)).toBe("");
  });
});

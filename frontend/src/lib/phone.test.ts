import { describe, expect, it } from "vitest";
import { isValidRwandanPhone, normalizePhone } from "./phone";

describe("phone numbers", () => {
  it("normalises every common way of writing the same number", () => {
    for (const input of ["0788123456", "250788123456", "+250788123456", "+250 788 123 456", "078-812-3456", "0788 123 456"]) {
      expect(normalizePhone(input)).toBe("+250788123456");
    }
  });

  it("accepts MTN and Airtel mobile numbers", () => {
    for (const n of ["0781234567", "0791234567", "0721234567", "0731234567", "+250 788 000 000"]) {
      expect(isValidRwandanPhone(n)).toBe(true);
    }
  });

  it("rejects anything else", () => {
    for (const n of ["", "0", "078812345", "07881234567", "0711234567", "0751234567", "abc", "+254712345678"]) {
      expect(isValidRwandanPhone(n)).toBe(false);
    }
  });
});

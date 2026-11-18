import { describe, expect, it } from "vitest";
import { ApiError, CLIENT_ERROR } from "./errors";
import { errorMessage, fieldError } from "./error-messages";

describe("errorMessage", () => {
  it("gives a friendly sentence for known codes", () => {
    expect(errorMessage(new ApiError(409, "PHONE_TAKEN"))).toMatch(/already registered/);
    expect(errorMessage(new ApiError(0, CLIENT_ERROR.NETWORK))).toMatch(/internet/);
  });

  it("falls back for unknown codes and non-API errors, never leaking the raw code", () => {
    expect(errorMessage(new ApiError(500, "SOMETHING_NEW"))).not.toMatch(/SOMETHING_NEW/);
    expect(errorMessage(new Error("boom"))).toBe("Something went wrong. Please try again.");
    expect(errorMessage("x", "custom")).toBe("custom");
  });
});

describe("fieldError", () => {
  const err = new ApiError(400, "VALIDATION_ERROR", { phone: ["INVALID_PHONE"], name: ["Too small"] });

  it("maps known field codes and falls back for others", () => {
    expect(fieldError(err, "phone")).toMatch(/MTN or Airtel/);
    expect(fieldError(err, "name")).toBe("Please check this field.");
  });

  it("returns undefined for unflagged fields and other errors", () => {
    expect(fieldError(err, "city")).toBeUndefined();
    expect(fieldError(new ApiError(409, "PHONE_TAKEN"), "phone")).toBeUndefined();
  });
});

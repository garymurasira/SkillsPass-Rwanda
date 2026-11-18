import { describe, expect, it } from "vitest";
import { employerRegistrationSchema, fieldErrors, otpCodeSchema, workerRegistrationSchema } from "./validation";

const worker = { name: "Jean Claude", phone: "078 123 4567", province: "Kigali", district: "Gasabo" };

describe("validation", () => {
  it("accepts a complete worker registration", () => {
    expect(fieldErrors(workerRegistrationSchema, worker)).toEqual({});
  });

  it("reports one message per bad field", () => {
    const errors = fieldErrors(workerRegistrationSchema, { name: "J", phone: "123", province: "", district: "" });
    expect(Object.keys(errors).sort()).toEqual(["district", "name", "phone", "province"]);
    expect(errors.phone).toMatch(/MTN or Airtel/);
  });

  it("asks for the company fields from employers", () => {
    const errors = fieldErrors(employerRegistrationSchema, { ...worker, companyName: "", contactInfo: "" });
    expect(Object.keys(errors).sort()).toEqual(["companyName", "contactInfo"]);
  });

  it("only accepts 6-digit codes", () => {
    expect(otpCodeSchema.safeParse("123456").success).toBe(true);
    expect(otpCodeSchema.safeParse("12345").success).toBe(false);
    expect(otpCodeSchema.safeParse("12345a").success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { employerRegistrationSchema, fieldErrors, hasReferenceErrors, otpCodeSchema, referenceErrors, workerRegistrationSchema } from "./validation";

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

describe("reference validation", () => {
  const ok = (n: number) => ({ name: `Person ${n}`, phone: `07881234${n}0`, relationship: "Customer" });

  it("accepts three people with different valid numbers", () => {
    expect(hasReferenceErrors(referenceErrors([ok(1), ok(2), ok(3)]))).toBe(false);
  });

  it("flags missing names and bad numbers on the right person", () => {
    const e = referenceErrors([ok(1), { name: " ", phone: "123", relationship: "Other" }, ok(3)]);
    expect(e.rows[0]).toEqual({});
    expect(e.rows[1]).toMatchObject({ name: expect.any(String), phone: expect.any(String) });
    expect(hasReferenceErrors(e)).toBe(true);
  });

  it("catches the same number written two ways", () => {
    const e = referenceErrors([ok(1), { ...ok(2), phone: "+250 788 123 410" }, ok(3)]);
    expect(e.form).toMatch(/different phone number/);
  });
});

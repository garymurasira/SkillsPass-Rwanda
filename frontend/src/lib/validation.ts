import { z } from "zod";
import { isValidRwandanPhone } from "./phone";

// Client-side mirrors of the backend rules (backend/src/modules/auth/schemas.ts), so people get
// instant feedback. The server validates again and has the final say.

const required = (what: string) => `Please enter ${what}.`;

export const phoneSchema = z
  .string()
  .trim()
  .min(1, required("your phone number"))
  .refine(isValidRwandanPhone, "Enter a valid MTN or Airtel number, like 078 123 4567.");

const name = z.string().trim().min(2, "Your name needs at least 2 letters.").max(100, "That name is too long.");
const province = z.string().min(1, "Please choose a province.");
const district = z.string().min(1, "Please choose a district.");

export const workerRegistrationSchema = z.object({ name, phone: phoneSchema, province, district });

export const employerRegistrationSchema = z.object({
  name,
  phone: phoneSchema,
  companyName: z.string().trim().min(2, "The company name needs at least 2 letters.").max(120, "That name is too long."),
  province,
  district,
  contactInfo: z.string().trim().min(3, "Please enter an email or address.").max(200, "That is too long."),
});

export const otpCodeSchema = z.string().regex(/^\d{6}$/, "The code has 6 digits.");

/** First error message per field, e.g. { phone: "Enter a valid ..." }. Empty object means valid. */
export function fieldErrors<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  values: unknown,
): Partial<Record<keyof T & string, string>> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out as Partial<Record<keyof T & string, string>>;
}

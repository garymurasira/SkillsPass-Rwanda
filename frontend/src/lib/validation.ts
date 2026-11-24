import { z } from "zod";
import { i18n } from "@/lib/i18n";
import { isValidRwandanPhone, normalizePhone } from "./phone";

// Client-side mirrors of the backend rules (backend/src/modules/auth/schemas.ts), so people get
// instant feedback. The server validates again and has the final say.

// Messages in the schemas are translation keys: `fieldErrors` turns them into the current language.
const msg = (key: ValidationKey) => `errors.validation.${key}`;
type ValidationKey = keyof typeof import("@/lib/i18n/locales/errors").errors.en.validation;

export const phoneSchema = z
  .string()
  .trim()
  .min(1, msg("phoneRequired"))
  .refine(isValidRwandanPhone, msg("phoneInvalid"));

const name = z.string().trim().min(2, msg("nameShort")).max(100, msg("nameLong"));
const province = z.string().min(1, msg("province"));
const district = z.string().min(1, msg("district"));

export const workerRegistrationSchema = z.object({ name, phone: phoneSchema, province, district });

export const employerRegistrationSchema = z.object({
  name,
  phone: phoneSchema,
  companyName: z.string().trim().min(2, msg("companyShort")).max(120, msg("nameLong")),
  province,
  district,
  contactInfo: z.string().trim().min(3, msg("contactShort")).max(200, msg("contactLong")),
});

export const otpCodeSchema = z.string().regex(/^\d{6}$/, msg("code"));

/** Schema messages are keys; anything else (a message written by hand) is shown as it is. */
const translate = (message: string) => (i18n.exists(message) ? i18n.t(message as "errors.generic") : message);

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
    if (key && !(key in out)) out[key] = translate(issue.message);
  }
  return out as Partial<Record<keyof T & string, string>>;
}

// ── References (FR 3.1: exactly three, each on a different phone number) ──

export interface ReferenceDraft {
  name: string;
  phone: string;
  relationship: string;
}

export interface ReferenceErrors {
  /** One entry per reference, with the first problem of each field. */
  rows: { name?: string; phone?: string }[];
  /** A problem with the set as a whole, e.g. the same number twice. */
  form?: string;
}

export function referenceErrors(refs: ReferenceDraft[]): ReferenceErrors {
  const rows = refs.map((r) => {
    const row: { name?: string; phone?: string } = {};
    const name = r.name.trim();
    if (name.length < 2) row.name = i18n.t("errors.validation.refName");
    else if (name.length > 100) row.name = i18n.t("errors.validation.nameLong");
    if (!isValidRwandanPhone(r.phone)) row.phone = i18n.t("errors.validation.phoneInvalid");
    return row;
  });

  const valid = refs.filter((_, i) => !rows[i]?.phone).map((r) => normalizePhone(r.phone));
  const out: ReferenceErrors = { rows };
  if (new Set(valid).size < valid.length) out.form = i18n.t("errors.validation.refDuplicate");
  return out;
}

export const hasReferenceErrors = (e: ReferenceErrors) => !!e.form || e.rows.some((r) => r.name || r.phone);

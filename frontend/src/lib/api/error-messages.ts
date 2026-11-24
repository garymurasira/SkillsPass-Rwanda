import { i18n } from "@/lib/i18n";
import { isApiError } from "./errors";

/**
 * One friendly sentence per backend error code (see the error table in backend/docs/openapi.yaml).
 * The sentences live with the other translations in lib/i18n/locales/errors.ts.
 */

const generic = () => i18n.t("errors.generic");

/** The sentence to show a person for any error thrown by the API client. */
export function errorMessage(error: unknown, fallback?: string): string {
  if (!isApiError(error)) return fallback ?? generic();
  const key = `errors.codes.${error.code}`;
  return i18n.exists(key) ? i18n.t(key as "errors.generic") : (fallback ?? generic());
}

/** First message for a field of a VALIDATION_ERROR, or undefined if the server didn't flag it. */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!isApiError(error) || error.code !== "VALIDATION_ERROR") return undefined;
  const first = error.details?.[field]?.[0];
  if (first === undefined) return undefined;
  const key = `errors.fields.${first}`;
  return i18n.exists(key) ? i18n.t(key as "errors.generic") : i18n.t("errors.fields.other");
}

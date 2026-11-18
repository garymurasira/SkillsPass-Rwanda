/**
 * Rwandan phone numbers, mirroring the backend's rules (backend/src/shared/crypto.ts and
 * modules/auth/schemas.ts) so the form can say "check your number" before a round trip.
 * The server stays the source of truth: it normalises and validates again.
 */

/** 0788123456, 250788123456 and +250 788 123 456 all become +250788123456. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("250")) return `+${digits}`;
  if (digits.startsWith("0")) return `+250${digits.slice(1)}`;
  return `+250${digits}`;
}

/** Mobile numbers only: MTN 078/079, Airtel 072/073. */
export function isValidRwandanPhone(input: string): boolean {
  return /^\+2507[2389]\d{7}$/.test(normalizePhone(input));
}

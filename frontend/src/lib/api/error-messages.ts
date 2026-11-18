import { isApiError } from "./errors";

/**
 * One friendly sentence per backend error code (see the error table in backend/docs/openapi.yaml).
 * English only for now: translating means swapping this table per language, nothing else.
 */
const MESSAGES: Record<string, string> = {
  // Client-side
  NETWORK_ERROR: "We can't reach SkillsPass. Check your internet connection and try again.",
  BAD_RESPONSE: "Something went wrong on our side. Please try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",

  // General
  VALIDATION_ERROR: "Please check the information you entered.",
  NOT_FOUND: "We couldn't find that.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again.",
  RATE_LIMITED: "Too many tries. Please wait a few minutes and try again.",
  UNAUTHENTICATED: "Your session ended. Please sign in again.",
  INVALID_TOKEN: "Your session ended. Please sign in again.",
  INVALID_REFRESH_TOKEN: "Your session ended. Please sign in again.",
  FORBIDDEN: "You are not allowed to do that.",

  // Auth
  PHONE_TAKEN: "This phone number is already registered. Try signing in instead.",
  USER_NOT_FOUND: "We couldn't find an account with this number. Register first.",
  OTP_TOO_SOON: "Please wait a minute before asking for another code.",
  OTP_INVALID: "That code is wrong or has expired. Check the SMS and try again.",
  OTP_LOCKED: "Too many wrong codes. Ask for a new code.",
  SMS_SEND_FAILED: "We couldn't send the SMS. Please try again.",
  ADMIN_2FA_NOT_ENROLLED: "This staff account has no authenticator set up yet. Contact an administrator.",
  TOTP_REQUIRED: "Staff accounts also need an authenticator code. Please use Staff sign in.",
  TOTP_INVALID: "The authenticator code is wrong. Ask for a new SMS code and try again.",

  // Profile
  PROFILE_NOT_FOUND: "We couldn't find this profile.",
  SKILL_TYPE_NOT_FOUND: "That skill isn't available.",
  SKILL_EXISTS: "You already added this skill.",
  SKILL_NOT_FOUND: "We couldn't find that skill.",
  CANNOT_DELETE_MAIN_SKILL: "You can't remove your main skill. Choose a different main skill instead.",
  PORTFOLIO_FULL: "You can add up to 12 photos. Delete one to add another.",
  PHOTO_NOT_FOUND: "We couldn't find that photo.",
  PHOTO_REQUIRED: "Please choose a photo.",
  INVALID_IMAGE: "That file isn't a photo we can use. Try a JPEG or PNG picture.",
  IMAGE_TOO_COMPLEX: "That photo is too detailed. Try a smaller one.",
  FILE_TOO_LARGE: "That photo is too big. Please choose a smaller one.",
  UPLOAD_ERROR: "The photo could not be uploaded. Please try again.",
  NO_PENDING_PHONE: "There is no phone number change waiting for a code.",

  // Verification
  NO_MAIN_SKILL: "Choose your main skill first.",
  ALREADY_VERIFIED: "Your skill is already verified.",
  ROUND_OPEN: "Your references are already being checked.",
  REFERENCE_IS_SELF: "You can't use your own number as a reference.",
  ROUND_NOT_FOUND: "We couldn't find that verification.",
  REFERENCE_NOT_FOUND: "We couldn't find that reference.",
  ROUND_CLOSED: "This verification is already finished.",

  // Search
  WORKER_NOT_FOUND: "This worker is no longer available.",

  // Jobs and ratings
  JOB_ALREADY_OPEN: "You already have an unfinished job with this worker.",
  JOB_NOT_FOUND: "We couldn't find that job.",
  ALREADY_MARKED: "You already marked this job as done.",
  NOT_MARKED_BY_EMPLOYER: "The employer has not marked this job as done yet.",
  ALREADY_CONFIRMED: "This job is already confirmed.",
  JOB_NOT_COMPLETED: "You can rate a worker after the job is completed and confirmed.",
  ALREADY_RATED: "You already rated this job.",

  // Messaging
  CANNOT_MESSAGE_SELF: "You can't message yourself.",
  RECIPIENT_NOT_FOUND: "This person can't be contacted right now.",
  REPLY_ONLY: "You can reply once an employer has written to you.",
  PEER_NOT_FOUND: "We couldn't find this conversation.",
};

const GENERIC = "Something went wrong. Please try again.";

/** The sentence to show a person for any error thrown by the API client. */
export function errorMessage(error: unknown, fallback = GENERIC): string {
  if (!isApiError(error)) return fallback;
  return MESSAGES[error.code] ?? fallback;
}

/** Messages for the per-field codes that come with VALIDATION_ERROR details. */
const FIELD_MESSAGES: Record<string, string> = {
  INVALID_PHONE: "Enter a valid MTN or Airtel number, like 078 123 4567.",
  INVALID_CODE: "The code has 6 digits.",
  DUPLICATE_REFERENCE_PHONE: "Each reference needs a different phone number.",
};

/** First message for a field of a VALIDATION_ERROR, or undefined if the server didn't flag it. */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!isApiError(error) || error.code !== "VALIDATION_ERROR") return undefined;
  const first = error.details?.[field]?.[0];
  if (first === undefined) return undefined;
  return FIELD_MESSAGES[first] ?? "Please check this field.";
}

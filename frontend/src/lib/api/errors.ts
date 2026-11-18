/** Codes the client creates itself (the backend never sends these). */
export const CLIENT_ERROR = {
  /** The request never reached the server (offline, server down, CORS). */
  NETWORK: "NETWORK_ERROR",
  /** The server replied, but not with the JSON we expected. */
  BAD_RESPONSE: "BAD_RESPONSE",
} as const;

/**
 * Every failed API call becomes one of these. `code` is the stable backend code
 * (e.g. "PHONE_TAKEN"), which the UI maps to a friendly message. `details` holds the
 * per-field messages that come with VALIDATION_ERROR.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, string[]> | undefined;

  constructor(status: number, code: string, details?: Record<string, string[]>) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkError() {
    return this.code === CLIENT_ERROR.NETWORK;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** True when `e` is an ApiError with one of the given codes. */
export const hasErrorCode = (e: unknown, ...codes: string[]): boolean =>
  isApiError(e) && codes.includes(e.code);

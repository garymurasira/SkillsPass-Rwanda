const DEFAULT_API_URL = "http://localhost:4000/api";

/** Base URL of the backend API (no trailing slash), e.g. http://localhost:4000/api */
export const API_URL = (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");

/** The server origin, e.g. http://localhost:4000. Uploaded images are served from here, not from /api. */
export const API_ORIGIN = new URL(API_URL).origin;

/**
 * Turns an image path from the API (e.g. "/uploads/profile/abc.webp") into a full URL.
 * Returns null for a missing photo so callers can show a placeholder.
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

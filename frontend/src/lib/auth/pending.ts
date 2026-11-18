import type { RegisterBody } from "../api/auth";

/**
 * What the code-entry screen needs to know about the sign-in in progress. Kept in sessionStorage
 * (this tab only, gone when it closes) instead of the URL, so phone numbers don't end up in
 * browser history, and so a page reload on the code screen still works.
 */
export type PendingAuth =
  | { purpose: "REGISTER"; phone: string; form: RegisterBody }
  | { purpose: "LOGIN"; phone: string };

const KEY = "skillspass.pending-auth.v1";
let memory: PendingAuth | null = null; // fallback when sessionStorage is blocked

const store = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
};

export function savePending(p: PendingAuth) {
  memory = p;
  try {
    store()?.setItem(KEY, JSON.stringify(p));
  } catch {
    /* memory copy still works until reload */
  }
}

export function readPending(): PendingAuth | null {
  try {
    const raw = store()?.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as PendingAuth;
      if ((p.purpose === "REGISTER" || p.purpose === "LOGIN") && typeof p.phone === "string") return p;
    }
  } catch {
    /* fall through to memory */
  }
  return memory;
}

export function clearPending() {
  memory = null;
  try {
    store()?.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

import { configureApi } from "../api/client";
import { isApiError } from "../api/errors";
import { refreshTokens, type AuthUser, type TokenPair } from "../api/auth";

/**
 * The signed-in session, kept in localStorage (a deliberate demo-grade choice: simple, survives
 * reloads, readable by scripts on the page, so a production build should move to httpOnly cookies).
 *
 * Everything here is safe to import on the server: with no `window` it behaves as "signed out".
 */

const STORAGE_KEY = "skillspass.session.v1";
const REFRESH_LOCK = "skillspass-refresh";

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // blocked storage (private mode, policy)
  }
};

function isSession(v: unknown): v is Session {
  const s = v as Session | null;
  return (
    !!s &&
    typeof s.accessToken === "string" &&
    typeof s.refreshToken === "string" &&
    typeof s.user?.id === "string" &&
    typeof s.user?.role === "string"
  );
}

export function readSession(): Session | null {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function write(session: Session | null) {
  const s = storage();
  if (!s) return;
  try {
    if (session) s.setItem(STORAGE_KEY, JSON.stringify(session));
    else s.removeItem(STORAGE_KEY);
  } catch {
    // Quota or blocked storage: the user simply has to sign in again next time.
  }
}

/** Stores a fresh session (after register/login). */
export function saveSession(session: Session) {
  write(session);
  notify();
}

/** Stores a rotated token pair, keeping the signed-in user. */
function saveTokens(pair: TokenPair, user: AuthUser) {
  write({ accessToken: pair.accessToken, refreshToken: pair.refreshToken, user });
  notify();
}

export function updateSessionUser(user: AuthUser) {
  const current = readSession();
  if (current) saveSession({ ...current, user });
}

export function clearSession() {
  write(null);
  notify();
}

/** Calls `listener` whenever the session changes, here or in another tab. Returns an unsubscribe. */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

// ── Refresh ──

let inflight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const before = readSession();
  if (!before) return null;

  const run = async (): Promise<string | null> => {
    const current = readSession();
    if (!current) return null; // signed out in another tab while we waited
    // Another tab already rotated the tokens: use its result, never spend the old refresh token twice.
    if (current.accessToken !== before.accessToken) return current.accessToken;

    try {
      const pair = await refreshTokens(current.refreshToken);
      saveTokens(pair, current.user);
      return pair.accessToken;
    } catch (e) {
      // The server said this session is over: sign out. Anything else (offline, 5xx, rate limit)
      // keeps the session so the user isn't logged out just because their connection dropped.
      if (isApiError(e) && e.status >= 400 && e.status < 500 && e.status !== 429) clearSession();
      return null;
    }
  };

  // The Web Locks API makes tabs take turns; without it we still dedupe within this tab.
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  return locks ? locks.request(REFRESH_LOCK, run) : run();
}

/** One refresh at a time per tab, shared by every request that hits an expired token. */
export function refreshAccessToken(): Promise<string | null> {
  inflight ??= doRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

// Connect the API client to the session. Importing this module is what turns auth on.
configureApi({
  getAccessToken: () => readSession()?.accessToken ?? null,
  refreshAccessToken,
});

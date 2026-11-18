import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchMe, logoutRequest, type AuthResult, type AuthUser } from "../api/auth";
import { hasErrorCode } from "../api/errors";
import { AuthContext, type AuthStatus } from "./context";
import { clearSession, readSession, saveSession, subscribeSession, updateSessionUser } from "./session";

type State = { status: AuthStatus; user: AuthUser | null };
const LOADING: State = { status: "loading", user: null };

function fromStorage(): State {
  const s = readSession();
  return s ? { status: "authenticated", user: s.user } : { status: "anonymous", user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  // Starts as "loading" on server and client alike so hydration matches; storage is read in the effect.
  const [state, setState] = useState<State>(LOADING);

  useEffect(() => {
    const sync = () => setState(fromStorage());
    sync();
    const unsubscribe = subscribeSession(sync);

    // Confirm the stored session is still good. An expired access token is refreshed by the API
    // client on the way; if that fails the session is cleared and `sync` flips us to anonymous.
    const controller = new AbortController();
    if (readSession()) {
      fetchMe(controller.signal)
        .then((user) => updateSessionUser(user))
        .catch((e) => {
          // Account deleted: the session is useless. A dropped connection keeps it.
          if (hasErrorCode(e, "USER_NOT_FOUND")) clearSession();
        });
    }

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, []);

  const signIn = useCallback((result: AuthResult) => {
    saveSession({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = readSession()?.refreshToken;
    clearSession();
    queryClient.clear(); // the next person on this phone must not see cached data
    if (refreshToken) await logoutRequest(refreshToken).catch(() => {}); // best effort: we're signed out locally either way
  }, [queryClient]);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

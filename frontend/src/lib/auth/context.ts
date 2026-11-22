import { createContext, useContext } from "react";
import type { AuthResult, AuthUser } from "../api/auth";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  /** "loading" until the browser has checked its stored session (always the case during SSR). */
  status: AuthStatus;
  user: AuthUser | null;
  /** Call with the result of register/verify or login/verify. */
  signIn: (result: AuthResult) => void;
  /** Revokes the refresh token, forgets the session and clears cached data. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

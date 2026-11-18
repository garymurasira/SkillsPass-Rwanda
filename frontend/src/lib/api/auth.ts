import { api } from "./client";
import type { Schemas } from "./types";

// The OpenAPI schemas mark every field optional, so the shapes the app relies on are pinned
// down here once, instead of sprinkling `?.` and `!` over every screen.

export type Role = NonNullable<Schemas["Role"]>;
export type Language = NonNullable<Schemas["Language"]>;

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  language: Language;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** What register/verify and login/verify return. */
export interface AuthResult extends TokenPair {
  user: AuthUser;
}

/** Swaps a refresh token for a new pair. Refresh tokens work once, so callers must not retry it. */
export const refreshTokens = (refreshToken: string) =>
  api.post<TokenPair>("/auth/refresh", { refreshToken }, { auth: false });

/** Revokes a refresh token on the server. */
export const logoutRequest = (refreshToken: string) =>
  api.post<void>("/auth/logout", { refreshToken }, { auth: false });

export const fetchMe = (signal?: AbortSignal) =>
  api.get<AuthUser>("/auth/me", signal ? { signal } : undefined);

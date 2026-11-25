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

// ── Sign-up and sign-in (all public, so `auth: false`) ──

export type RegisterBody =
  | { role: "WORKER"; phone: string; name: string; language: Language; region: string; city: string }
  | {
      role: "EMPLOYER";
      phone: string;
      name: string;
      language: Language;
      region: string;
      city: string;
      companyName: string;
      contactInfo: string;
    };

/** `demoCode` is only present when the server runs in demo mode (school demonstration). */
export type OtpSent = { message: string; demoCode?: string | undefined };

/** Step 1 of sign-up: validates the details and texts a code. Creates nothing yet. */
export const startRegistration = (body: RegisterBody) =>
  api.post<OtpSent>("/auth/register", body, { auth: false });

/** Step 2 of sign-up: the code proves the phone number, then the account is created. */
export const verifyRegistration = (phone: string, code: string) =>
  api.post<AuthResult>("/auth/register/verify", { phone, code }, { auth: false });

export const startLogin = (phone: string) => api.post<OtpSent>("/auth/login", { phone }, { auth: false });

/** `totpCode` is the authenticator code, required for staff (admin) accounts only. */
export const verifyLogin = (phone: string, code: string, totpCode?: string) =>
  api.post<AuthResult>("/auth/login/verify", { phone, code, ...(totpCode ? { totpCode } : {}) }, { auth: false });

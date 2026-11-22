import { API_URL } from "./config";
import { ApiError, CLIENT_ERROR } from "./errors";

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  /** Query string values. null, undefined and "" are left out. */
  query?: QueryParams;
  /** JSON body. */
  body?: unknown;
  /** Multipart body for photo uploads. The browser sets the content type and boundary. */
  form?: FormData;
  signal?: AbortSignal;
  /** Set false for public endpoints (login, register). Default true. */
  auth?: boolean;
}

/**
 * The session layer (Stage 2) plugs in here, so this file never touches localStorage itself.
 *  - getAccessToken: the current access token, or null when signed out.
 *  - refreshAccessToken: swaps the refresh token for a new pair and resolves with the new
 *    access token, or null if the session is over. It must share one in-flight refresh between
 *    callers, because the backend's refresh tokens work only once.
 */
export interface AuthHooks {
  getAccessToken: () => string | null;
  refreshAccessToken?: () => Promise<string | null>;
}

let hooks: AuthHooks = { getAccessToken: () => null };

export function configureApi(next: AuthHooks) {
  hooks = next;
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function send(method: string, path: string, opts: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  try {
    return await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
      ...(opts.signal ? { signal: opts.signal } : {}),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, CLIENT_ERROR.NETWORK);
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const data = (await res.json()) as { error?: { code?: string; details?: Record<string, string[]> } };
    return new ApiError(res.status, data.error?.code ?? "UNKNOWN_ERROR", data.error?.details);
  } catch {
    return new ApiError(res.status, CLIENT_ERROR.BAD_RESPONSE);
  }
}

// An expired or missing access token. Worth one refresh-and-retry; any other 401 is not.
const isTokenProblem = (e: ApiError) =>
  e.status === 401 && (e.code === "INVALID_TOKEN" || e.code === "UNAUTHENTICATED");

export async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const useAuth = opts.auth !== false;
  let res = await send(method, path, opts, useAuth ? hooks.getAccessToken() : null);

  if (!res.ok && useAuth && hooks.refreshAccessToken && res.status === 401) {
    const err = await toApiError(res.clone());
    if (isTokenProblem(err)) {
      const fresh = await hooks.refreshAccessToken();
      if (fresh) res = await send(method, path, opts, fresh);
    }
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(res.status, CLIENT_ERROR.BAD_RESPONSE);
  }
}

type Opts = Omit<RequestOptions, "body" | "form">;

export const api = {
  get: <T>(path: string, opts?: Opts) => request<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: Opts) =>
    request<T>("POST", path, { ...opts, ...(body !== undefined ? { body } : {}) }),
  put: <T>(path: string, body?: unknown, opts?: Opts) =>
    request<T>("PUT", path, { ...opts, ...(body !== undefined ? { body } : {}) }),
  patch: <T>(path: string, body?: unknown, opts?: Opts) =>
    request<T>("PATCH", path, { ...opts, ...(body !== undefined ? { body } : {}) }),
  delete: <T>(path: string, opts?: Opts) => request<T>("DELETE", path, opts),
  /** Multipart upload, e.g. api.upload("PUT", "/workers/me/photo", form). */
  upload: <T>(method: "POST" | "PUT", path: string, form: FormData, opts?: Opts) =>
    request<T>(method, path, { ...opts, form }),
};

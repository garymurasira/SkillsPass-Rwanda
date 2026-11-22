import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { clearSession, readSession, refreshAccessToken, saveSession, subscribeSession, type Session } from "./session";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const session: Session = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  user: { id: "u1", role: "WORKER", name: "Jean", language: "RW" },
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session storage", () => {
  it("saves, reads and clears the session", () => {
    expect(readSession()).toBeNull();
    saveSession(session);
    expect(readSession()).toEqual(session);
    clearSession();
    expect(readSession()).toBeNull();
  });

  it("treats corrupt or incomplete stored data as signed out", () => {
    localStorage.setItem("skillspass.session.v1", "{not json");
    expect(readSession()).toBeNull();
    localStorage.setItem("skillspass.session.v1", JSON.stringify({ accessToken: "x" }));
    expect(readSession()).toBeNull();
  });

  it("tells subscribers when the session changes, until they unsubscribe", () => {
    const listener = vi.fn();
    const off = subscribeSession(listener);
    saveSession(session);
    clearSession();
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    saveSession(session);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("refreshAccessToken", () => {
  it("stores the rotated pair and keeps the user", async () => {
    saveSession(session);
    fetchMock.mockResolvedValue(json(200, { accessToken: "access-2", refreshToken: "refresh-2", expiresIn: 900 }));

    await expect(refreshAccessToken()).resolves.toBe("access-2");

    expect(readSession()).toEqual({ ...session, accessToken: "access-2", refreshToken: "refresh-2" });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body)).toEqual({ refreshToken: "refresh-1" });
  });

  it("shares one request between simultaneous callers (refresh tokens work once)", async () => {
    saveSession(session);
    fetchMock.mockResolvedValue(json(200, { accessToken: "access-2", refreshToken: "refresh-2", expiresIn: 900 }));

    const results = await Promise.all([refreshAccessToken(), refreshAccessToken(), refreshAccessToken()]);

    expect(results).toEqual(["access-2", "access-2", "access-2"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("signs the user out when the server rejects the refresh token", async () => {
    saveSession(session);
    fetchMock.mockResolvedValue(json(401, { error: { code: "INVALID_REFRESH_TOKEN" } }));

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(readSession()).toBeNull();
  });

  it("keeps the session when the connection is down", async () => {
    saveSession(session);
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(readSession()).toEqual(session);
  });

  it("keeps the session on a server error or rate limit", async () => {
    saveSession(session);
    fetchMock.mockResolvedValueOnce(json(503, { error: { code: "INTERNAL_ERROR" } }));
    await refreshAccessToken();
    fetchMock.mockResolvedValueOnce(json(429, { error: { code: "RATE_LIMITED" } }));
    await refreshAccessToken();

    expect(readSession()).toEqual(session);
  });

  it("does nothing when nobody is signed in", async () => {
    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("API client + session together", () => {
  it("sends the stored token, and on an expired one refreshes and retries transparently", async () => {
    saveSession(session);
    fetchMock
      .mockResolvedValueOnce(json(401, { error: { code: "INVALID_TOKEN" } })) // /workers/me with the old token
      .mockResolvedValueOnce(json(200, { accessToken: "access-2", refreshToken: "refresh-2", expiresIn: 900 })) // /auth/refresh
      .mockResolvedValueOnce(json(200, { id: "u1" })); // /workers/me retried

    await expect(api.get("/workers/me")).resolves.toEqual({ id: "u1" });

    const calls = fetchMock.mock.calls as [string, { headers: Record<string, string> }][];
    expect(calls[0]![1].headers["Authorization"]).toBe("Bearer access-1");
    expect(calls[1]![0]).toMatch(/\/auth\/refresh$/);
    expect(calls[1]![1].headers["Authorization"]).toBeUndefined();
    expect(calls[2]![1].headers["Authorization"]).toBe("Bearer access-2");
    expect(readSession()?.refreshToken).toBe("refresh-2");
  });
});

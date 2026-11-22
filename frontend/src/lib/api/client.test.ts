import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, configureApi } from "./client";
import { ApiError, CLIENT_ERROR } from "./errors";
import { assetUrl } from "./config";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Resolves with the ApiError a call rejects with (and fails the test if it doesn't reject).
async function failure(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call;
  } catch (e) {
    return e as ApiError;
  }
  throw new Error("expected the request to fail");
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  configureApi({ getAccessToken: () => null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1)! as [string, RequestInit & { headers: Record<string, string> }];
  return { url, init };
};

describe("api client", () => {
  it("sends JSON, the bearer token and the query string", async () => {
    configureApi({ getAccessToken: () => "tok123" });
    fetchMock.mockResolvedValue(json(200, { ok: true }));

    const out = await api.get<{ ok: boolean }>("/workers", { query: { skill: "plumber", city: "", limit: 20, x: undefined } });

    expect(out).toEqual({ ok: true });
    const { url, init } = lastCall();
    expect(url).toBe("http://localhost:4000/api/workers?skill=plumber&limit=20");
    expect(init.headers["Authorization"]).toBe("Bearer tok123");
  });

  it("posts a JSON body with a content type", async () => {
    fetchMock.mockResolvedValue(json(202, { message: "OTP_SENT" }));
    await api.post("/auth/login", { phone: "0788123456" }, { auth: false });

    const { init } = lastCall();
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["Authorization"]).toBeUndefined();
    expect(init.body).toBe(JSON.stringify({ phone: "0788123456" }));
  });

  it("lets the browser set the content type for uploads", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    const form = new FormData();
    form.append("photo", new Blob(["x"]), "a.jpg");
    await api.upload("PUT", "/workers/me/photo", form);

    const { init } = lastCall();
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("returns undefined for 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api.delete("/favorites/abc")).resolves.toBeUndefined();
  });

  it("turns backend errors into ApiError with code and details", async () => {
    fetchMock.mockResolvedValue(
      json(400, { error: { code: "VALIDATION_ERROR", details: { phone: ["INVALID_PHONE"] } } }),
    );
    const err = await failure(api.post("/auth/register", {}, { auth: false }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual({ phone: ["INVALID_PHONE"] });
  });

  it("reports an unreachable server as NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const err = await failure(api.get("/health", { auth: false }));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe(CLIENT_ERROR.NETWORK);
    expect(err.isNetworkError).toBe(true);
  });

  it("reports a non-JSON error page as BAD_RESPONSE", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    const err = await failure(api.get("/health", { auth: false }));

    expect(err.status).toBe(502);
    expect(err.code).toBe(CLIENT_ERROR.BAD_RESPONSE);
  });

  describe("token refresh", () => {
    it("refreshes once on an expired token and retries with the new one", async () => {
      const refresh = vi.fn().mockResolvedValue("fresh");
      configureApi({ getAccessToken: () => "old", refreshAccessToken: refresh });
      fetchMock
        .mockResolvedValueOnce(json(401, { error: { code: "INVALID_TOKEN" } }))
        .mockResolvedValueOnce(json(200, { id: "me" }));

      await expect(api.get("/auth/me")).resolves.toEqual({ id: "me" });

      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(lastCall().init.headers["Authorization"]).toBe("Bearer fresh");
    });

    it("gives up with the 401 when the refresh fails", async () => {
      configureApi({ getAccessToken: () => "old", refreshAccessToken: async () => null });
      fetchMock.mockResolvedValue(json(401, { error: { code: "INVALID_TOKEN" } }));

      const err = await failure(api.get("/auth/me"));
      expect(err.code).toBe("INVALID_TOKEN");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry forever when the retry is also rejected", async () => {
      const refresh = vi.fn().mockResolvedValue("fresh");
      configureApi({ getAccessToken: () => "old", refreshAccessToken: refresh });
      fetchMock.mockResolvedValue(json(401, { error: { code: "INVALID_TOKEN" } }));

      await expect(api.get("/auth/me")).rejects.toMatchObject({ status: 401 });
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does not refresh for other 401s such as a wrong OTP", async () => {
      const refresh = vi.fn();
      configureApi({ getAccessToken: () => null, refreshAccessToken: refresh });
      fetchMock.mockResolvedValue(json(401, { error: { code: "TOTP_INVALID" } }));

      await expect(api.post("/auth/login/verify", {}, { auth: false })).rejects.toMatchObject({ code: "TOTP_INVALID" });
      expect(refresh).not.toHaveBeenCalled();
    });

    it("never refreshes on public requests", async () => {
      const refresh = vi.fn();
      configureApi({ getAccessToken: () => "old", refreshAccessToken: refresh });
      fetchMock.mockResolvedValue(json(401, { error: { code: "INVALID_TOKEN" } }));

      await expect(api.post("/auth/refresh", {}, { auth: false })).rejects.toBeInstanceOf(ApiError);
      expect(refresh).not.toHaveBeenCalled();
    });
  });
});

describe("assetUrl", () => {
  it("prefixes server-relative image paths with the API origin", () => {
    expect(assetUrl("/uploads/profile/a.webp")).toBe("http://localhost:4000/uploads/profile/a.webp");
  });
  it("passes full URLs through and maps missing photos to null", () => {
    expect(assetUrl("https://cdn.example.com/a.webp")).toBe("https://cdn.example.com/a.webp");
    expect(assetUrl(null)).toBeNull();
    expect(assetUrl(undefined)).toBeNull();
  });
});

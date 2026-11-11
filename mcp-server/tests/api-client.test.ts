import { describe, expect, it, vi } from "vitest";
import { ApiError, VaperClubApiClient } from "../src/api-client.js";
import { DEFAULT_API_BASE_URL, loadConfig } from "../src/config.js";

const config = { apiBaseUrl: DEFAULT_API_BASE_URL, timeoutMs: 1000 };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("VaperClubApiClient", () => {
  it("builds the URL, drops empty params and sends headers", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true }));
    const client = new VaperClubApiClient(config, fetchMock as unknown as typeof fetch, "test-agent");
    const result = await client.get("products/search", {
      q: "  pod ",
      brandName: "",
      page: undefined,
      pageSize: 5,
    });

    expect(result).toEqual({ success: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.href).toBe("https://api.vaper.club/public-api/v1/products/search?q=pod&pageSize=5");
    expect(init.headers).toMatchObject({ Accept: "application/json", "User-Agent": "test-agent" });
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("sends the API key when configured", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const client = new VaperClubApiClient(
      { ...config, apiKey: "secret" },
      fetchMock as unknown as typeof fetch,
    );
    await client.get("site/categories");
    const init = (fetchMock.mock.calls[0] as unknown as [URL, RequestInit])[1];
    expect(init.headers).toMatchObject({ Authorization: "Bearer secret" });
  });

  it.each(["../admin", "/products", "a//b", "a?x=1", "a b", ""])("rejects unsafe path %j", async (path) => {
    const client = new VaperClubApiClient(config, vi.fn() as unknown as typeof fetch);
    await expect(client.get(path)).rejects.toBeInstanceOf(ApiError);
  });

  it("maps API error codes to safe messages", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ success: false, error: { code: "RATE_LIMITED", message: "internal detail" } }, 429),
    );
    const client = new VaperClubApiClient(
      { ...config, apiKey: "secret" },
      fetchMock as unknown as typeof fetch,
    );
    const error = await client.get("brands/search").catch((e: ApiError) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(429);
    expect((error as ApiError).message).toContain("Rate limit");
    expect((error as ApiError).message).not.toContain("internal detail");
    expect((error as ApiError).message).not.toContain("secret");
  });

  it("includes validation messages for 400 responses", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: "INVALID_PARAMETER", message: "pageSize must be 1-20." } }, 400),
    );
    const client = new VaperClubApiClient(config, fetchMock as unknown as typeof fetch);
    await expect(client.get("brands/search")).rejects.toThrow("pageSize must be 1-20.");
  });

  it("handles non-JSON error and success bodies", async () => {
    const html = vi.fn(async () => new Response("<html>boom</html>", { status: 502 }));
    await expect(new VaperClubApiClient(config, html as unknown as typeof fetch).get("x")).rejects.toThrow(
      "HTTP 502",
    );
    const bad = vi.fn(async () => new Response("not json", { status: 200 }));
    await expect(new VaperClubApiClient(config, bad as unknown as typeof fetch).get("x")).rejects.toThrow(
      "invalid JSON",
    );
  });

  it("reports network failures without details", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("ECONNREFUSED 10.0.0.1");
    });
    const client = new VaperClubApiClient(config, fetchMock as unknown as typeof fetch);
    await expect(client.get("x")).rejects.toThrow("Could not reach the Vaper.club API.");
  });

  it("times out via AbortController", async () => {
    const fetchMock = vi.fn(
      (_url: URL, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const client = new VaperClubApiClient({ ...config, timeoutMs: 20 }, fetchMock as unknown as typeof fetch);
    const error = await client.get("x").catch((e: ApiError) => e);
    expect((error as ApiError).code).toBe("TIMEOUT");
  });
});

describe("loadConfig", () => {
  it("uses defaults", () => {
    expect(loadConfig({})).toEqual({ apiBaseUrl: DEFAULT_API_BASE_URL, apiKey: undefined, timeoutMs: 15000 });
  });

  it("normalizes the base URL and parses the timeout", () => {
    const cfg = loadConfig({
      VAPER_CLUB_API_BASE_URL: "http://localhost:5000/api",
      VAPER_CLUB_API_TIMEOUT: "2.5",
      VAPER_CLUB_API_KEY: " k ",
    });
    expect(cfg).toEqual({ apiBaseUrl: "http://localhost:5000/api/", apiKey: "k", timeoutMs: 2500 });
  });

  it.each([
    { VAPER_CLUB_API_BASE_URL: "not a url" },
    { VAPER_CLUB_API_BASE_URL: "ftp://example.com" },
    { VAPER_CLUB_API_TIMEOUT: "abc" },
    { VAPER_CLUB_API_TIMEOUT: "-1" },
  ])("rejects invalid env %j", (env) => {
    expect(() => loadConfig(env)).toThrow();
  });
});

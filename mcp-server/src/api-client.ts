import type { Config } from "./config.js";

export type QueryValue = string | number | boolean | undefined | null;

/** Error with a message that is safe to show to MCP clients. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const SAFE_PATH = /^[a-z0-9][a-z0-9/_-]*$/i;

const SAFE_MESSAGES: Record<string, string> = {
  INVALID_PARAMETER: "The request parameters are invalid.",
  MISSING_FILTER: "A required filter is missing.",
  NOT_FOUND: "No matching public record was found.",
  RATE_LIMITED: "Rate limit exceeded. Wait a moment and retry.",
  TIMEOUT: "The Vaper.club API timed out. Narrow the query and retry.",
  SYSTEM_ERROR: "The Vaper.club API reported an error. Retry later.",
};

export class VaperClubApiClient {
  constructor(
    private readonly config: Config,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly userAgent = "vaper-club-mcp",
  ) {}

  /** Sends a GET request and returns the parsed JSON response unchanged. */
  async get(path: string, query: Record<string, QueryValue> = {}): Promise<unknown> {
    if (!SAFE_PATH.test(path) || path.includes("..") || path.includes("//")) {
      throw new ApiError("Invalid API path.");
    }
    const url = new URL(path, this.config.apiBaseUrl);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      const text = String(value).trim();
      if (text !== "") url.searchParams.set(key, text);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": this.userAgent,
    };
    if (this.config.apiKey) headers.Authorization = `Bearer ${this.config.apiKey}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(url, { method: "GET", headers, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError("The Vaper.club API request timed out.", undefined, "TIMEOUT");
      }
      throw new ApiError("Could not reach the Vaper.club API.", undefined, "NETWORK_ERROR");
    } finally {
      clearTimeout(timer);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }

    if (!response.ok) throw this.toApiError(response, body);
    if (body === undefined || typeof body !== "object" || body === null) {
      throw new ApiError("The Vaper.club API returned an invalid JSON response.", response.status);
    }
    return body;
  }

  private toApiError(response: Response, body: unknown): ApiError {
    const error = (body as { error?: { code?: unknown; message?: unknown } } | undefined)?.error;
    const code = typeof error?.code === "string" ? error.code : undefined;
    let message = (code && SAFE_MESSAGES[code]) || `The Vaper.club API returned HTTP ${response.status}.`;
    // Validation messages come from the API and describe the caller's input only.
    if ((response.status === 400 || response.status === 404) && typeof error?.message === "string") {
      message = `${message} ${error.message}`.slice(0, 500);
    }
    return new ApiError(message, response.status, code);
  }
}

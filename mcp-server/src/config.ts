import { readFileSync } from "node:fs";

export const DEFAULT_API_BASE_URL = "https://api.vaper.club/public-api/v1/";
export const DEFAULT_TIMEOUT_MS = 15000;

export interface Config {
  apiBaseUrl: string;
  apiKey?: string;
  timeoutMs: number;
}

export interface PackageInfo {
  name: string;
  version: string;
}

export function readPackageInfo(): PackageInfo {
  const raw = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(raw) as PackageInfo;
  return { name: pkg.name, version: pkg.version };
}

/** Builds the configuration from environment variables, rejecting invalid values early. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const baseUrl = env.VAPER_CLUB_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error("VAPER_CLUB_API_BASE_URL is not a valid URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("VAPER_CLUB_API_BASE_URL must use http or https.");
  }
  // A trailing slash keeps relative endpoint paths under the base path.
  const apiBaseUrl = parsed.href.endsWith("/") ? parsed.href : `${parsed.href}/`;

  let timeoutMs = DEFAULT_TIMEOUT_MS;
  const rawTimeout = env.VAPER_CLUB_API_TIMEOUT?.trim();
  if (rawTimeout) {
    const seconds = Number(rawTimeout);
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 300) {
      throw new Error("VAPER_CLUB_API_TIMEOUT must be a number of seconds between 0 and 300.");
    }
    timeoutMs = Math.round(seconds * 1000);
  }

  return { apiBaseUrl, apiKey: env.VAPER_CLUB_API_KEY?.trim() || undefined, timeoutMs };
}

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const cli = fileURLToPath(new URL("../dist/index.js", import.meta.url));

interface RpcResponse {
  id: number;
  result?: any;
  error?: { code: number; message: string };
}

let api: Server;
let requests: string[] = [];
let child: ChildProcessWithoutNullStreams;
let stdout = "";
let stderr = "";
let nextId = 1;

function send(method: string, params: unknown = {}): Promise<RpcResponse> {
  const id = nextId++;
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      for (const line of stdout.split("\n")) {
        if (!line.trim()) continue;
        const message = JSON.parse(line) as RpcResponse;
        if (message.id === id) {
          clearInterval(timer);
          resolve(message);
          return;
        }
      }
      if (Date.now() - started > 8000) {
        clearInterval(timer);
        reject(new Error(`No response to ${method}. stderr: ${stderr}`));
      }
    }, 10);
  });
}

function callTool(name: string, args: Record<string, unknown>) {
  return send("tools/call", { name, arguments: args }).then((r) => r.result);
}

beforeAll(async () => {
  api = createServer((req, res) => {
    requests.push(req.url ?? "");
    const url = new URL(req.url ?? "", "http://localhost");
    res.setHeader("content-type", "application/json");
    if (url.pathname.endsWith("/brands/details") && url.searchParams.get("brandName") === "missing") {
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: "Brand not found." } }));
      return;
    }
    res.end(
      JSON.stringify({
        success: true,
        data: { path: url.pathname, items: [{ sourceUrl: "https://vaper.club/x" }] },
      }),
    );
  });
  await new Promise<void>((resolve) => api.listen(0, "127.0.0.1", resolve));
  const port = (api.address() as AddressInfo).port;

  child = spawn(process.execPath, [cli], {
    env: { ...process.env, VAPER_CLUB_API_BASE_URL: `http://127.0.0.1:${port}/public-api/v1/` },
  });
  child.stdout.on("data", (d) => (stdout += d));
  child.stderr.on("data", (d) => (stderr += d));

  const init = await send("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  });
  expect(init.result.serverInfo.name).toBe("vaper-club");
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
});

afterAll(async () => {
  child.kill();
  await new Promise<void>((resolve) => api.close(() => resolve()));
});

describe("MCP server over stdio", () => {
  it("registers the expected tools and writes only protocol messages to stdout", async () => {
    const list = await send("tools/list");
    const names = list.result.tools.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(
      [
        "compare_products",
        "get_brand_details",
        "get_latest_posts",
        "get_product_categories",
        "get_product_reviews",
        "get_shop_details",
        "search_brands",
        "search_posts",
        "search_products",
        "search_shops",
      ].sort(),
    );
    for (const line of stdout.split("\n").filter((l) => l.trim())) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
    expect(stderr).toContain("running on stdio");
  });

  it("searches products and keeps the API response intact", async () => {
    requests = [];
    const result = await callTool("search_products", {
      query: "pod",
      brand_name: "Acme",
      sort_by: "latest",
      page_size: 5,
    });
    expect(result.isError).toBeFalsy();
    expect(requests[0]).toBe("/public-api/v1/products/search?q=pod&brandName=Acme&sortBy=latest&pageSize=5");
    expect(result.structuredContent.data.items[0].sourceUrl).toBe("https://vaper.club/x");
    expect(result.content[0].text).toContain("https://vaper.club/x");
  });

  it("searches brands and gets product categories", async () => {
    requests = [];
    expect((await callTool("search_brands", { query: "acme" })).isError).toBeFalsy();
    expect((await callTool("get_product_categories", {})).isError).toBeFalsy();
    expect(requests).toEqual(["/public-api/v1/brands/search?q=acme", "/public-api/v1/site/categories"]);
  });

  it("gets brand details and surfaces API errors safely", async () => {
    requests = [];
    expect((await callTool("get_brand_details", { brand_id: 12 })).isError).toBeFalsy();
    expect(requests[0]).toBe("/public-api/v1/brands/details?brandId=12");
    const missing = await callTool("get_brand_details", { brand_name: "missing" });
    expect(missing.isError).toBe(true);
    expect(missing.content[0].text).toContain("No matching public record");
  });

  it("rejects invalid or empty parameters without calling the API", async () => {
    requests = [];
    const invalid = [
      await send("tools/call", { name: "search_products", arguments: { query: "" } }),
      await send("tools/call", { name: "search_products", arguments: { query: "x", page_size: 500 } }),
      await send("tools/call", { name: "search_products", arguments: {} }),
    ];
    for (const r of invalid) expect(r.error || r.result?.isError).toBeTruthy();
    expect((await callTool("search_brands", {})).isError).toBe(true);
    expect((await callTool("get_brand_details", {})).isError).toBe(true);
    expect((await callTool("search_shops", {})).isError).toBe(true);
    expect(requests).toEqual([]);
  });
});

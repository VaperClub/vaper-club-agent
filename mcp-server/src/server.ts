import { McpServer } from "@modelcontextprotocol/server";
import type { VaperClubApiClient } from "./api-client.js";
import type { PackageInfo } from "./config.js";
import { registerBrandTools } from "./tools/brands.js";
import { registerCategoryTools } from "./tools/categories.js";
import { registerContentTools } from "./tools/content.js";
import { registerProductTools } from "./tools/products.js";

export function createServer(client: VaperClubApiClient, pkg: PackageInfo): McpServer {
  const server = new McpServer({
    name: "vaper-club",
    title: "Vaper.club",
    version: pkg.version,
    description:
      "Search vape products, brands, models, specifications and compatible accessories using Vaper.club's structured product database.",
    websiteUrl: "https://vaper.club",
  });
  registerProductTools(server, client);
  registerBrandTools(server, client);
  registerCategoryTools(server, client);
  registerContentTools(server, client);
  return server;
}

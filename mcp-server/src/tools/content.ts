import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { VaperClubApiClient } from "../api-client.js";
import { callApi, errorResult, hasAny, language, page, pageSize, readOnly } from "./helpers.js";

/** Posts and shops tools, mirroring the hosted Vaper.club MCP server. */
export function registerContentTools(server: McpServer, client: VaperClubApiClient): void {
  server.registerTool(
    "get_latest_posts",
    {
      title: "Get latest posts",
      description: "Get the latest Vaper.club posts (news, reviews, guides) as summaries.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).optional().describe("Number of posts, 1-50."),
        category: z.string().trim().max(200).optional().describe("Post category."),
        since: z
          .string()
          .trim()
          .max(40)
          .optional()
          .describe("Only posts published after this date (ISO 8601)."),
        language,
      }),
      annotations: readOnly,
    },
    (args) =>
      callApi(client, "posts/latest", {
        limit: args.limit,
        category: args.category,
        since: args.since,
        language: args.language,
      }),
  );

  server.registerTool(
    "search_posts",
    {
      title: "Search posts",
      description: "Keyword search over Vaper.club posts (articles and videos).",
      inputSchema: z.object({
        query: z.string().trim().min(1).max(200).describe("Search keywords."),
        category: z.string().trim().max(200).optional().describe("Post category."),
        type: z.enum(["article", "video"]).optional().describe("Post type."),
        sort_by: z.enum(["relevance", "latest"]).optional().describe("Sort order (default relevance)."),
        start_date: z
          .string()
          .trim()
          .max(40)
          .optional()
          .describe("Filter start date; applies to the returned page only."),
        end_date: z
          .string()
          .trim()
          .max(40)
          .optional()
          .describe("Filter end date; applies to the returned page only."),
        language,
        page,
        page_size: pageSize,
      }),
      annotations: readOnly,
    },
    (args) =>
      callApi(client, "posts/search", {
        q: args.query,
        category: args.category,
        type: args.type,
        sortBy: args.sort_by,
        startDate: args.start_date,
        endDate: args.end_date,
        language: args.language,
        page: args.page,
        pageSize: args.page_size,
      }),
  );

  server.registerTool(
    "search_shops",
    {
      title: "Search shops",
      description:
        "Search retail shops by name keywords or country. At least one of query or country is required.",
      inputSchema: z.object({
        query: z.string().trim().max(200).optional().describe("Shop name keywords."),
        country: z.string().trim().max(2).optional().describe("ISO 3166-1 alpha-2 country code."),
        language,
        page,
        page_size: pageSize,
      }),
      annotations: readOnly,
    },
    (args) => {
      if (!hasAny(args.query, args.country)) return errorResult("Provide at least one of query or country.");
      return callApi(client, "shops/search", {
        q: args.query,
        country: args.country,
        language: args.language,
        page: args.page,
        pageSize: args.page_size,
      });
    },
  );

  server.registerTool(
    "get_shop_details",
    {
      title: "Get shop details",
      description:
        "Get a shop profile: locations, main brands and categories. Identify the shop by shop_id, slug or shop_name (at least one).",
      inputSchema: z.object({
        shop_id: z.number().int().min(1).optional().describe("Numeric shop id from a previous result."),
        slug: z.string().trim().max(200).optional().describe("Shop slug."),
        shop_name: z.string().trim().max(200).optional().describe("Shop name."),
        language,
      }),
      annotations: readOnly,
    },
    (args) => {
      if (!hasAny(args.shop_id, args.slug, args.shop_name)) {
        return errorResult("Provide at least one of shop_id, slug or shop_name.");
      }
      return callApi(client, "shops/details", {
        shopId: args.shop_id,
        slug: args.slug,
        shopName: args.shop_name,
        language: args.language,
      });
    },
  );
}

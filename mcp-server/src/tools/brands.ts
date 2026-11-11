import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { VaperClubApiClient } from "../api-client.js";
import { callApi, errorResult, hasAny, language, page, pageSize, readOnly } from "./helpers.js";

export function registerBrandTools(server: McpServer, client: VaperClubApiClient): void {
  server.registerTool(
    "search_brands",
    {
      title: "Search brands",
      description:
        "Search vape brands by name keywords or by category name. At least one of query or category_name is required.",
      inputSchema: z.object({
        query: z.string().trim().max(200).optional().describe("Brand name keywords."),
        category_name: z.string().trim().max(200).optional().describe("Only brands in this category."),
        language,
        page,
        page_size: pageSize,
      }),
      annotations: readOnly,
    },
    (args) => {
      if (!hasAny(args.query, args.category_name)) {
        return errorResult("Provide at least one of query or category_name.");
      }
      return callApi(client, "brands/search", {
        q: args.query,
        categoryName: args.category_name,
        language: args.language,
        page: args.page,
        pageSize: args.page_size,
      });
    },
  );

  server.registerTool(
    "get_brand_details",
    {
      title: "Get brand details",
      description:
        "Get a brand profile: description, official website, aliases, categories and models. Identify the brand by brand_id, slug or brand_name (at least one).",
      inputSchema: z.object({
        brand_id: z.number().int().min(1).optional().describe("Numeric brand id from a previous result."),
        slug: z.string().trim().max(200).optional().describe("Brand slug."),
        brand_name: z.string().trim().max(200).optional().describe("Brand name."),
        language,
      }),
      annotations: readOnly,
    },
    (args) => {
      if (!hasAny(args.brand_id, args.slug, args.brand_name)) {
        return errorResult("Provide at least one of brand_id, slug or brand_name.");
      }
      return callApi(client, "brands/details", {
        brandId: args.brand_id,
        slug: args.slug,
        brandName: args.brand_name,
        language: args.language,
      });
    },
  );
}

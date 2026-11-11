import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { VaperClubApiClient } from "../api-client.js";
import { callApi, page, pageSize, productFilters, productQuery, readOnly } from "./helpers.js";

export function registerProductTools(server: McpServer, client: VaperClubApiClient): void {
  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description:
        "Search vape product offers from retail shops. Each result is one shop's offer with brand, model, category, price, stock status, variants, ratings and a sourceUrl on Vaper.club. Cite sourceUrl when using the data. Missing fields mean unknown, not zero.",
      inputSchema: z.object({
        ...productFilters,
        sort_by: z
          .enum(["relevance", "latest", "rating", "reviews", "price_asc", "price_desc"])
          .optional()
          .describe("Sort order (default relevance)."),
        page,
        page_size: pageSize,
      }),
      annotations: readOnly,
    },
    (args) =>
      callApi(client, "products/search", {
        ...productQuery(args),
        sortBy: args.sort_by,
        page: args.page,
        pageSize: args.page_size,
      }),
  );

  server.registerTool(
    "compare_products",
    {
      title: "Compare product offers",
      description:
        "Compare offers of the best-matching product model across shops, cheapest first. Use it for price and stock comparison of one model.",
      inputSchema: z.object({
        ...productFilters,
        limit: z.number().int().min(1).max(10).optional().describe("Maximum offers to return, 1-10."),
      }),
      annotations: readOnly,
    },
    (args) => callApi(client, "products/compare", { ...productQuery(args), limit: args.limit }),
  );

  server.registerTool(
    "get_product_reviews",
    {
      title: "Get product reviews",
      description:
        "Get the review summary (all reviews) and the newest or most helpful user reviews of the best-matching product.",
      inputSchema: z.object({
        ...productFilters,
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Maximum reviews to return, 1-20 (default 10)."),
        sort_by: z.enum(["latest", "helpful"]).optional().describe("Review order (default latest)."),
      }),
      annotations: readOnly,
    },
    (args) =>
      callApi(client, "products/reviews", { ...productQuery(args), limit: args.limit, sortBy: args.sort_by }),
  );
}

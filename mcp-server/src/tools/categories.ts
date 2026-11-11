import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { VaperClubApiClient } from "../api-client.js";
import { callApi, language, readOnly } from "./helpers.js";

export function registerCategoryTools(server: McpServer, client: VaperClubApiClient): void {
  server.registerTool(
    "get_product_categories",
    {
      title: "Get product categories",
      description:
        "List the product categories supported by Vaper.club. Use the names as category or category_name filters in other tools.",
      inputSchema: z.object({ language }),
      annotations: readOnly,
    },
    (args) => callApi(client, "site/categories", { language: args.language }),
  );
}

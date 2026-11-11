import type { CallToolResult } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { ApiError, type QueryValue, type VaperClubApiClient } from "../api-client.js";

export const language = z
  .string()
  .trim()
  .max(16)
  .optional()
  .describe("Language code such as en or de. Defaults to the site default language.");

export const page = z.number().int().min(1).optional().describe("Page number, starting at 1.");

export const pageSize = z
  .number()
  .int()
  .min(1)
  .max(20)
  .optional()
  .describe("Results per page, 1-20 (default 10).");

export const productFilters = {
  query: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .describe("Search keywords, for example a product, model or flavor name."),
  brand_name: z.string().trim().max(200).optional().describe("Restrict to a brand name."),
  model_name: z.string().trim().max(200).optional().describe("Restrict to a model name."),
  category_name: z.string().trim().max(200).optional().describe("Restrict to a category name."),
  country: z.string().trim().max(2).optional().describe("ISO 3166-1 alpha-2 country code of the shop."),
  shop: z.string().trim().max(200).optional().describe("Restrict to a shop name."),
  language,
};

export const readOnly = { readOnlyHint: true, idempotentHint: true, openWorldHint: true } as const;

export function productQuery(args: z.infer<z.ZodObject<typeof productFilters>>): Record<string, QueryValue> {
  return {
    q: args.query,
    brandName: args.brand_name,
    modelName: args.model_name,
    categoryName: args.category_name,
    country: args.country,
    shop: args.shop,
    language: args.language,
  };
}

export function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Calls the API and returns the untouched response as text plus structured content. */
export async function callApi(
  client: VaperClubApiClient,
  path: string,
  query: Record<string, QueryValue>,
): Promise<CallToolResult> {
  try {
    const data = (await client.get(path, query)) as Record<string, unknown>;
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
  } catch (error) {
    return errorResult(
      error instanceof ApiError ? error.message : "Unexpected error while calling the Vaper.club API.",
    );
  }
}

export function hasAny(...values: unknown[]): boolean {
  return values.some((v) => (typeof v === "string" ? v.trim() !== "" : v !== undefined && v !== null));
}

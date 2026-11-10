# Vaper.club MCP Server

Read-only [Model Context Protocol](https://modelcontextprotocol.io) server for vape industry posts, brands, shops, products and reviews. It uses the same data and logic as the [public REST API](../docs/api.md).

| Property | Value |
|---|---|
| Endpoint | `https://api.vaper.club/mcp` |
| Transport | Streamable HTTP (stateless) |
| Auth | None. Rate limited per IP (120 requests/minute for MCP) |
| Audience | Adults only |

## Connect

```json
{
  "mcpServers": {
    "vaper-club": {
      "url": "https://api.vaper.club/mcp"
    }
  }
}
```

Browser-based clients must send an allowed `Origin`; requests without an `Origin` header (desktop and server-side agents) are accepted.

## Tools

All tools are read-only and idempotent. `language` is optional on every tool and falls back to the site default.

| Tool | Purpose | Key parameters |
|---|---|---|
| `get_latest_posts` | Latest posts (summaries only) | `limit` (1–50), `language`, `category`, `since` |
| `search_posts` | Keyword search over posts | `query` (required), `category`, `type` (`article`/`video`), `sort_by` (`relevance`/`latest`), `start_date`, `end_date`, `page`, `page_size` |
| `search_brands` | Search brands | `query` or `category_name` (at least one), `page`, `page_size` |
| `get_brand_details` | Brand profile, aliases, categories, models | `brand_id`, `slug` or `brand_name` |
| `search_shops` | Search retail shops | `query` or `country` (at least one; ISO 3166-1 alpha-2), `page`, `page_size` |
| `get_shop_details` | Shop profile, locations, main brands and categories | `shop_id`, `slug` or `shop_name` |
| `search_products` | Search shop product records | `query` (required), `brand_name`, `model_name`, `category_name`, `country`, `shop`, `sort_by` (`relevance`/`latest`/`rating`/`reviews`/`price_asc`/`price_desc`), `page`, `page_size` |
| `compare_products` | Offers of the best-matching model, cheapest first | same filters as `search_products`, `limit` (1–10) |
| `get_product_reviews` | Review summary and newest reviews of the best-matching product | same filters as `search_products`, `limit` (1–20, default 10), `sort_by` (`latest`/`helpful`) |

`page_size` is 1–20 (default 10). Product (listing) identifiers are never returned; use the `sourceUrl` in each result for attribution.

## Resources

| URI | Content |
|---|---|
| `vaper://site/about` | What Vaper.club is, data provided, disclaimers |
| `vaper://site/faq` | Data sources, freshness, reviews, rate limits, compliance |
| `vaper://site/categories` | Supported product categories |
| `vaper://site/languages` | Supported languages |

## Responses and errors

Tools return the JSON envelope described in [docs/api.md](../docs/api.md#response-format) (`success`, `data`, `pagination`, `meta`, `error`). Check `meta.warnings` for unrecognized filters or other limitations.

## Notes

- Prices and stock may lag the shop websites; confirm there before purchase decisions.
- Missing fields mean unknown, not zero.
- The API provides objective data only and gives no guidance on circumventing age verification or legal restrictions.

See [server.json](server.json) for the registry manifest and the [skills](../skills) for usage guidance.

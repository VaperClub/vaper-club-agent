# Vaper.club Public REST API

Read-only JSON API for posts, brands, shops, products and reviews. Same data and logic as the [MCP server](https://vaper.club/developers/mcp.md).

- **Base URL:** `https://api.vaper.club/public-api/v1`
- **Auth:** none. Rate limited per IP.
- **Audience:** adults only. The API provides objective data and does not give guidance on circumventing age verification, purchase restrictions or other legal limits.
- **Identifiers:** product (listing) identifiers are never returned. Only `brandId`, `shopId` and `categoryId` appear.

## Common parameters

| Parameter | Description |
|---|---|
| `language` | Language code (`en`, `de`, `fr`, ...). Falls back to `x-i18n-language` header, `Accept-Language`, then the site default. |
| `page`, `pageSize` | Pagination. `pageSize` 1–20 (default 10). |

## Endpoints

### Posts

- `GET /posts/latest?limit&language&category&since` – latest posts, `limit` ≤ 50.
- `GET /posts/search?q&language&category&type&sortBy&startDate&endDate&page&pageSize` – `q` required; `sortBy`: `relevance` \| `latest`. Date filters apply to the returned page only.

### Brands

- `GET /brands/search?q&categoryName&language&page&pageSize` – at least one of `q`, `categoryName`.
- `GET /brands/{brandId}` or `GET /brands/details?brandId&slug&brandName` – profile, aliases, categories, models.

### Shops

- `GET /shops/search?q&country&language&page&pageSize` – at least one of `q`, `country` (ISO 3166-1 alpha-2).
- `GET /shops/{shopId}` or `GET /shops/details?shopId&slug&shopName` – profile, locations, main brands and categories.

### Products

- `GET /products/search?q&brandName&modelName&categoryName&country&shop&sortBy&language&page&pageSize` – `q` required. `sortBy`: `relevance` \| `latest` \| `rating` \| `reviews` \| `price_asc` \| `price_desc`. Each item is one shop's offer.
- `GET /products/compare?q&brandName&modelName&categoryName&country&shop&language&limit` – offers of the best-matching model, cheapest first, `limit` ≤ 10.
- `GET /products/reviews?q&brandName&modelName&categoryName&country&shop&language&limit&sortBy` – review summary (all reviews) and newest reviews of the best-matching product; `limit` ≤ 20 (default 10); `sortBy`: `latest` \| `helpful`.

### Site reference and skills

- `GET /site/about`, `/site/faq`, `/site/categories`, `/site/languages`
- `GET /skills` – list of Agent Skills; `GET /skills/{name}` – SKILL.md (`text/markdown`).

## Response format

```json
{
  "success": true,
  "data": {},
  "pagination": { "page": 1, "pageSize": 10, "total": 125, "hasMore": true },
  "meta": { "requestId": "req_...", "timestamp": "2026-11-10T08:00:00Z", "language": "en", "warnings": [] },
  "error": null
}
```

Example product item (shortened):

```json
{
  "title": "Example Disposable 5000",
  "brandName": "Example", "brandId": 12,
  "modelName": "Disposable 5000",
  "categoryName": "Disposable vape", "categoryId": 16,
  "shopName": "Example Shop", "shopId": 7,
  "price": { "from": 9.9, "to": 9.9, "currency": "EUR" },
  "inventoryStatus": "InStock",
  "variants": [{ "options": "Blueberry", "price": 9.9, "currency": "EUR", "inventoryStatus": "InStock" }],
  "reviews": { "rating": 4.3, "count": 25 },
  "shopProductUrl": "https://shop.example/product",
  "sourceUrl": "https://vaper.club/listings/..."
}
```

Cite `sourceUrl` when you use the data. Missing fields mean unknown, not zero.

## Errors

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `INVALID_PARAMETER`, `MISSING_FILTER` | Bad or missing parameters |
| 404 | `NOT_FOUND` | No matching public record |
| 429 | `RATE_LIMITED` | Too many requests; see `Retry-After` header and `error.retryAfterSeconds` |
| 504 | `TIMEOUT` | Narrow the query and retry |
| 500 | `SYSTEM_ERROR` | Retry later |

## Rate limits

Per IP, per minute: posts 30, brand/shop search 30, product search 30, details 60, compare 10, reviews 20, site/skills 60.

## Caching

Responses are cached for minutes to hours and carry `Cache-Control: public, max-age=60`. Prices and stock may lag the shop websites; confirm there before purchase decisions.

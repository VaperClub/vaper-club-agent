# Vaper Club Agent

Official AI Agent integration resources for [Vaper Club](https://vaper.club), providing MCP connectivity, Agent Skills, and public API documentation for vape product, brand, model, and store data.

Vaper Club provides structured product catalog information to help AI agents and developers discover, search, and understand vaping products and related brands.

## What is Vaper Club?

[Vaper Club](https://vaper.club) is a product discovery and information platform focused on the global vaping industry.

It provides structured information about:

- **Products** – Product names, descriptions, specifications, categories, and images.
- **Brands** – Brand profiles, official websites, and product portfolios.
- **Models** – Normalized product model information and identification.
- **Listings** – Product listings from different online vape retailers.
- **Stores** – Retailer information and product availability.
- **Market Data** – Product pricing and other available catalog information.

## Integration Options

### 1. MCP Server

Connect AI agents and MCP-compatible applications directly to Vaper Club.

| Property | Value |
|---|---|
| Service | Vaper Club MCP |
| Endpoint | `https://api.vaper.club/mcp` |
| Protocol | Model Context Protocol (MCP) |
| Transport | Streamable HTTP |
| Authentication | None (rate limited per IP) |
| Documentation | [MCP Documentation](https://vaper.club/developers/mcp.md) · [mcp/README.md](mcp/README.md) |

The server exposes read-only tools: `get_latest_posts`, `search_posts`, `search_brands`, `get_brand_details`, `search_shops`, `get_shop_details`, `search_products`, `compare_products` and `get_product_reviews`, plus reference resources under `vaper://site/*`.

A local STDIO adapter is also available as the npm package `vaper-club-mcp` (`npx -y vaper-club-mcp`); see [mcp-server/README.md](mcp-server/README.md).

### 2. Public API

Developers can integrate Vaper Club data into their own applications using the public API.

| Property | Value |
|---|---|
| API Base URL | `https://api.vaper.club/public-api/v1` |
| Documentation | [Public API Documentation](https://vaper.club/developers/api.md) · [docs/api.md](docs/api.md) |
| Format | JSON |
| Protocol | HTTPS |
| Authentication | None (rate limited per IP) |

Refer to the API documentation for endpoints, parameters, response schemas and error codes.

### 3. Agent Skills

This repository provides reusable Agent Skills to help AI agents understand Vaper Club's data structure and use its services correctly.

Skills are designed to work with compatible AI agent environments and can be extended independently. They are also published for discovery at `https://vaper.club/.well-known/agent-skills/index.json`.

## Available Skills

| Skill | Description |
|---|---|
| `vaper-club-discovery` | Search posts (news, reviews, guides), brands and retail shops. |
| `vaper-club-product-research` | Find and identify products, see prices and stock across shops, compare offers of the same model. |
| `vaper-club-brand-research` | Build a brand profile: background, website, company, aliases, categories and models. |
| `vaper-club-product-reviews` | Summarize user reviews, ratings, and common praise and complaints of a product. |

See [skills/index.json](skills/index.json) and the `skills/` directory for individual skill instructions.

## Getting Started

### Connect through MCP

Add the following MCP server configuration to an MCP-compatible client:

```json
{
  "mcpServers": {
    "vaper-club": {
      "url": "https://api.vaper.club/mcp"
    }
  }
}
```

No authentication is required.

### Use Agent Skills

Clone this repository:

```bash
git clone https://github.com/VaperClub/vaper-club-agent.git
```

Copy the required directories from `skills/` (for example `skills/vaper-club-product-research`) into the skill directory supported by your AI agent. The skills call the MCP server above, so connect it first.

### Use the Public API

```bash
curl "https://api.vaper.club/public-api/v1/products/search?q=disposable&pageSize=5"
```

See [docs/api.md](docs/api.md) for all endpoints.

## Use Cases

Vaper Club integrations can help developers and AI agents with:

- Reading the latest vape industry posts and searching articles.
- Searching brands and shops, and reading their profiles.
- Searching products and comparing prices and stock of the same model across retailers.
- Summarizing product ratings and the newest user reviews.
- Building applications that consume structured vaping industry data.

Actual capabilities and data availability depend on the API and MCP tools currently exposed by Vaper Club. Vaper Club is intended for adults only and provides no guidance on circumventing age verification or legal restrictions.

## Documentation

- Website: https://vaper.club
- Public API: https://api.vaper.club/public-api/v1 ([docs/api.md](docs/api.md))
- MCP Server: https://api.vaper.club/mcp ([mcp/README.md](mcp/README.md))
- Skills index: https://vaper.club/.well-known/agent-skills/index.json
- GitHub Repository: https://github.com/VaperClub/vaper-club-agent

## Contributing

Contributions, suggestions, and improvements are welcome.

You can contribute by:

- Improving Agent Skills and documentation.
- Adding integration examples.
- Reporting incorrect instructions or technical issues.
- Suggesting additional AI agent use cases.

Please open an issue or submit a pull request.

## License

The source files, code examples, and original Agent Skills in this repository are licensed under the [MIT License](LICENSE).

This license does not grant rights to Vaper Club trademarks, third-party trademarks, product images, or data accessed through Vaper Club services.

Use of Vaper Club APIs and data is subject to the applicable Vaper Club terms and policies.

---

**Vaper Club**  
Website: https://vaper.club

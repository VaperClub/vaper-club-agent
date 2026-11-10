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
| Endpoint | `https://api.vaper.club/mcp/` |
| Protocol | Model Context Protocol (MCP) |
| Transport | Streamable HTTP |
| Documentation | [MCP Documentation](https://vaper.club/developers/mcp.md) |

The MCP server provides a standardized interface for AI agents to interact with Vaper Club's product information services.

### 2. Public API

Developers can integrate Vaper Club data into their own applications using the public API.

| Property | Value |
|---|---|
| API Base URL | `https://api.vaper.club/public-api/v1/` |
| Documentation | [Public API Documentation](https://vaper.club/developers/api.md) |
| Format | JSON |
| Protocol | HTTPS |

Refer to the API documentation for available endpoints, parameters, response schemas, and access requirements.

### 3. Agent Skills

This repository provides reusable Agent Skills to help AI agents understand Vaper Club's data structure and use its services correctly.

Skills are designed to work with compatible AI agent environments and can be extended independently.

## Available Skills

| Skill | Description |
|---|---|
| `vaper-club-search` | Search and retrieve product, brand, model, and store information through Vaper Club services. |
| `vape-product-identification` | Understand product naming conventions, brand identification, and model normalization. |
| `vape-brand-research` | Research vaping brands and organize structured brand information. |

See the `skills/` directory for individual skill instructions and usage requirements.

## Getting Started

### Connect through MCP

Add the following MCP server configuration to an MCP-compatible client:

```json
{
  "mcpServers": {
    "vaper-club": {
      "url": "https://api.vaper.club/mcp/"
    }
  }
}
```

The actual authentication requirements, if any, are documented in the MCP documentation.

### Use Agent Skills

Clone this repository:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/vaper-club-agent.git
```

Install or copy the required skill directory into the skill discovery directory supported by your AI agent.

Refer to your agent's documentation for its specific skill installation procedure.

### Use the Public API

Visit the [Vaper Club Public API Documentation](https://api.vaper.club/public-api/v1/) to explore available endpoints and integration examples.

## Use Cases

Vaper Club integrations can help developers and AI agents with:

- Searching for vaping products by name, brand, or model.
- Retrieving structured product specifications.
- Discovering product brands and related models.
- Comparing product listings across retailers.
- Identifying product categories and product types.
- Building applications that consume structured vaping industry data.

Actual capabilities and data availability depend on the API and MCP tools currently exposed by Vaper Club.

## Documentation

- Website: https://vaper.club
- Public API: https://api.vaper.club/public-api/v1/
- MCP Server: https://api.vaper.club/mcp/
- GitHub Repository: https://github.com/YOUR_GITHUB_USERNAME/vaper-club-agent

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

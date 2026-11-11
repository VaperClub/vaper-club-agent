# Vaper.club MCP Server (local STDIO adapter)

`vaper-club-mcp` is a lightweight [Model Context Protocol](https://modelcontextprotocol.io) server that runs locally over STDIO and forwards every tool call to the [Vaper.club Public API](https://api.vaper.club/public-api/v1/). It contains no database, search or business logic of its own.

Vaper.club also runs an official hosted MCP server at <https://api.vaper.club/mcp/>. Use this package when your client prefers a local STDIO process; use the hosted endpoint when it supports remote servers.

## Features and tools

All tools are read-only. Results are the unmodified Public API response (`success`, `data`, `pagination`, `meta`, `error`), returned both as text and as `structuredContent`. Cite the `sourceUrl` of each result. Missing fields mean unknown, not zero.

| Tool                               | Purpose                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `search_products`                  | Search shop product offers (filters: brand, model, category, country, shop, sort, paging) |
| `compare_products`                 | Offers of the best-matching model, cheapest first                                         |
| `get_product_reviews`              | Review summary and reviews of the best-matching product                                   |
| `search_brands`                    | Search brands by keywords or category                                                     |
| `get_brand_details`                | Brand profile by `brand_id`, `slug` or `brand_name`                                       |
| `get_product_categories`           | Supported product categories                                                              |
| `get_latest_posts`, `search_posts` | News, reviews and guides                                                                  |
| `search_shops`, `get_shop_details` | Retail shops                                                                              |

Not exposed, because the Public API does not provide them: product lookup by id (product identifiers are never returned; use `search_products`) and compatible-accessory queries.

## Requirements

Node.js 20 or newer.

## Installation and usage

```bash
npx -y vaper-club-mcp            # run without installing
npm install -g vaper-club-mcp    # or install globally
vaper-club-mcp
```

The server speaks MCP on stdin/stdout and writes diagnostics to stderr only.

## Configuration

| Variable                  | Default                                 | Description                                                                                                |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `VAPER_CLUB_API_BASE_URL` | `https://api.vaper.club/public-api/v1/` | Public API base URL                                                                                        |
| `VAPER_CLUB_API_KEY`      | _unset_                                 | Optional. The public API needs no key; if set it is sent as `Authorization: Bearer <key>` and never logged |
| `VAPER_CLUB_API_TIMEOUT`  | `15`                                    | Request timeout in seconds                                                                                 |

## Client configuration

Configuration formats differ between clients. Replace `env` as needed; it is optional.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vaper-club": {
      "command": "npx",
      "args": ["-y", "vaper-club-mcp"],
      "env": { "VAPER_CLUB_API_BASE_URL": "https://api.vaper.club/public-api/v1/" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add vaper-club -- npx -y vaper-club-mcp
```

### Cursor

Add the same `mcpServers` JSON as Claude Desktop to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global).

### VS Code

VS Code uses `servers` instead of `mcpServers`. Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "vaper-club": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "vaper-club-mcp"]
    }
  }
}
```

### Codex

Codex uses TOML. Add to `~/.codex/config.toml`:

```toml
[mcp_servers.vaper-club]
command = "npx"
args = ["-y", "vaper-club-mcp"]
```

### Direct connection to the hosted MCP server

The configurations above launch this local TypeScript adapter. To connect directly to Vaper.club's hosted MCP service instead (no local process), use a client that supports remote Streamable HTTP servers:

```json
{
  "mcpServers": {
    "vaper-club": {
      "url": "https://api.vaper.club/mcp/"
    }
  }
}
```

The key for remote servers varies by client (for example `servers` with `"type": "http"` in VS Code); check your client's documentation.

## Development and testing

```bash
cd mcp-server
npm ci
npm run build
npm test        # builds, then runs tests against mocked HTTP; no production API calls
npm run lint    # prettier check
```

The tests also launch the compiled CLI and talk to it over STDIO against a local mock API.

## License

[MIT](LICENSE). This license does not cover Vaper.club trademarks or data accessed through Vaper.club services; use of the API is subject to Vaper.club terms. Vaper.club is intended for adults only.

## Links

- Website: <https://vaper.club>
- MCP endpoint: <https://api.vaper.club/mcp/>
- Public API: <https://api.vaper.club/public-api/v1/>
- GitHub: <https://github.com/VaperClub/vaper-club-agent>
- Registry manifest: [../mcp/server.json](../mcp/server.json)

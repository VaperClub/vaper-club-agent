<!-- mcp-name: club.vaper/vaper-club -->

# Vaper.club MCP Server (Python, local STDIO adapter)

`vaper-club-mcp` is a lightweight [Model Context Protocol](https://modelcontextprotocol.io) server that runs locally over STDIO and forwards every tool call to the [Vaper.club Public API](https://api.vaper.club/public-api/v1/). It is functionally identical to the [npm package](https://www.npmjs.com/package/vaper-club-mcp) of the same name.

Vaper.club also runs a hosted MCP server at <https://api.vaper.club/mcp/>.

## Tools

All tools are read-only and return the unmodified Public API response. Cite the `sourceUrl` of each result.

`search_products`, `compare_products`, `get_product_reviews`, `search_brands`, `get_brand_details`, `get_product_categories`, `get_latest_posts`, `search_posts`, `search_shops`, `get_shop_details`.

## Installation and usage

Requires Python 3.10 or newer.

```bash
uvx vaper-club-mcp
# or
pip install vaper-club-mcp && vaper-club-mcp
```

MCP client configuration:

```json
{
  "mcpServers": {
    "vaper-club": {
      "command": "uvx",
      "args": ["vaper-club-mcp"]
    }
  }
}
```

## Configuration

| Variable                  | Default                                  | Description                       |
| ------------------------- | ---------------------------------------- | --------------------------------- |
| `VAPER_CLUB_API_BASE_URL` | `https://api.vaper.club/public-api/v1/`  | Public API base URL               |
| `VAPER_CLUB_API_TIMEOUT`  | `15`                                     | Request timeout in seconds (0–300) |
| `VAPER_CLUB_API_KEY`      | _(none)_                                 | Optional bearer token             |

## Development and publishing

```bash
pip install -e ".[dev]"
pytest
python -m build
twine upload dist/*   # username: __token__, password: your PyPI API token
```

Releases are published by the `publish-pypi` GitHub workflow on tags named `mcp-server-python-v<version>` (PyPI Trusted Publishing). Keep `version` in `pyproject.toml` and `src/vaper_club_mcp/__init__.py` in sync.

Prices and stock may lag the shop websites. The data is for adults only.

## License

MIT

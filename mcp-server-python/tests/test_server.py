import httpx
import pytest

from vaper_club_mcp.api_client import ApiError, VaperClubApiClient
from vaper_club_mcp.config import DEFAULT_API_BASE_URL, Config, load_config
from vaper_club_mcp.server import create_server


def make_client(handler) -> VaperClubApiClient:
    config = Config(api_base_url=DEFAULT_API_BASE_URL, timeout_seconds=5)
    return VaperClubApiClient(config, transport=httpx.MockTransport(handler))


def test_load_config_defaults_and_validation():
    config = load_config({})
    assert config.api_base_url == DEFAULT_API_BASE_URL
    assert config.timeout_seconds == 15
    assert load_config({"VAPER_CLUB_API_BASE_URL": "http://x.test/api"}).api_base_url == "http://x.test/api/"
    with pytest.raises(ValueError):
        load_config({"VAPER_CLUB_API_BASE_URL": "ftp://x"})
    with pytest.raises(ValueError):
        load_config({"VAPER_CLUB_API_TIMEOUT": "0"})


async def test_get_sends_trimmed_query_and_skips_empty():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        return httpx.Response(200, json={"success": True})

    body = await make_client(handler).get("products/search", {"q": " pod ", "page": 2, "shop": "", "x": None})
    assert body == {"success": True}
    assert seen["url"] == DEFAULT_API_BASE_URL + "products/search?q=pod&page=2"


async def test_get_rejects_unsafe_path():
    with pytest.raises(ApiError):
        await make_client(lambda r: httpx.Response(200, json={})).get("../secret")


async def test_get_maps_api_errors():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"error": {"code": "NOT_FOUND", "message": "Brand x."}})

    with pytest.raises(ApiError) as info:
        await make_client(handler).get("brands/details")
    assert info.value.status == 404
    assert str(info.value).startswith("No matching public record was found.")


async def test_server_registers_tools_and_validates_filters():
    server = create_server(make_client(lambda r: httpx.Response(200, json={"success": True})))
    names = {t.name for t in await server.list_tools()}
    assert names == {
        "search_products",
        "compare_products",
        "get_product_reviews",
        "search_brands",
        "get_brand_details",
        "get_product_categories",
        "get_latest_posts",
        "search_posts",
        "search_shops",
        "get_shop_details",
    }
    with pytest.raises(Exception, match="at least one of query or country"):
        await server.call_tool("search_shops", {})

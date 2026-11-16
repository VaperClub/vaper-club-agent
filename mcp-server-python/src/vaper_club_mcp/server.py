import sys
from typing import Annotated, Any, Literal

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import Field

from . import __version__
from .api_client import ApiError, VaperClubApiClient
from .config import load_config

Language = Annotated[
    str | None,
    Field(max_length=16, description="Language code such as en or de. Defaults to the site default language."),
]
Page = Annotated[int | None, Field(ge=1, description="Page number, starting at 1.")]
PageSize = Annotated[int | None, Field(ge=1, le=20, description="Results per page, 1-20 (default 10).")]
Query = Annotated[
    str,
    Field(min_length=1, max_length=200, description="Search keywords, for example a product, model or flavor name."),
]
Text = Annotated[str | None, Field(max_length=200)]
Country = Annotated[
    str | None, Field(max_length=2, description="ISO 3166-1 alpha-2 country code.")
]
Date = Annotated[str | None, Field(max_length=40, description="ISO 8601 date.")]

READ_ONLY = ToolAnnotations(readOnlyHint=True, idempotentHint=True, openWorldHint=True)


def _has_any(*values: Any) -> bool:
    return any((v.strip() != "" if isinstance(v, str) else v is not None) for v in values)


def _product_query(
    query, brand_name, model_name, category_name, country, shop, language
) -> dict[str, Any]:
    return {
        "q": query,
        "brandName": brand_name,
        "modelName": model_name,
        "categoryName": category_name,
        "country": country,
        "shop": shop,
        "language": language,
    }


def create_server(client: VaperClubApiClient) -> FastMCP:
    server = FastMCP(
        "vaper-club",
        instructions=(
            "Search vape products, brands, models, specifications and compatible accessories "
            "using Vaper.club's structured product database."
        ),
        website_url="https://vaper.club",
    )

    async def call(path: str, query: dict[str, Any]) -> dict[str, Any]:
        """Calls the API and returns the untouched response."""
        try:
            return await client.get(path, query)
        except ApiError as error:
            raise ToolError(str(error)) from None
        except Exception:
            raise ToolError("Unexpected error while calling the Vaper.club API.") from None

    def tool(title: str, description: str):
        return server.tool(title=title, description=description, annotations=READ_ONLY)

    @tool(
        "Search products",
        "Search vape product offers from retail shops. Each result is one shop's offer with brand, model, "
        "category, price, stock status, variants, ratings and a sourceUrl on Vaper.club. Cite sourceUrl when "
        "using the data. Missing fields mean unknown, not zero.",
    )
    async def search_products(
        query: Query,
        brand_name: Text = None,
        model_name: Text = None,
        category_name: Text = None,
        country: Country = None,
        shop: Text = None,
        language: Language = None,
        sort_by: Literal["relevance", "latest", "rating", "reviews", "price_asc", "price_desc"] | None = None,
        page: Page = None,
        page_size: PageSize = None,
    ) -> dict[str, Any]:
        return await call(
            "products/search",
            {
                **_product_query(query, brand_name, model_name, category_name, country, shop, language),
                "sortBy": sort_by,
                "page": page,
                "pageSize": page_size,
            },
        )

    @tool(
        "Compare product offers",
        "Compare offers of the best-matching product model across shops, cheapest first. "
        "Use it for price and stock comparison of one model.",
    )
    async def compare_products(
        query: Query,
        brand_name: Text = None,
        model_name: Text = None,
        category_name: Text = None,
        country: Country = None,
        shop: Text = None,
        language: Language = None,
        limit: Annotated[int | None, Field(ge=1, le=10, description="Maximum offers to return, 1-10.")] = None,
    ) -> dict[str, Any]:
        return await call(
            "products/compare",
            {
                **_product_query(query, brand_name, model_name, category_name, country, shop, language),
                "limit": limit,
            },
        )

    @tool(
        "Get product reviews",
        "Get the review summary (all reviews) and the newest or most helpful user reviews of the "
        "best-matching product.",
    )
    async def get_product_reviews(
        query: Query,
        brand_name: Text = None,
        model_name: Text = None,
        category_name: Text = None,
        country: Country = None,
        shop: Text = None,
        language: Language = None,
        limit: Annotated[
            int | None, Field(ge=1, le=20, description="Maximum reviews to return, 1-20 (default 10).")
        ] = None,
        sort_by: Literal["latest", "helpful"] | None = None,
    ) -> dict[str, Any]:
        return await call(
            "products/reviews",
            {
                **_product_query(query, brand_name, model_name, category_name, country, shop, language),
                "limit": limit,
                "sortBy": sort_by,
            },
        )

    @tool(
        "Search brands",
        "Search vape brands by name keywords or by category name. "
        "At least one of query or category_name is required.",
    )
    async def search_brands(
        query: Text = None,
        category_name: Text = None,
        language: Language = None,
        page: Page = None,
        page_size: PageSize = None,
    ) -> dict[str, Any]:
        if not _has_any(query, category_name):
            raise ToolError("Provide at least one of query or category_name.")
        return await call(
            "brands/search",
            {
                "q": query,
                "categoryName": category_name,
                "language": language,
                "page": page,
                "pageSize": page_size,
            },
        )

    @tool(
        "Get brand details",
        "Get a brand profile: description, official website, aliases, categories and models. "
        "Identify the brand by brand_id, slug or brand_name (at least one).",
    )
    async def get_brand_details(
        brand_id: Annotated[int | None, Field(ge=1, description="Numeric brand id from a previous result.")] = None,
        slug: Text = None,
        brand_name: Text = None,
        language: Language = None,
    ) -> dict[str, Any]:
        if not _has_any(brand_id, slug, brand_name):
            raise ToolError("Provide at least one of brand_id, slug or brand_name.")
        return await call(
            "brands/details",
            {"brandId": brand_id, "slug": slug, "brandName": brand_name, "language": language},
        )

    @tool(
        "Get product categories",
        "List the product categories supported by Vaper.club. "
        "Use the names as category or category_name filters in other tools.",
    )
    async def get_product_categories(language: Language = None) -> dict[str, Any]:
        return await call("site/categories", {"language": language})

    @tool("Get latest posts", "Get the latest Vaper.club posts (news, reviews, guides) as summaries.")
    async def get_latest_posts(
        limit: Annotated[int | None, Field(ge=1, le=50, description="Number of posts, 1-50.")] = None,
        category: Text = None,
        since: Annotated[
            str | None,
            Field(max_length=40, description="Only posts published after this date (ISO 8601)."),
        ] = None,
        language: Language = None,
    ) -> dict[str, Any]:
        return await call(
            "posts/latest",
            {"limit": limit, "category": category, "since": since, "language": language},
        )

    @tool("Search posts", "Keyword search over Vaper.club posts (articles and videos).")
    async def search_posts(
        query: Annotated[str, Field(min_length=1, max_length=200, description="Search keywords.")],
        category: Text = None,
        type: Literal["article", "video"] | None = None,
        sort_by: Literal["relevance", "latest"] | None = None,
        start_date: Date = None,
        end_date: Date = None,
        language: Language = None,
        page: Page = None,
        page_size: PageSize = None,
    ) -> dict[str, Any]:
        return await call(
            "posts/search",
            {
                "q": query,
                "category": category,
                "type": type,
                "sortBy": sort_by,
                "startDate": start_date,
                "endDate": end_date,
                "language": language,
                "page": page,
                "pageSize": page_size,
            },
        )

    @tool(
        "Search shops",
        "Search retail shops by name keywords or country. At least one of query or country is required.",
    )
    async def search_shops(
        query: Text = None,
        country: Country = None,
        language: Language = None,
        page: Page = None,
        page_size: PageSize = None,
    ) -> dict[str, Any]:
        if not _has_any(query, country):
            raise ToolError("Provide at least one of query or country.")
        return await call(
            "shops/search",
            {"q": query, "country": country, "language": language, "page": page, "pageSize": page_size},
        )

    @tool(
        "Get shop details",
        "Get a shop profile: locations, main brands and categories. "
        "Identify the shop by shop_id, slug or shop_name (at least one).",
    )
    async def get_shop_details(
        shop_id: Annotated[int | None, Field(ge=1, description="Numeric shop id from a previous result.")] = None,
        slug: Text = None,
        shop_name: Text = None,
        language: Language = None,
    ) -> dict[str, Any]:
        if not _has_any(shop_id, slug, shop_name):
            raise ToolError("Provide at least one of shop_id, slug or shop_name.")
        return await call(
            "shops/details",
            {"shopId": shop_id, "slug": slug, "shopName": shop_name, "language": language},
        )

    return server


def main() -> None:
    # stdout carries the MCP protocol; diagnostics go to stderr only.
    try:
        client = VaperClubApiClient(load_config())
    except ValueError as error:
        print(f"[vaper-club-mcp] {error}", file=sys.stderr)
        sys.exit(1)
    print(f"[vaper-club-mcp] {__version__} running on stdio", file=sys.stderr)
    create_server(client).run(transport="stdio")


if __name__ == "__main__":
    main()

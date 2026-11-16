import re
from typing import Any
from urllib.parse import urljoin

import httpx

from . import __version__
from .config import Config

SAFE_PATH = re.compile(r"^[a-z0-9][a-z0-9/_-]*$", re.IGNORECASE)

SAFE_MESSAGES = {
    "INVALID_PARAMETER": "The request parameters are invalid.",
    "MISSING_FILTER": "A required filter is missing.",
    "NOT_FOUND": "No matching public record was found.",
    "RATE_LIMITED": "Rate limit exceeded. Wait a moment and retry.",
    "TIMEOUT": "The Vaper.club API timed out. Narrow the query and retry.",
    "SYSTEM_ERROR": "The Vaper.club API reported an error. Retry later.",
}


class ApiError(Exception):
    """Error with a message that is safe to show to MCP clients."""

    def __init__(self, message: str, status: int | None = None, code: str | None = None):
        super().__init__(message)
        self.status = status
        self.code = code


class VaperClubApiClient:
    def __init__(self, config: Config, transport: httpx.AsyncBaseTransport | None = None):
        self._config = config
        self._transport = transport

    async def get(self, path: str, query: dict[str, Any] | None = None) -> dict[str, Any]:
        """Sends a GET request and returns the parsed JSON response unchanged."""
        if not SAFE_PATH.match(path) or ".." in path or "//" in path:
            raise ApiError("Invalid API path.")
        params = {}
        for key, value in (query or {}).items():
            if value is None:
                continue
            text = str(value).strip()
            if text:
                params[key] = text

        headers = {"Accept": "application/json", "User-Agent": f"vaper-club-mcp/{__version__}"}
        if self._config.api_key:
            headers["Authorization"] = f"Bearer {self._config.api_key}"

        url = urljoin(self._config.api_base_url, path)
        try:
            async with httpx.AsyncClient(
                timeout=self._config.timeout_seconds, transport=self._transport
            ) as http:
                response = await http.get(url, params=params, headers=headers)
        except httpx.TimeoutException:
            raise ApiError("The Vaper.club API request timed out.", code="TIMEOUT") from None
        except httpx.HTTPError:
            raise ApiError("Could not reach the Vaper.club API.", code="NETWORK_ERROR") from None

        try:
            body = response.json()
        except ValueError:
            body = None

        if not response.is_success:
            raise self._to_api_error(response.status_code, body)
        if not isinstance(body, dict):
            raise ApiError("The Vaper.club API returned an invalid JSON response.", response.status_code)
        return body

    @staticmethod
    def _to_api_error(status: int, body: Any) -> ApiError:
        error = body.get("error") if isinstance(body, dict) else None
        error = error if isinstance(error, dict) else {}
        code = error.get("code") if isinstance(error.get("code"), str) else None
        message = (code and SAFE_MESSAGES.get(code)) or f"The Vaper.club API returned HTTP {status}."
        # Validation messages come from the API and describe the caller's input only.
        if status in (400, 404) and isinstance(error.get("message"), str):
            message = f"{message} {error['message']}"[:500]
        return ApiError(message, status, code)

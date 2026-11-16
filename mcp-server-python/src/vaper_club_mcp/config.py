import os
from dataclasses import dataclass
from urllib.parse import urlparse

DEFAULT_API_BASE_URL = "https://api.vaper.club/public-api/v1/"
DEFAULT_TIMEOUT_SECONDS = 15.0


@dataclass(frozen=True)
class Config:
    api_base_url: str
    timeout_seconds: float
    api_key: str | None = None


def load_config(env: dict[str, str] | None = None) -> Config:
    """Builds the configuration from environment variables, rejecting invalid values early."""
    env = os.environ if env is None else env
    base_url = (env.get("VAPER_CLUB_API_BASE_URL") or "").strip() or DEFAULT_API_BASE_URL
    parsed = urlparse(base_url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("VAPER_CLUB_API_BASE_URL must be a valid http or https URL.")
    # A trailing slash keeps relative endpoint paths under the base path.
    api_base_url = base_url if base_url.endswith("/") else base_url + "/"

    timeout = DEFAULT_TIMEOUT_SECONDS
    raw_timeout = (env.get("VAPER_CLUB_API_TIMEOUT") or "").strip()
    if raw_timeout:
        try:
            timeout = float(raw_timeout)
        except ValueError:
            timeout = 0
        if not 0 < timeout <= 300:
            raise ValueError("VAPER_CLUB_API_TIMEOUT must be a number of seconds between 0 and 300.")

    api_key = (env.get("VAPER_CLUB_API_KEY") or "").strip() or None
    return Config(api_base_url=api_base_url, timeout_seconds=timeout, api_key=api_key)

"""Command line entry point for the gateway service."""
from __future__ import annotations

import uvicorn

from .app import create_app
from .settings import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        create_app(settings),
        host=settings.host,
        port=settings.port,
        reload=False,
    )


if __name__ == "__main__":
    main()

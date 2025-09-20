"""Command line entrypoint for the gateway service."""
from __future__ import annotations

import argparse
import logging
import sys
from typing import Sequence

from .settings import load_settings

logger = logging.getLogger("gateway")


def _configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def main(argv: Sequence[str] | None = None) -> int:
    """Run the gateway service."""

    parser = argparse.ArgumentParser(description="Gateway service entrypoint")
    parser.add_argument(
        "--log-level",
        default="INFO",
        help="Python logging level (default: INFO)",
    )
    parser.add_argument(
        "--dry-run",
        dest="dry_run",
        action="store_true",
        help="Force dry-run mode regardless of environment configuration",
    )
    parser.add_argument(
        "--execute",
        dest="dry_run",
        action="store_false",
        help="Disable dry-run mode regardless of environment configuration",
    )
    parser.set_defaults(dry_run=None)

    args = parser.parse_args(argv)
    _configure_logging(args.log_level)

    try:
        settings = load_settings()
    except Exception as exc:  # pragma: no cover - surfaced to CLI
        logger.error("Failed to load settings: %s", exc)
        return 2

    if args.dry_run is not None:
        settings = settings.with_overrides(dry_run=args.dry_run)

    logger.info(
        "Gateway starting (dry_run=%s, input_path=%s, output_path=%s, api_url=%s)",
        settings.dry_run,
        settings.input_path,
        settings.output_path,
        settings.api_url,
    )

    # Placeholder for the actual gateway workflow.  Keeping the placeholder
    # allows the service to be deployed immediately with logging in place and a
    # clear location for future business logic.
    logger.info("Gateway service is ready")

    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    sys.exit(main())

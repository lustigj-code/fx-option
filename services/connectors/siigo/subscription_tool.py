"""Command line tool for managing Siigo webhook subscriptions."""
from __future__ import annotations

import argparse
import json
import sys
from typing import Iterable

from .config import SiigoEnvironment
from .exceptions import AuthenticationError, SubscriptionError
from .subscription import SiigoCredentials, SiigoWebhookSubscription


def parse_events(value: str) -> Iterable[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Siigo webhook subscription tool")
    parser.add_argument("url", help="Webhook target URL that will receive Siigo events")
    parser.add_argument("events", help="Comma separated list of Siigo event identifiers", type=parse_events)
    parser.add_argument("username", help="Siigo username")
    parser.add_argument("access_key", help="Siigo access key (API key)")
    parser.add_argument("client_id", help="OAuth client id")
    parser.add_argument("client_secret", help="OAuth client secret")
    parser.add_argument("--environment", default="sandbox", help="Target environment (default: sandbox)")
    parser.add_argument("--description", help="Optional subscription description")
    parser.add_argument(
        "--header",
        action="append",
        metavar="KEY=VALUE",
        help="Additional header to include when Siigo calls the webhook",
    )
    parser.add_argument(
        "--sandbox-url",
        help="Override the sandbox base URL. Useful for testing against a local sandbox server.",
    )
    return parser


def parse_headers(items: Iterable[str] | None) -> dict[str, str] | None:
    if not items:
        return None
    headers = {}
    for item in items:
        if "=" not in item:
            raise ValueError(f"Invalid header format: {item}. Expected KEY=VALUE")
        key, value = item.split("=", 1)
        headers[key.strip()] = value.strip()
    return headers


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    credentials = SiigoCredentials(
        username=args.username,
        access_key=args.access_key,
        client_id=args.client_id,
        client_secret=args.client_secret,
    )

    environment: str | SiigoEnvironment = args.environment
    if args.sandbox_url:
        environment = SiigoEnvironment(
            name=args.environment,
            base_url=args.sandbox_url,
        )

    client = SiigoWebhookSubscription(credentials, environment=environment)
    headers = parse_headers(args.header)
    try:
        subscription = client.create_subscription(
            target_url=args.url,
            events=args.events,
            headers=headers,
            description=args.description,
        )
    except (AuthenticationError, SubscriptionError, ValueError) as exc:
        parser.error(str(exc))
        return 2

    json.dump(subscription, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entrypoint
    raise SystemExit(main())

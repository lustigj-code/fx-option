#!/usr/bin/env python3
"""Verify Docker Compose setup and service health."""
import sys
import time
from typing import Tuple

import httpx


def check_service(name: str, url: str, timeout: int = 30) -> Tuple[bool, str]:
    """Check if a service is healthy.

    Args:
        name: Service name for display
        url: Health check URL
        timeout: Maximum time to wait in seconds

    Returns:
        Tuple of (success, message)
    """
    print(f"Checking {name}...", end=" ", flush=True)

    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = httpx.get(url, timeout=2.0)
            if response.status_code == 200:
                print("✓ healthy")
                return True, "healthy"
        except (httpx.RequestError, httpx.TimeoutException):
            time.sleep(1)
            continue

    elapsed = int(time.time() - start_time)
    print(f"✗ timeout after {elapsed}s")
    return False, f"timeout after {elapsed}s"


def main():
    """Run all service health checks."""
    print("=" * 60)
    print("FX Option Platform - Setup Verification")
    print("=" * 60)
    print()

    services = [
        ("Gateway API", "http://localhost:8000/health"),
        ("Gateway Readiness", "http://localhost:8000/readiness"),
        ("Gateway Metrics", "http://localhost:8000/metrics"),
        ("Prometheus", "http://localhost:9090/-/healthy"),
        ("Grafana", "http://localhost:3002/api/health"),
    ]

    results = []
    for service_name, url in services:
        success, message = check_service(service_name, url)
        results.append((service_name, success, message))

    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)

    all_healthy = True
    for service_name, success, message in results:
        status = "✓" if success else "✗"
        print(f"{status} {service_name:.<40} {message}")
        if not success:
            all_healthy = False

    print()

    if all_healthy:
        print("✓ All services are healthy!")
        print()
        print("Access the applications:")
        print("  Portal (frontend):    http://localhost:3000")
        print("  Admin (dashboard):    http://localhost:3001")
        print("  Gateway API:          http://localhost:8000")
        print("  API Documentation:    http://localhost:8000/docs")
        print("  Grafana (monitoring): http://localhost:3002")
        print("  Prometheus:           http://localhost:9090")
        print()
        print("Next steps:")
        print("  1. Run database migrations: make migrate")
        print("  2. Create a test user via API docs")
        print("  3. Generate a quote and test the workflow")
        return 0
    else:
        print("✗ Some services are not healthy")
        print()
        print("Troubleshooting:")
        print("  1. Check if Docker Compose is running: docker-compose ps")
        print("  2. View logs: make logs")
        print("  3. Restart services: make restart")
        return 1


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required to run the dev servers" >&2
  exit 1
fi

python3 -m venv .venv >/dev/null 2>&1 || true
source .venv/bin/activate
pip install -r requirements.txt >/dev/null

API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8000}

trap 'jobs -p | xargs -r kill' INT TERM EXIT

env NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" pnpm --filter portal-web dev -- --hostname 0.0.0.0 &
PORTAL_PID=$!

env ADMIN_API_BASE_URL="$API_BASE_URL" pnpm --filter admin dev -- --hostname 0.0.0.0 &
ADMIN_PID=$!

wait $PORTAL_PID $ADMIN_PID

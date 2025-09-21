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

uvicorn services.gateway.app:app --reload --host 127.0.0.1 --port 8000 &
GATEWAY_PID=$!

(
  cd apps/portal-web
  env NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" HOST=0.0.0.0 PORT=3000 pnpm dev
) &
PORTAL_PID=$!

(
  cd apps/admin
  env ADMIN_API_BASE_URL="$API_BASE_URL" HOST=0.0.0.0 PORT=3001 pnpm dev
) &
ADMIN_PID=$!

wait $GATEWAY_PID $PORTAL_PID $ADMIN_PID

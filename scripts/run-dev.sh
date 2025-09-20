#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is required but was not found in PATH." >&2
  echo "Install pnpm from https://pnpm.io/installation and re-run this script." >&2
  exit 1
fi

cd "$REPO_ROOT"

if [ ! -f "pnpm-lock.yaml" ]; then
  echo "Warning: pnpm-lock.yaml not found. Have you run 'pnpm install'?" >&2
fi

PNPM_EXECUTABLE="pnpm"

# shellcheck disable=SC2086
$PNPM_EXECUTABLE dlx concurrently \
  --kill-others-on-fail \
  --names "gateway,portal,admin" \
  --prefix-colors "cyan.bold,magenta.bold,green.bold" \
  "pnpm --filter gateway dev" \
  "pnpm --filter portal-web dev" \
  "pnpm --filter admin dev"

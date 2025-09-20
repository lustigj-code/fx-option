#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COMMANDS=(
  "pnpm --filter gateway dev"
  "pnpm --filter portal-web dev"
  "pnpm --filter admin dev"
)

PIDS=()

cleanup() {
  local exit_code=$?
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait >/dev/null 2>&1 || true
  return $exit_code
}

trap cleanup EXIT INT TERM

for cmd in "${COMMANDS[@]}"; do
  (
    cd "$ROOT_DIR"
    echo "Starting $cmd"
    eval "$cmd"
  ) &
  PIDS+=("$!")
  sleep 1
done

# Wait for first process to exit and propagate status
status=0
for pid in "${PIDS[@]}"; do
  if wait "$pid"; then
    continue
  else
    status=$?
    echo "Process $pid exited with status $status" >&2
    break
  fi
done

if [ $status -ne 0 ]; then
  echo "Stopping remaining services..." >&2
  cleanup
fi

exit $status

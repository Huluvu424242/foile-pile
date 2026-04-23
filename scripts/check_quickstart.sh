#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${QUICKSTART_PORT:-8015}"

if [[ ! -f "$ROOT_DIR/projects/foile-pile/index.html" ]]; then
  echo "Expected entrypoint projects/foile-pile/index.html not found" >&2
  exit 1
fi

python3 -m http.server "$PORT" --directory "$ROOT_DIR" >/tmp/foile-pile-http.log 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

for _ in {1..20}; do
  if curl -fsS "http://127.0.0.1:${PORT}/projects/foile-pile/index.html" >/dev/null; then
    echo "Quickstart smoke test passed (served projects/foile-pile/index.html)."
    exit 0
  fi
  sleep 0.5
done

echo "Quickstart smoke test failed; http.server did not become reachable in time." >&2
if [[ -f /tmp/foile-pile-http.log ]]; then
  echo "--- http.server log ---" >&2
  cat /tmp/foile-pile-http.log >&2
fi
exit 1

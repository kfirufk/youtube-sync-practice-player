#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT/api"
CONFIG="$API_DIR/config.yaml"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo
    echo "Stopping Go server (PID $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

if ! command -v go >/dev/null 2>&1; then
  echo "Go is not installed or not on PATH."
  echo "Install Go, then run this script again."
  exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
  cp "$API_DIR/config.example.yaml" "$CONFIG"
  echo "Created $CONFIG from api/config.example.yaml."
  echo "Update the database credentials, then run the script again."
  exit 1
fi

(
  cd "$API_DIR"
  go run . -config "$CONFIG"
) &
SERVER_PID=$!

sleep 2
if command -v open >/dev/null 2>&1; then
  open "http://localhost:8028/"
fi

echo "Go server running at http://localhost:8028 (PID $SERVER_PID)"
echo "SQL patches in api/db/patches/ are applied automatically on startup."
echo "Press Ctrl-C to stop."
wait "$SERVER_PID"

#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    echo
    echo "Stopping Python server (PID $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

cd "$ROOT"
python3 -m http.server 8028 &
SERVER_PID=$!

sleep 1
open "http://localhost:8028/index.html"

echo "Server running at http://localhost:8028 (PID $SERVER_PID)"
echo "Press Ctrl-C to stop."
wait "$SERVER_PID"

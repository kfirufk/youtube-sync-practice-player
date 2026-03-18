#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$ROOT/config.yaml"
SERVER_PID=""
CLIENT_PID=""

read_config_value() {
  local key="$1"
  awk -F': *' -v target="$key" '
    /^[[:space:]]*#/ { next }
    /^[^[:space:]]/ {
      section=$1
      sub(/:.*/, "", section)
      next
    }
    /^[[:space:]]+[A-Za-z0-9_]+:/ {
      field=$1
      sub(/:.*/, "", field)
      gsub(/^[[:space:]]+/, "", field)
      if (section "." field == target) {
        value=$2
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
        gsub(/^"|"$/, "", value)
        print value
        exit
      }
    }
  ' "$CONFIG"
}

cleanup() {
  if [[ -n "${CLIENT_PID:-}" ]] && kill -0 "$CLIENT_PID" 2>/dev/null; then
    echo
    echo "Stopping client dev server (PID $CLIENT_PID)..."
    kill "$CLIENT_PID" 2>/dev/null || true
    wait "$CLIENT_PID" 2>/dev/null || true
  fi

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
  cp "$ROOT/config.example.yaml" "$CONFIG"
  echo "Created $CONFIG from config.example.yaml."
  echo "Update the database credentials, then run the script again."
  exit 1
fi

SERVER_HOST="$(read_config_value "server.host")"
SERVER_PORT="$(read_config_value "server.port")"
SERVER_HOST="${SERVER_HOST:-0.0.0.0}"
SERVER_PORT="${SERVER_PORT:-8028}"

BROWSER_HOST="$SERVER_HOST"
if [[ "$BROWSER_HOST" == "0.0.0.0" || "$BROWSER_HOST" == "::" || -z "$BROWSER_HOST" ]]; then
  BROWSER_HOST="localhost"
fi

APP_URL="http://${BROWSER_HOST}:${SERVER_PORT}/"

cd "$ROOT"

if [[ -f "$ROOT/package.json" ]] && command -v npm >/dev/null 2>&1; then
  echo "Detected package.json. Starting client dev server with npm run dev..."
  npm run dev &
  CLIENT_PID=$!
else
  echo "No separate frontend dev server detected. The Go server will serve the client directly."
fi

echo "Starting Go server..."
go run . -config "$CONFIG" &
SERVER_PID=$!

echo "Waiting for $APP_URL to respond..."
for _ in $(seq 1 60); do
  if curl -fsS "$APP_URL/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "$APP_URL/api/health" >/dev/null 2>&1; then
  echo "The server did not become ready in time."
  exit 1
fi

if command -v open >/dev/null 2>&1; then
  open "$APP_URL"
fi

echo "Development server is running at $APP_URL"
echo "Any new SQL patch in db/patches/ will be applied automatically on startup."
echo "Press Ctrl-C to stop."

wait "$SERVER_PID"

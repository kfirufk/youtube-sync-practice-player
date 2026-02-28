#!/bin/bash
set -e  # Stop on error

# Get the directory of this script
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Python HTTP server in background
cd "$ROOT"
python3 -m http.server 8028 &

# Save PID (optional, useful if you want to stop it later)
SERVER_PID=$!

# Wait 1 second
sleep 1

# Open default browser
open "http://localhost:8028/index.html"

# Optional: wait so script doesn't exit immediately
# wait $SERVER_PID

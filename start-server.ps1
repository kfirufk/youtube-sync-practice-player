$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start the Python HTTP server in this folder
Start-Process -FilePath "python" -ArgumentList "-m", "http.server", "8000" -WorkingDirectory $root

Start-Sleep -Seconds 1

# Open default browser to index.html
Start-Process "http://localhost:8000/index.html"

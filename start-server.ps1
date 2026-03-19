$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $root "api"
$config = Join-Path $apiDir "config.yaml"

if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
  Write-Error "Go is not installed or not on PATH."
}

if (-not (Test-Path $config)) {
  Copy-Item (Join-Path $apiDir "config.example.yaml") $config
  Write-Host "Created api/config.yaml from api/config.example.yaml."
  Write-Host "Update the database credentials, then run the script again."
  exit 1
}

Start-Process -FilePath "go" -ArgumentList "run", ".", "-config", $config -WorkingDirectory $apiDir

Start-Sleep -Seconds 2

Start-Process "http://localhost:8028/"

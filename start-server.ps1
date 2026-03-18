$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$config = Join-Path $root "config.yaml"

if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
  Write-Error "Go is not installed or not on PATH."
}

if (-not (Test-Path $config)) {
  Copy-Item (Join-Path $root "config.example.yaml") $config
  Write-Host "Created config.yaml from config.example.yaml."
  Write-Host "Update the database credentials, then run the script again."
  exit 1
}

Start-Process -FilePath "go" -ArgumentList "run", ".", "-config", $config -WorkingDirectory $root

Start-Sleep -Seconds 2

Start-Process "http://localhost:8028/"

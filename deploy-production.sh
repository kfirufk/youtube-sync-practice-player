#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT/api"
CLIENT_DIR="$ROOT/client"
CONFIG_PATH="$API_DIR/config.yaml"
BINARY_PATH="$API_DIR/youtube-sync-practice-player"
CLIENT_TARGET_DIR="/var/www/sync.tvguitar.com"
SERVICE_NAME="sync-tvguitar.service"
SERVICE_USER="ufk"
SERVICE_GROUP="ufk"
SERVICE_HOME="/home/ufk"
SERVER_HOST="127.0.0.1"
SERVER_PORT="8028"
NGINX_SERVER_NAME="sync.tvguitar.com"
NGINX_CONF_PATH="/etc/nginx/sites-available/${NGINX_SERVER_NAME}.conf"

usage() {
  cat <<EOF
Usage: ./deploy-production.sh [options]

Options:
  --config PATH         Config file path
  --binary PATH         Output binary path
  --client-dir PATH     Target directory for static client files
  --service NAME        systemd service name
  --user NAME           systemd service user
  --group NAME          systemd service group
  --home PATH           Home directory for the service user
  --host HOST           Backend bind host used in nginx example
  --port PORT           Backend port used in nginx example
  --domain NAME         Server name for nginx
  --nginx-conf PATH     Nginx config file path shown in the example
  --help                Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)
      CONFIG_PATH="$2"
      shift 2
      ;;
    --binary)
      BINARY_PATH="$2"
      shift 2
      ;;
    --client-dir)
      CLIENT_TARGET_DIR="$2"
      shift 2
      ;;
    --service)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --user)
      SERVICE_USER="$2"
      shift 2
      ;;
    --group)
      SERVICE_GROUP="$2"
      shift 2
      ;;
    --home)
      SERVICE_HOME="$2"
      shift 2
      ;;
    --host)
      SERVER_HOST="$2"
      shift 2
      ;;
    --port)
      SERVER_PORT="$2"
      shift 2
      ;;
    --domain)
      NGINX_SERVER_NAME="$2"
      NGINX_CONF_PATH="/etc/nginx/sites-available/${NGINX_SERVER_NAME}.conf"
      shift 2
      ;;
    --nginx-conf)
      NGINX_CONF_PATH="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

run_as_root() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name"
    exit 1
  fi
}

write_service_file() {
  local service_path="/etc/systemd/system/${SERVICE_NAME}"

  run_as_root mkdir -p "$(dirname "$service_path")"
  run_as_root tee "$service_path" >/dev/null <<EOF
[Unit]
Description=sync.tvguitar.com Go server
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_GROUP}
WorkingDirectory=${ROOT}/api
ExecStart=${BINARY_PATH} -config ${CONFIG_PATH}
Restart=always
RestartSec=5
Environment=HOME=${SERVICE_HOME}

[Install]
WantedBy=multi-user.target
EOF

  run_as_root systemctl daemon-reload
  run_as_root systemctl enable "${SERVICE_NAME}"
}

show_nginx_example() {
  cat <<EOF

Nginx example for ${NGINX_SERVER_NAME}
Save this as: ${NGINX_CONF_PATH}

server {
    server_name ${NGINX_SERVER_NAME};
    root ${CLIENT_TARGET_DIR};
    index index.html;

    location /api/ {
        proxy_pass http://${SERVER_HOST}:${SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

Then enable it with something like:
  sudo ln -sf ${NGINX_CONF_PATH} /etc/nginx/sites-enabled/${NGINX_SERVER_NAME}.conf
  sudo nginx -t
  sudo systemctl reload nginx

This setup serves the client from ${CLIENT_TARGET_DIR} and reverse-proxies /api/* to the Go server.
EOF
}

require_command git
require_command go
require_command rsync
require_command systemctl

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "Missing config file: ${CONFIG_PATH}"
  echo "Copy api/config.example.yaml to api/config.yaml and fill in the real values first."
  exit 1
fi

echo "Updating repository..."
git -C "${ROOT}" pull --ff-only

echo "Building Go server..."
(
  cd "${API_DIR}"
  go build -o "${BINARY_PATH}" .
)

echo "Syncing client files to ${CLIENT_TARGET_DIR}..."
run_as_root mkdir -p "${CLIENT_TARGET_DIR}"
run_as_root rsync -av --delete "${CLIENT_DIR}/" "${CLIENT_TARGET_DIR}/"

SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"
if run_as_root test -f "${SERVICE_PATH}"; then
  echo "Restarting existing ${SERVICE_NAME}..."
  run_as_root systemctl restart "${SERVICE_NAME}"
else
  echo "Creating ${SERVICE_NAME}..."
  write_service_file
  run_as_root systemctl restart "${SERVICE_NAME}"
fi

echo
echo "Deployment complete."
echo "Binary: ${BINARY_PATH}"
echo "Config: ${CONFIG_PATH}"
echo "Client root: ${CLIENT_TARGET_DIR}"
echo "Service: ${SERVICE_NAME}"
echo
echo "Service status:"
run_as_root systemctl status "${SERVICE_NAME}" --no-pager || true

show_nginx_example

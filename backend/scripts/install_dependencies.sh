#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ec2-user/cat-health-interface/backend

cd "$APP_DIR"

echo "Installing dependencies..."
if ! command -v uv >/dev/null 2>&1; then
  echo "Error: uv not found in PATH. Ensure BeforeInstall runs ensure_uv.sh." >&2
  exit 1
fi

uv sync --frozen
echo "Dependencies installed."

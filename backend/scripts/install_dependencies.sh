#!/bin/bash
set -e

APP_DIR=/home/ec2-user/cat-health-interface/backend

cd "$APP_DIR"

echo "Installing dependencies..."
echo "Debug: whoami=$(whoami)"
echo "Debug: HOME=${HOME:-<unset>}"
echo "Debug: PATH=${PATH:-<unset>}"
echo "Debug: PWD=$(pwd)"
echo "Debug: listing /home/ec2-user/.local/bin"
ls -la /home/ec2-user/.local/bin || true
echo "Debug: command -v uv"
command -v uv || true
echo "Debug: direct check /home/ec2-user/.local/bin/uv"
ls -l /home/ec2-user/.local/bin/uv || true
uv sync --frozen
echo "Dependencies installed."

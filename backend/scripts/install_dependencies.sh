#!/bin/bash
set -e

APP_DIR=/home/ec2-user/cat-health-interface/backend

cd "$APP_DIR"

echo "Installing dependencies..."
uv sync --frozen
echo "Dependencies installed."

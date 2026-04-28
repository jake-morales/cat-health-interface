#!/usr/bin/env bash
set -euo pipefail

if command -v uv >/dev/null 2>&1; then
  echo "uv already installed: $(command -v uv)"
  exit 0
fi

echo "uv not found. Installing to /usr/local/bin..."
curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

if ! command -v uv >/dev/null 2>&1; then
  echo "Error: uv installation completed but uv is still not on PATH." >&2
  exit 1
fi

echo "uv installed: $(command -v uv)"

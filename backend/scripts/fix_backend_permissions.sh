#!/usr/bin/env bash
set -euo pipefail

# CodeDeploy resets the top-level destination directory's ownership to
# root:root on every deploy. The appspec `permissions` block only applies
# to files *within* an object, not the object directory itself, so we have
# to chown the tree ourselves before any ec2-user hook tries to write into
# it (e.g. `uv sync` creating `.venv`).
APP_DIR=/home/ec2-user/cat-health-interface

echo "Fixing ownership of $APP_DIR..."
chown -R ec2-user:ec2-user "$APP_DIR"
echo "Ownership fixed."

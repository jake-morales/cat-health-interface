#!/bin/bash
set -e

APP_DIR=/home/ec2-user/cat-health-interface/backend
PID_FILE="$APP_DIR/server.pid"
LOG_FILE="$APP_DIR/server.log"
export PATH="$HOME/.local/bin:$PATH"

# Boto3 / SSM need a region; override anytime via AWS_DEFAULT_REGION (e.g. launch template).
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-west-2}"

cd "$APP_DIR"

# Determine worker count: 2 * CPU cores + 1
WORKERS=$(( $(nproc) * 2 + 1 ))

echo "Starting server with $WORKERS workers..."
uv run gunicorn main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers "$WORKERS" \
    --bind 0.0.0.0:8000 \
    --pid "$PID_FILE" \
    --log-file "$LOG_FILE" \
    --daemon

echo "Server started (PID file: $PID_FILE)."

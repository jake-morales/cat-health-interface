#!/bin/bash
set -e

PID_FILE=/home/ec2-user/cat-health-interface/backend/server.pid

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping server (PID $PID)..."
        kill "$PID"
        # Wait up to 15 seconds for graceful shutdown
        for i in $(seq 1 15); do
            if ! kill -0 "$PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        # Force kill if still running
        kill -9 "$PID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
fi

# Catch any stray gunicorn processes for this app
pkill -f "gunicorn main:app" 2>/dev/null || true

echo "Server stopped."

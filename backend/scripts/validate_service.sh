#!/bin/bash
set -e

echo "Validating service..."

# Give the server a moment to fully bind
sleep 3

# Hit the health endpoint
curl --silent --fail --max-time 10 http://localhost:8000/health

echo "Service is healthy."

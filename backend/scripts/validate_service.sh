#!/bin/bash
# ValidateService hook for CodeDeploy. Exits non-zero if /health is not HTTP 200.

set -e

echo "Validating service..."

URL="http://127.0.0.1:8000/health"
# Per-attempt timeout (seconds). Short so the hook stays within CodeDeploy limits with many retries.
CURL_MAX_TIME=1

dump_diagnostics() {
  local reason=$1
  echo "" >&2
  echo "=== validate_service: failure diagnostics (${reason}) ===" >&2

  echo "--- listeners on 8000 ---" >&2
  if command -v ss >/dev/null 2>&1; then
    ss -tlnp 2>/dev/null | grep -E ':8000\b' || echo "(nothing listening on 8000)" >&2
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tlnp 2>/dev/null | grep -E ':8000\b' || echo "(nothing listening on 8000)" >&2
  else
    echo "(ss/netstat not available)" >&2
  fi

  echo "--- recent server log (last 80 lines) ---" >&2
  LOG="/home/ec2-user/cat-health-interface/backend/server.log"
  if [[ -f "$LOG" ]]; then
    tail -n 80 "$LOG" >&2
  else
    echo "(no log at $LOG)" >&2
  fi

  echo "--- gunicorn / app processes ---" >&2
  pgrep -af gunicorn 2>/dev/null || echo "(no gunicorn process)" >&2

  echo "--- health response body ---" >&2
  if [[ -n "$HEALTH_BODY" ]]; then
    printf '%s\n' "$HEALTH_BODY" >&2
  else
    echo "(empty or unavailable)" >&2
  fi
  echo "=== end diagnostics ===" >&2
}

# Brief settle time before polling (worker bind / import).
sleep 3

HEALTH_BODY=""
HTTP_CODE=""
LAST_HTTP_CODE=""
LAST_HEALTH_BODY=""
poll_end=20

for ((attempt = 1; attempt <= poll_end; attempt++)); do
  if RESPONSE=$(curl -sS --max-time "$CURL_MAX_TIME" -w $'\n%{http_code}' "$URL"); then
    HTTP_CODE="${RESPONSE##*$'\n'}"
    HEALTH_BODY="${RESPONSE%$'\n'*}"
    LAST_HTTP_CODE="$HTTP_CODE"
    LAST_HEALTH_BODY="$HEALTH_BODY"
    if [[ "$HTTP_CODE" == "200" ]]; then
      echo "Service is healthy (HTTP ${HTTP_CODE}) after ${attempt} attempt(s)."
      exit 0
    fi
  else
    HTTP_CODE=""
    HEALTH_BODY=""
  fi

  if (( attempt < poll_end )); then
    sleep 1
  fi
done

HEALTH_BODY="$LAST_HEALTH_BODY"
if [[ -z "$LAST_HTTP_CODE" ]]; then
  echo "Health check failed after ${poll_end} attempt(s) over ~20s (curl errors or no response)." >&2
  dump_diagnostics "poll_exhausted_curl"
  exit 1
fi

HTTP_CODE="$LAST_HTTP_CODE"
echo "Health check returned HTTP ${HTTP_CODE} (expected 200) after ${poll_end} attempt(s)." >&2
dump_diagnostics "poll_exhausted_http_${HTTP_CODE}"
exit 1

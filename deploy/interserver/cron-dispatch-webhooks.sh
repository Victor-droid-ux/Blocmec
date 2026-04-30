#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1}"
SECRET="${WEBHOOK_DISPATCH_SECRET:-${CRON_SECRET:-}}"

if [[ -z "$SECRET" ]]; then
  echo "WEBHOOK_DISPATCH_SECRET or CRON_SECRET must be set"
  exit 1
fi

curl --fail --silent --show-error \
  -X POST \
  "$BASE_URL/api/internal/webhooks/dispatch" \
  -H "Content-Type: application/json" \
  -H "x-dispatch-secret: $SECRET" \
  -d '{"limit":20}'

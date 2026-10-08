#!/usr/bin/env bash
# Smoke test for the running container: behaviour and security headers (ADR-0019).
# Usage: smoke-test.sh [base-url]
set -euo pipefail
BASE="${1:-http://localhost:8080}"
fail=0

required_headers=(
  "content-security-policy: default-src 'none'"
  "strict-transport-security: max-age=63072000; includeSubDomains"
  "x-content-type-options: nosniff"
  "x-frame-options: DENY"
  "referrer-policy: no-referrer"
  "permissions-policy:"
  "cross-origin-opener-policy: same-origin"
  "cross-origin-embedder-policy: require-corp"
  "cross-origin-resource-policy: same-origin"
)

check_status() { # method path expected
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' -X "$1" "$BASE$2")
  if [ "$code" = "$3" ]; then echo "ok   $1 $2 -> $code"; else echo "FAIL $1 $2 -> $code (expected $3)"; fail=1; fi
}

check_headers() { # method path
  local headers
  headers=$(curl -s -D - -o /dev/null -X "$1" "$BASE$2" | tr -d '\r')
  for h in "${required_headers[@]}"; do
    if grep -qiF -- "$h" <<<"$headers"; then :; else echo "FAIL $1 $2 missing header: $h"; fail=1; fi
  done
  if grep -qiE '^server: .*[0-9]' <<<"$headers"; then echo "FAIL $1 $2 leaks server version"; fail=1; fi
  echo "ok   $1 $2 headers checked"
}

check_status GET / 200
check_status GET /healthz 200
check_status GET /does-not-exist.txt 200   # unknown paths fall back to index.html (no router)
check_status GET /assets/does-not-exist.js 404
check_status GET /.env 404
check_status POST / 405
check_status PUT /index.html 405
check_status DELETE / 405

check_headers GET /
check_headers GET /assets/does-not-exist.js
check_headers POST /

asset=$(curl -s "$BASE/" | grep -oE '/assets/index-[^"]+\.js' | head -1)
if curl -s -D - -o /dev/null "$BASE$asset" | tr -d '\r' | grep -qi '^cache-control: public, max-age=31536000, immutable'; then
  echo "ok   GET $asset immutable cache"
else
  echo "FAIL GET $asset missing immutable cache header"; fail=1
fi

exit "$fail"

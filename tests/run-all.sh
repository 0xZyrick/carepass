#!/usr/bin/env bash
# Runs the API suites against a fresh local dev server (in-memory database, no network needed).
# Usage: npm run test:app
set -u
cd "$(dirname "$0")/.."
PORT=3100
run_suite() { # name, file, env...
  local name=$1 file=$2; shift 2
  pkill -f "next dev -p $PORT" 2>/dev/null; sleep 1
  env "$@" nohup npx next dev -p $PORT > /tmp/carepass-test-server.log 2>&1 &
  for i in $(seq 1 40); do curl -s -o /dev/null "http://localhost:$PORT/api/state" && break; sleep 1; done
  echo "== $name"; node "tests/$file" | grep -E "FAIL|passed" || FAILED=1
}
FAILED=0
run_suite "API"        api.mjs    A=1
run_suite "Care plans" care.mjs   A=1
run_suite "Settlement" settle.mjs SETTLEMENT_MODE=mock
run_suite "Cash-out"   payout.mjs A=1
pkill -f "next dev -p $PORT" 2>/dev/null
exit $FAILED

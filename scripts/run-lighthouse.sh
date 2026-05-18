#!/usr/bin/env bash
#
# Capture Lighthouse metrics for the post-optimization comparison doc.
#
# What it does:
#   1. Builds the production bundle (npm run build)
#   2. Serves it via `vite preview` on a fixed port
#   3. Runs Lighthouse against /dashboard, /transactions, /budgets
#      under both desktop and mobile presets
#   4. Writes one JSON report per route+form-factor to docs/performance-after/
#   5. Captures a bundle-size summary alongside the JSON reports
#
# Outputs (in docs/performance-after/):
#   - dashboard-desktop.json     transactions-desktop.json     budgets-desktop.json
#   - dashboard-mobile.json      transactions-mobile.json      budgets-mobile.json
#   - bundle-sizes.txt
#   - preview.log               (server stdout/stderr, for debugging)
#
# Requirements:
#   - Node + npm (already in use by the project)
#   - The `lighthouse` CLI — invoked via `npx --yes lighthouse` below.
#     Prefer a global install for repeated runs: `npm install -g lighthouse`.
#   - Chrome or Chromium installed locally (Lighthouse drives it headlessly).
#
# Usage:
#   bash scripts/run-lighthouse.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/docs/performance-after"
PORT=4173
BASE_URL="http://localhost:$PORT"
ROUTES=("dashboard" "transactions" "budgets")

mkdir -p "$OUT_DIR"

echo "→ Building production bundle"
( cd "$ROOT" && npm run build )

echo "→ Starting vite preview on port $PORT"
( cd "$ROOT" && npm run preview -- --port "$PORT" --strictPort ) \
  >"$OUT_DIR/preview.log" 2>&1 &
PREVIEW_PID=$!
trap 'kill "$PREVIEW_PID" 2>/dev/null || true' EXIT

echo "→ Waiting for preview server"
for _ in $(seq 1 30); do
  if curl -sSf "$BASE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sSf "$BASE_URL" >/dev/null 2>&1; then
  echo "✗ Preview server did not become ready on $BASE_URL" >&2
  echo "  See $OUT_DIR/preview.log for details." >&2
  exit 1
fi

run_lighthouse() {
  local route="$1"
  local form="$2"
  local out="$OUT_DIR/${route}-${form}.json"
  local preset=()
  if [ "$form" = "desktop" ]; then
    preset=(--preset=desktop)
  fi
  echo "→ Lighthouse: /$route ($form)"
  # `${arr[@]+"${arr[@]}"}` is the bash-3.2-safe expansion for a possibly
  # empty array under `set -u` (macOS ships bash 3.2).
  npx --yes lighthouse "$BASE_URL/$route" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox" \
    --output=json \
    --output-path="$out" \
    ${preset[@]+"${preset[@]}"}
}

for route in "${ROUTES[@]}"; do
  run_lighthouse "$route" "desktop"
  run_lighthouse "$route" "mobile"
done

echo "→ Capturing bundle sizes"
{
  printf 'Generated: %s\n\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "## dist/ assets (sorted by size)"
  echo ""
  ( cd "$ROOT" && du -h dist/assets/*.js dist/assets/*.css 2>/dev/null | sort -h )
  echo ""
  printf 'Total dist/: %s\n' "$(du -sh "$ROOT/dist" | cut -f1)"
} > "$OUT_DIR/bundle-sizes.txt"

echo "✓ Done. Reports in $OUT_DIR"
#!/usr/bin/env bash
#
# IMPORTANT: This script measures against demo build (with MSW).
# Standard production build (npm run build) does not include MSW and
# will produce invalid measurements (empty page, no data).
#
# Capture post-optimization Lighthouse metrics for `docs/performance-after/`.
#
# What it does:
#   1. Builds the demo bundle (npm run build:demo)
#   2. Serves it via `vite preview` on port 4173
#   3. Sanity-checks that the preview is actually serving non-empty HTML
#   4. Runs Lighthouse 3x against /dashboard, /transactions, /budgets under
#      both desktop and mobile presets — 18 raw runs total
#   5. Picks the median run (by Performance score) per route × form-factor
#      and writes it to docs/performance-after/{route}-{form}.json
#   6. Keeps the raw runs in docs/performance-after/runs/ for traceability
#   7. Writes a bundle-size summary alongside the JSON reports
#
# Outputs (in docs/performance-after/):
#   - {dashboard,transactions,budgets}-{desktop,mobile}.json  (6 median reports)
#   - runs/{route}-{form}-run-{1,2,3}.json                    (18 raw runs)
#   - bundle-sizes.txt
#   - preview.log
#
# Requirements:
#   - Node + npm (already in use by the project)
#   - The `lighthouse` CLI — invoked via `npx --yes lighthouse` below.
#     Prefer a global install for repeated runs: `npm install -g lighthouse`.
#   - Chrome or Chromium installed locally (Lighthouse drives it headlessly).
#
# Usage:
#   bash scripts/run-lighthouse-after.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$ROOT/docs/performance-after"
RUNS_DIR="$OUT_DIR/runs"
PORT=4173
BASE_URL="http://localhost:$PORT"
ROUTES=("dashboard" "transactions" "budgets")
FORMS=("desktop" "mobile")
RUNS_PER_ROUTE=3

mkdir -p "$OUT_DIR" "$RUNS_DIR"

echo "→ Building demo bundle (npm run build:demo)"
( cd "$ROOT" && npm run build:demo )

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

echo "→ Verifying demo build actually serves content"
# The Vite-shell HTML response is small (<1 KB). With MSW + fixtures the SPA
# shell is still small (most rendering happens client-side after JS executes),
# so we only check that the response is non-empty and contains the app root.
HTML="$(curl -sS "$BASE_URL/" || true)"
if ! printf '%s' "$HTML" | grep -q '<div id="root"></div>'; then
  echo "✗ Preview did not return the expected SPA shell on $BASE_URL/" >&2
  echo "  Got:" >&2
  printf '%s\n' "$HTML" | head -c 500 >&2
  echo "" >&2
  exit 1
fi

run_lighthouse_once() {
  local route="$1"
  local form="$2"
  local run="$3"
  local out="$RUNS_DIR/${route}-${form}-run-${run}.json"
  local preset=()
  if [ "$form" = "desktop" ]; then
    preset=(--preset=desktop)
  fi
  echo "  · run $run/$RUNS_PER_ROUTE → $(basename "$out")"
  # `${arr[@]+"${arr[@]}"}` is the bash-3.2-safe expansion for a possibly
  # empty array under `set -u` (macOS ships bash 3.2).
  npx --yes lighthouse "$BASE_URL/$route" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox" \
    --output=json \
    --output-path="$out" \
    ${preset[@]+"${preset[@]}"}
}

# Median pick (by Performance score). Three input JSONs in, the median one is
# copied to $4. We use node because it's already a project dependency and
# Lighthouse JSON has a stable shape (`categories.performance.score`).
pick_median_run() {
  local route="$1"
  local form="$2"
  local out="$OUT_DIR/${route}-${form}.json"
  local r1="$RUNS_DIR/${route}-${form}-run-1.json"
  local r2="$RUNS_DIR/${route}-${form}-run-2.json"
  local r3="$RUNS_DIR/${route}-${form}-run-3.json"
  local median_path
  median_path="$(node -e '
    const fs = require("fs");
    const paths = process.argv.slice(1);
    const runs = paths.map((p) => ({
      path: p,
      score: JSON.parse(fs.readFileSync(p, "utf8")).categories.performance.score,
    }));
    runs.sort((a, b) => a.score - b.score);
    process.stdout.write(runs[1].path);
  ' "$r1" "$r2" "$r3")"
  cp "$median_path" "$out"
  echo "  ✓ median → $(basename "$out") (from $(basename "$median_path"))"
}

for route in "${ROUTES[@]}"; do
  for form in "${FORMS[@]}"; do
    echo "→ Lighthouse: /$route ($form) — $RUNS_PER_ROUTE runs"
    for run in $(seq 1 "$RUNS_PER_ROUTE"); do
      run_lighthouse_once "$route" "$form" "$run"
    done
    pick_median_run "$route" "$form"
  done
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

echo "✓ Done. Median reports in $OUT_DIR; raw runs in $RUNS_DIR"

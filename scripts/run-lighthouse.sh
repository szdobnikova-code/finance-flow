#!/usr/bin/env bash
#
# Deprecated. Use scripts/run-lighthouse-after.sh.
#
# The old script here built via `npm run build`, which is the production
# target — MSW and pre-generated fixtures are stripped out, so the preview
# server renders an empty page and Lighthouse measures nothing. The
# replacement script builds via `npm run build:demo` and runs 3x per
# route × form-factor with a median pick.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "⚠ scripts/run-lighthouse.sh is deprecated."
echo "  Forwarding to scripts/run-lighthouse-after.sh."
exec bash "$ROOT/scripts/run-lighthouse-after.sh" "$@"

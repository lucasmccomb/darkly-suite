#!/usr/bin/env bash
# Package a Darkly extension into a Chrome Web Store submission zip.
#
# Produces a PRODUCTION build (paywall ENABLED — correct for a CWS upload) and
# zips its dist/ directory. Run this at the "build zip" step of the CWS
# submission process (see docs/cws-submission-process.md).
#
# Usage: scripts/package-extension.sh <package-dir>
#   e.g. scripts/package-extension.sh darkly-suite
#
# Output: dist-zips/<package-dir>-v<version>.zip  (gitignored via *.zip)
set -euo pipefail

DIR="${1:?Usage: scripts/package-extension.sh <package-dir> (e.g. darkly-suite)}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_DIR="$ROOT/packages/$DIR"
[ -d "$PKG_DIR" ] || { echo "error: no package at packages/$DIR" >&2; exit 1; }
[ -f "$PKG_DIR/static/manifest.json" ] || { echo "error: packages/$DIR has no static/manifest.json (not an extension)" >&2; exit 1; }

read_json() { python3 -c "import json,sys;print(json.load(open(sys.argv[1]))$2)" "$1"; }
NAME="$(read_json "$PKG_DIR/package.json" "['name']")"
VERSION="$(read_json "$PKG_DIR/static/manifest.json" "['version']")"

echo "Building $NAME v$VERSION (production, paywall ON)..."
pnpm --filter "$NAME" build

OUT="$ROOT/dist-zips"; mkdir -p "$OUT"
ZIP="$OUT/${DIR}-v${VERSION}.zip"
rm -f "$ZIP"
# Source maps are deliberately excluded: they would publish the full original
# TypeScript source to anyone who downloads the extension, and they outweigh the
# actual code (~6.6M of maps vs ~2.2M of build output). They stay in dist/ for
# local debugging; they just never reach the store.
( cd "$PKG_DIR/dist" && zip -rX "$ZIP" . -x '*.DS_Store' '*.map' >/dev/null )

echo "Created ${ZIP#"$ROOT"/}  ($(du -h "$ZIP" | cut -f1))"
unzip -l "$ZIP" | tail -1
echo "Note: dist/ is now a production build. Re-run the matching 'pnpm dev:*' before local Chrome testing."

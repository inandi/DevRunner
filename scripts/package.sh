#!/usr/bin/env bash
# CAST — build clean webext tree + Chromium/Firefox zip artifacts (MIT).
# Author: Gobinda Nandi <gobinda.nandi.public@gmail.com>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
WEBEXT="$DIST/cast-webext"

# Ensure polyfill is present
if [[ ! -f "$ROOT/lib/browser-polyfill.js" ]]; then
  (cd "$ROOT" && npm run vendor)
fi

rm -rf "$DIST"
mkdir -p "$WEBEXT"

# Extension assets only (no node_modules / package tooling)
rsync -a \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'safari-build' \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.vscode' \
  --exclude '.cursor' \
  --exclude 'package.json' \
  --exclude 'package-lock.json' \
  --exclude 'scripts' \
  --exclude '.DS_Store' \
  --exclude '*.md' \
  --exclude 'icons/logo-transparent.png' \
  "$ROOT/" "$WEBEXT/"

# Keep a copy of README inside webext for store reviewers? Plan said clean assets — skip.

# Zip contents must be at archive root (not a parent folder)
(
  cd "$WEBEXT"
  zip -qr "$DIST/cast-chromium.zip" .
  cp "$DIST/cast-chromium.zip" "$DIST/cast-firefox.zip"
)

echo "Built:"
echo "  $WEBEXT/"
echo "  $DIST/cast-chromium.zip"
echo "  $DIST/cast-firefox.zip"
echo ""
echo "Safari (macOS + Xcode):"
echo "  xcrun safari-web-extension-converter \"$WEBEXT\" --project-location \"$ROOT/safari-build\""

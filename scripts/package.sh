#!/usr/bin/env bash
# CAST — build clean extension tree + Chrome Web Store zip (MIT).
# Author: Gobinda Nandi <gobinda.nandi.public@gmail.com>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
WEBEXT="$DIST/cast-webext"

rm -rf "$DIST"
mkdir -p "$WEBEXT"

# Allowlist: only files the extension loads at runtime. Repo tooling, docs,
# and release files (release.sh, CHANGELOG.md, ...) never reach the store zip.
INCLUDE=(
  manifest.json
  LICENSE
  background
  lib
  popup
  icons/icon-16.png
  icons/icon-32.png
  icons/icon-48.png
  icons/icon-128.png
)

cd "$ROOT"
rsync -aR --exclude '.DS_Store' "${INCLUDE[@]}" "$WEBEXT/"

# Zip contents must be at archive root (not a parent folder)
(
  cd "$WEBEXT"
  zip -qr "$DIST/cast-chromium.zip" .
)

echo "Built:"
echo "  $WEBEXT/"
echo "  $DIST/cast-chromium.zip"

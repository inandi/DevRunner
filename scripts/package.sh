#!/usr/bin/env bash
# CAST — build clean extension tree + Chrome Web Store zip (MIT).
# Author: Gobinda Nandi <gobinda.nandi.public@gmail.com>
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
WEBEXT="$DIST/cast-webext"

rm -rf "$DIST"
mkdir -p "$WEBEXT"

# Extension assets only (no node_modules / package tooling)
rsync -a \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.github' \
  --exclude '.editorconfig' \
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
)

echo "Built:"
echo "  $WEBEXT/"
echo "  $DIST/cast-chromium.zip"

#!/usr/bin/env node
/**
 * DevRunner - Vendor webextension-polyfill
 *
 * @file Copy browser-polyfill.js from node_modules into lib/ for unpacked loads.
 * @license MIT
 *
 * Lightweight cross-browser extension for site-specific JS automation in MAIN world.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 1.0.0
 * @version 1.0.0
 * @copyright (c) 2026 Gobinda Nandi
 */

"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(
  root,
  "node_modules",
  "webextension-polyfill",
  "dist",
  "browser-polyfill.js"
);
const dest = path.join(root, "lib", "browser-polyfill.js");

if (!fs.existsSync(src)) {
  console.error(
    "webextension-polyfill not found. Run: npm install"
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Vendored lib/browser-polyfill.js");

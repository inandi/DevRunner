/**
 * DevRunner - Background service worker
 *
 * @file Handle keyboard commands that run the top domain scripts for the active tab.
 * @license MIT
 *
 * Lightweight cross-browser extension for site-specific JS automation in MAIN world.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 0.1.0
 * @version 0.1.0
 * @copyright (c) 2026 Gobinda Nandi
 */

/* global importScripts, browser, DevRunner */
"use strict";

importScripts(
  "../lib/browser-polyfill.js",
  "../lib/hostname.js",
  "../lib/storage.js",
  "../lib/execute.js"
);

const COMMAND_INDEX = {
  "run-script-1": 0,
  "run-script-2": 1,
  "run-script-3": 2,
};

browser.commands.onCommand.addListener(async (command) => {
  const index = COMMAND_INDEX[command];
  if (index == null) return;

  try {
    const ctx = await DevRunner.hostname.getActiveHostname();
    if (!ctx.ok || !ctx.tab || ctx.tab.id == null || !ctx.hostname) {
      console.warn("DevRunner hotkey: unsupported tab", ctx.reason);
      return;
    }

    const scripts = await DevRunner.storage.listHostScriptsSorted(ctx.hostname);
    const snippet = scripts[index];
    if (!snippet) {
      console.warn(
        `DevRunner hotkey: no domain script #${index + 1} for ${ctx.hostname}`
      );
      return;
    }

    const result = await DevRunner.execute.runInTab(ctx.tab.id, snippet.code);
    if (!result.ok) {
      console.error("DevRunner hotkey failed:", result.error);
    }
  } catch (err) {
    console.error("DevRunner hotkey error:", err);
  }
});

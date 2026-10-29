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

/**
 * Flash a short badge on the action icon so hotkey outcomes are visible.
 * @param {number} tabId
 * @param {boolean} ok
 */
async function flashBadge(tabId, ok) {
  try {
    await browser.action.setBadgeBackgroundColor({
      tabId,
      color: ok ? "#2e7d32" : "#c62828",
    });
    await browser.action.setBadgeText({ tabId, text: ok ? "OK" : "!" });
    setTimeout(() => {
      browser.action.setBadgeText({ tabId, text: "" }).catch(() => {});
    }, 2000);
  } catch {
    // Tab may have closed; nothing to show.
  }
}

browser.commands.onCommand.addListener(async (command) => {
  const index = COMMAND_INDEX[command];
  if (index == null) return;

  try {
    const ctx = await DevRunner.hostname.getActiveHostname();
    if (!ctx.ok || !ctx.tab || ctx.tab.id == null || !ctx.hostname) {
      console.warn("DevRunner hotkey: unsupported tab", ctx.reason);
      if (ctx.tab && ctx.tab.id != null) flashBadge(ctx.tab.id, false);
      return;
    }

    const scripts = await DevRunner.storage.listHostScriptsSorted(ctx.hostname);
    const snippet = scripts[index];
    if (!snippet) {
      console.warn(
        `DevRunner hotkey: no domain script #${index + 1} for ${ctx.hostname}`
      );
      flashBadge(ctx.tab.id, false);
      return;
    }

    const result = await DevRunner.execute.runInTab(ctx.tab.id, snippet.code);
    if (!result.ok) {
      console.error("DevRunner hotkey failed:", result.error);
    }
    flashBadge(ctx.tab.id, result.ok);
  } catch (err) {
    console.error("DevRunner hotkey error:", err);
  }
});

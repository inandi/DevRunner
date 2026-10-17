/**
 * DevRunner - Hostname helpers
 *
 * @file Resolve the active tab hostname and reject restricted page URLs.
 * @license MIT
 *
 * Lightweight cross-browser extension for site-specific JS automation in MAIN world.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 1.0.0
 * @version 1.0.0
 * @copyright (c) 2026 Gobinda Nandi
 */

(function (global) {
  "use strict";

  const RESTRICTED_PROTOCOLS = new Set([
    "chrome:",
    "chrome-extension:",
    "edge:",
    "about:",
    "moz-extension:",
    "safari-web-extension:",
    "devtools:",
    "view-source:",
    "data:",
    "blob:",
    "file:",
  ]);

  /**
   * @param {string | undefined} url
   * @returns {{ ok: true, hostname: string, url: string } | { ok: false, reason: string }}
   */
  function resolveHostname(url) {
    if (!url) {
      return { ok: false, reason: "No active tab URL." };
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { ok: false, reason: "Invalid tab URL." };
    }

    if (RESTRICTED_PROTOCOLS.has(parsed.protocol)) {
      return {
        ok: false,
        reason: "DevRunner cannot run on this page type.",
      };
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        ok: false,
        reason: "Only http(s) pages are supported.",
      };
    }

    const hostname = parsed.hostname;
    if (!hostname) {
      return { ok: false, reason: "Could not resolve hostname." };
    }

    return { ok: true, hostname, url };
  }

  async function getActiveTab() {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tabs[0] || null;
  }

  async function getActiveHostname() {
    const tab = await getActiveTab();
    if (!tab) {
      return {
        ok: false,
        reason: "No active tab.",
        tab: null,
        hostname: null,
      };
    }
    const resolved = resolveHostname(tab.url);
    if (!resolved.ok) {
      return {
        ok: false,
        reason: resolved.reason,
        tab,
        hostname: null,
      };
    }
    return {
      ok: true,
      reason: null,
      tab,
      hostname: resolved.hostname,
      url: resolved.url,
    };
  }

  global.DevRunner = global.DevRunner || {};
  global.DevRunner.hostname = {
    resolveHostname,
    getActiveTab,
    getActiveHostname,
    RESTRICTED_PROTOCOLS,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

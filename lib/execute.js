/**
 * DevRunner - MAIN-world execution
 *
 * @file Run user snippets via scripting.executeScript with world MAIN.
 * @license MIT
 *
 * Lightweight cross-browser extension for site-specific JS automation in MAIN world.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 0.1.0
 * @version 0.1.0
 * @copyright (c) 2026 Gobinda Nandi
 */

(function (global) {
  "use strict";

  /**
   * Runs in the page MAIN world. Must stay serializable (no closures).
   * @param {string} code
   * @returns {{ ok: boolean, result?: string, error?: string }}
   */
  function mainWorldRunner(code) {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(code);
      const value = fn();
      let result;
      if (value === undefined) {
        result = undefined;
      } else {
        try {
          result = typeof value === "string" ? value : JSON.stringify(value);
        } catch {
          result = String(value);
        }
      }
      return { ok: true, result };
    } catch (err) {
      return {
        ok: false,
        error: err && err.message ? String(err.message) : String(err),
      };
    }
  }

  /**
   * @param {number} tabId
   * @param {string} code
   * @returns {Promise<{ ok: boolean, result?: string, error?: string }>}
   */
  async function runInTab(tabId, code) {
    if (!tabId) {
      return { ok: false, error: "Missing tab id." };
    }
    if (!code || !String(code).trim()) {
      return { ok: false, error: "Empty script." };
    }

    try {
      const results = await browser.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: mainWorldRunner,
        args: [String(code)],
      });

      const first = results && results[0];
      if (!first) {
        return { ok: false, error: "No execution result." };
      }
      if (first.error) {
        return {
          ok: false,
          error: first.error.message || String(first.error),
        };
      }
      const payload = first.result;
      if (payload && typeof payload === "object") {
        return payload;
      }
      return { ok: true, result: payload == null ? undefined : String(payload) };
    } catch (err) {
      return {
        ok: false,
        error: err && err.message ? String(err.message) : String(err),
      };
    }
  }

  async function runOnActiveTab(code) {
    const ctx = await global.DevRunner.hostname.getActiveHostname();
    if (!ctx.ok || !ctx.tab || ctx.tab.id == null) {
      return {
        ok: false,
        error: ctx.reason || "Cannot run on this tab.",
      };
    }
    return runInTab(ctx.tab.id, code);
  }

  global.DevRunner = global.DevRunner || {};
  global.DevRunner.execute = {
    runInTab,
    runOnActiveTab,
    mainWorldRunner,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

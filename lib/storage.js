/**
 * CAST - Script storage
 *
 * @file Persist and validate hostname-scoped (and global) snippet decks in storage.local.
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

  const GLOBAL_KEY = "global";

  function makeId() {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
    return `srv_${hex}`;
  }

  function isSnippet(value) {
    return (
      value &&
      typeof value === "object" &&
      typeof value.id === "string" &&
      typeof value.name === "string" &&
      typeof value.code === "string" &&
      typeof value.createdAt === "number"
    );
  }

  function normalizeDeck(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(isSnippet);
  }

  /**
   * Validate import payload: object of hostname → snippet arrays.
   * @param {unknown} data
   * @returns {{ ok: true, data: Record<string, object[]> } | { ok: false, error: string }}
   */
  function validateImportPayload(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "Import must be a JSON object of host keys." };
    }
    const out = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof key !== "string" || !key.trim()) {
        return { ok: false, error: "Invalid hostname key in import." };
      }
      if (!Array.isArray(value)) {
        return {
          ok: false,
          error: `Key "${key}" must be an array of snippets.`,
        };
      }
      const snippets = [];
      for (const item of value) {
        if (!isSnippet(item)) {
          return {
            ok: false,
            error: `Invalid snippet under "${key}". Need id, name, code, createdAt.`,
          };
        }
        snippets.push({
          id: item.id,
          name: item.name,
          code: item.code,
          createdAt: item.createdAt,
        });
      }
      out[key] = snippets;
    }
    return { ok: true, data: out };
  }

  async function getAll() {
    return browser.storage.local.get(null);
  }

  async function setAll(data) {
    await browser.storage.local.clear();
    if (data && Object.keys(data).length > 0) {
      await browser.storage.local.set(data);
    }
  }

  async function listScripts(host) {
    if (!host) return [];
    const bag = await browser.storage.local.get(host);
    return normalizeDeck(bag[host]);
  }

  async function addScript(host, { name, code }) {
    const trimmedName = (name || "").trim();
    const trimmedCode = (code || "").trim();
    if (!host) throw new Error("Host is required.");
    if (!trimmedName) throw new Error("Name is required.");
    if (!trimmedCode) throw new Error("Code is required.");

    const existing = await listScripts(host);
    const snippet = {
      id: makeId(),
      name: trimmedName,
      code: trimmedCode,
      createdAt: Date.now(),
    };
    existing.push(snippet);
    await browser.storage.local.set({ [host]: existing });
    return snippet;
  }

  async function deleteScript(host, id) {
    const existing = await listScripts(host);
    const next = existing.filter((s) => s.id !== id);
    if (next.length === 0) {
      await browser.storage.local.remove(host);
    } else {
      await browser.storage.local.set({ [host]: next });
    }
    return next;
  }

  /** Host scripts sorted by createdAt ascending (oldest first = hotkey #1). */
  async function listHostScriptsSorted(host) {
    const list = await listScripts(host);
    return list.slice().sort((a, b) => a.createdAt - b.createdAt);
  }

  global.Cast = global.Cast || {};
  global.Cast.storage = {
    GLOBAL_KEY,
    makeId,
    isSnippet,
    validateImportPayload,
    getAll,
    setAll,
    listScripts,
    addScript,
    deleteScript,
    listHostScriptsSorted,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

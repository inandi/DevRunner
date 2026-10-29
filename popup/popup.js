/**
 * CAST - Popup dashboard
 *
 * @file UI to list, add, run, delete, import, and export scripts for the active host.
 * @license MIT
 *
 * Lightweight cross-browser extension for site-specific JS automation in MAIN world.
 *
 * @author Gobinda Nandi <gobinda.nandi.public@gmail.com>
 * @since 0.1.0
 * @version 0.1.1
 * @copyright (c) 2026 Gobinda Nandi
 */

(function () {
  "use strict";

  const { hostname, storage, execute } = Cast;

  const els = {
    hostnameLabel: document.getElementById("hostname-label"),
    pageStatus: document.getElementById("page-status"),
    scriptList: document.getElementById("script-list"),
    emptyList: document.getElementById("empty-list"),
    addForm: document.getElementById("add-form"),
    scriptName: document.getElementById("script-name"),
    scriptCode: document.getElementById("script-code"),
    globalToggle: document.getElementById("global-toggle"),
    addBtn: document.getElementById("add-btn"),
    exportBtn: document.getElementById("export-btn"),
    importInput: document.getElementById("import-input"),
    runStatus: document.getElementById("run-status"),
  };

  const COPY_ICON =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"/></svg>';
  const CHECK_ICON =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>';

  /** @type {{ ok: boolean, hostname: string|null, tab: object|null, reason: string|null }} */
  let pageCtx = {
    ok: false,
    hostname: null,
    tab: null,
    reason: "Loading…",
  };

  let statusTimer = null;

  /** Show a toast message; ok/err messages fade out on their own. */
  function setStatus(el, message, kind) {
    clearTimeout(statusTimer);
    el.textContent = message || "";
    el.classList.remove("ok", "err");
    if (kind) el.classList.add(kind);
    if (kind) {
      statusTimer = setTimeout(() => {
        el.textContent = "";
        el.classList.remove("ok", "err");
      }, kind === "err" ? 6000 : 3500);
    }
  }

  function truncate(str, max) {
    const s = String(str);
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
  }

  function syncFormEnabled() {
    const hostOk = Boolean(pageCtx.ok && pageCtx.hostname);
    const globalOnly = els.globalToggle.checked;
    const canAdd = hostOk || globalOnly;
    els.scriptName.disabled = !canAdd;
    els.scriptCode.disabled = !canAdd;
    els.globalToggle.disabled = false;
    els.addBtn.disabled = !canAdd;
  }

  async function loadPageContext() {
    pageCtx = await hostname.getActiveHostname();
    if (pageCtx.ok) {
      els.hostnameLabel.textContent = pageCtx.hostname;
      els.pageStatus.hidden = true;
      els.pageStatus.textContent = "";
    } else {
      els.hostnameLabel.textContent = "Unsupported page";
      els.pageStatus.hidden = false;
      els.pageStatus.textContent =
        (pageCtx.reason || "Open an http(s) page to manage host scripts.") +
        " You can still add global scripts.";
      els.globalToggle.checked = true;
    }
    syncFormEnabled();
  }

  function renderItem(snippet, scope) {
    const li = document.createElement("li");
    li.className = "script-item";
    li.dataset.id = snippet.id;
    li.dataset.scope = scope;

    const meta = document.createElement("div");
    meta.className = "script-meta";

    const name = document.createElement("div");
    name.className = "script-name";
    name.textContent = snippet.name;

    const scopeEl = document.createElement("span");
    scopeEl.className = "script-scope";
    scopeEl.textContent = scope === storage.GLOBAL_KEY ? "global" : scope;

    meta.appendChild(name);
    meta.appendChild(scopeEl);

    const actions = document.createElement("div");
    actions.className = "script-actions";

    const runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "btn primary";
    runBtn.textContent = "Run";
    runBtn.disabled = !pageCtx.ok;
    runBtn.setAttribute("aria-label", `Run ${snippet.name}`);
    runBtn.addEventListener("click", () => onRun(snippet));

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn icon-btn";
    copyBtn.innerHTML = COPY_ICON;
    copyBtn.title = "Copy code";
    copyBtn.setAttribute("aria-label", `Copy code of ${snippet.name}`);
    copyBtn.addEventListener("click", () => onCopy(snippet, copyBtn));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn danger";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("aria-label", `Delete ${snippet.name}`);
    delBtn.addEventListener("click", () => onDelete(snippet, scope));

    actions.appendChild(runBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(delBtn);

    li.appendChild(meta);
    li.appendChild(actions);
    return li;
  }

  async function refreshList() {
    els.scriptList.replaceChildren();

    const host = pageCtx.hostname;
    const globalScripts = await storage.listScripts(storage.GLOBAL_KEY);
    const hostScripts = host ? await storage.listScripts(host) : [];

    const items = [];
    for (const s of globalScripts) {
      items.push({ snippet: s, scope: storage.GLOBAL_KEY });
    }
    for (const s of hostScripts) {
      items.push({ snippet: s, scope: host });
    }

    if (items.length === 0) {
      els.emptyList.hidden = false;
      els.emptyList.textContent = host
        ? "No scripts for this host yet."
        : "No global scripts yet. Open an http(s) page to add host scripts.";
      return;
    }

    els.emptyList.hidden = true;
    for (const { snippet, scope } of items) {
      els.scriptList.appendChild(renderItem(snippet, scope));
    }
  }

  async function onRun(snippet) {
    setStatus(els.runStatus, "Running…");
    const result = await execute.runOnActiveTab(snippet.code);
    if (result.ok) {
      const detail =
        result.result === undefined
          ? "OK"
          : `OK · ${truncate(result.result, 120)}`;
      setStatus(els.runStatus, detail, "ok");
    } else {
      setStatus(
        els.runStatus,
        `Error · ${truncate(result.error || "Unknown error", 160)}`,
        "err"
      );
    }
  }

  /**
   * Write text to the clipboard, falling back to execCommand when the
   * async Clipboard API is unavailable or rejected.
   * @param {string} text
   */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy path.
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("Clipboard is not available.");
  }

  async function onCopy(snippet, button) {
    try {
      await copyText(snippet.code);
      button.innerHTML = CHECK_ICON;
      button.classList.add("copied");
      setTimeout(() => {
        button.innerHTML = COPY_ICON;
        button.classList.remove("copied");
      }, 1500);
      setStatus(els.runStatus, `Copied “${snippet.name}” to clipboard.`, "ok");
    } catch (err) {
      setStatus(
        els.runStatus,
        `Copy failed · ${err && err.message ? err.message : String(err)}`,
        "err"
      );
    }
  }

  async function onDelete(snippet, scope) {
    const ok = confirm(`Delete “${snippet.name}”?`);
    if (!ok) return;
    await storage.deleteScript(scope, snippet.id);
    setStatus(els.runStatus, `Deleted “${snippet.name}”.`, "ok");
    await refreshList();
  }

  els.globalToggle.addEventListener("change", syncFormEnabled);

  els.addForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = els.scriptName.value;
    const code = els.scriptCode.value;
    const targetKey = els.globalToggle.checked
      ? storage.GLOBAL_KEY
      : pageCtx.hostname;

    if (!targetKey) {
      setStatus(
        els.runStatus,
        "Cannot save host script on this page. Enable global, or open http(s).",
        "err"
      );
      return;
    }

    try {
      await storage.addScript(targetKey, { name, code });
      els.addForm.reset();
      if (!pageCtx.ok) els.globalToggle.checked = true;
      syncFormEnabled();
      setStatus(els.runStatus, `Saved “${name.trim()}”.`, "ok");
      await refreshList();
    } catch (err) {
      setStatus(
        els.runStatus,
        err && err.message ? err.message : String(err),
        "err"
      );
    }
  });

  els.exportBtn.addEventListener("click", async () => {
    try {
      const data = await storage.getAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `cast-export-${stamp}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(els.runStatus, "Export downloaded.", "ok");
    } catch (err) {
      setStatus(
        els.runStatus,
        err && err.message ? err.message : String(err),
        "err"
      );
    }
  });

  els.importInput.addEventListener("change", async () => {
    const file = els.importInput.files && els.importInput.files[0];
    els.importInput.value = "";
    if (!file) return;

    const confirmed = confirm(
      "Replace ALL CAST scripts with this import? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        setStatus(els.runStatus, "Invalid JSON file.", "err");
        return;
      }
      const validated = storage.validateImportPayload(parsed);
      if (!validated.ok) {
        setStatus(els.runStatus, validated.error, "err");
        return;
      }
      await storage.setAll(validated.data);
      setStatus(els.runStatus, "Import complete (replaced all).", "ok");
      await refreshList();
    } catch (err) {
      setStatus(
        els.runStatus,
        err && err.message ? err.message : String(err),
        "err"
      );
    }
  });

  async function init() {
    await loadPageContext();
    await refreshList();
  }

  init().catch((err) => {
    setStatus(
      els.runStatus,
      err && err.message ? err.message : String(err),
      "err"
    );
  });
})();

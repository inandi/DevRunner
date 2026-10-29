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
 * @version 0.1.0
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
    ioStatus: document.getElementById("io-status"),
    runStatus: document.getElementById("run-status"),
  };

  /** @type {{ ok: boolean, hostname: string|null, tab: object|null, reason: string|null }} */
  let pageCtx = {
    ok: false,
    hostname: null,
    tab: null,
    reason: "Loading…",
  };

  function setStatus(el, message, kind) {
    el.textContent = message || "";
    el.classList.remove("ok", "err");
    if (kind) el.classList.add(kind);
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

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn danger";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("aria-label", `Delete ${snippet.name}`);
    delBtn.addEventListener("click", () => onDelete(snippet, scope));

    actions.appendChild(runBtn);
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

  async function onDelete(snippet, scope) {
    const ok = confirm(`Delete “${snippet.name}”?`);
    if (!ok) return;
    await storage.deleteScript(scope, snippet.id);
    setStatus(els.runStatus, `Deleted “${snippet.name}”.`);
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
      URL.revokeObjectURL(url);
      setStatus(els.ioStatus, "Export downloaded.", "ok");
    } catch (err) {
      setStatus(
        els.ioStatus,
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
        setStatus(els.ioStatus, "Invalid JSON file.", "err");
        return;
      }
      const validated = storage.validateImportPayload(parsed);
      if (!validated.ok) {
        setStatus(els.ioStatus, validated.error, "err");
        return;
      }
      await storage.setAll(validated.data);
      setStatus(els.ioStatus, "Import complete (replaced all).", "ok");
      await refreshList();
    } catch (err) {
      setStatus(
        els.ioStatus,
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

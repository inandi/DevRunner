# CAST

**C**ustom **A**utomation **S**nippet **T**rigger — cast your own scripts onto any site.

Lightweight **Manifest V3** Chrome extension for storing and running **site-specific JavaScript** snippets in the page **main world** (`window`). Built for local development and QA — clear storage, fill forms, trigger UI flows, without retyping console scripts.

**Author:** Gobinda Nandi \<gobinda.nandi.public@gmail.com\>  
**License:** [MIT](LICENSE) · **Privacy:** [PRIVACY.md](PRIVACY.md)  
**Version:** 0.1.1 (beta)

Built for **Google Chrome**.

## Features

- Scripts namespaced by hostname in `chrome.storage.local` (plus a **global** deck)
- One-click run via `scripting.executeScript` with `world: "MAIN"`
- Add, copy, and delete snippets from the popup
- JSON **export / import** (replace-all on import)
- Keyboard shortcuts for the top 3 **domain** scripts (by `createdAt`), with a toolbar badge showing the result
- Async snippets: top-level `await` works, and returned promises are awaited
- No dependencies — plain JavaScript, no build step

## Quick start (unpacked)

```bash
git clone <your-repo-url> cast
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the repo folder (the one containing `manifest.json`)

### Sample snippet (`localhost`)

**Name:** `Reset Storage & Reload`

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Usage

1. Open an `http`/`https` tab (e.g. `http://localhost:3000`)
2. Click the CAST toolbar icon
3. Add a script (optionally check **Save as global**)
4. **Run** executes in the page’s main world; status appears at the bottom of the popup

Restricted pages (`chrome://`, `about:`, extension pages, etc.) show an unsupported-page state. You can still save **global** scripts from those pages.

## Keyboard shortcuts

| Command | Default | Behavior |
|---------|---------|----------|
| Run domain script #1 | `Alt+Shift+1` | Oldest domain script for the current host |
| Run domain script #2 | `Alt+Shift+2` | Second oldest |
| Run domain script #3 | `Alt+Shift+3` | Third oldest |

Global scripts are **not** bound to these shortcuts. Rebind them at `chrome://extensions/shortcuts`.

After a shortcut runs, the toolbar icon briefly shows **OK** (green) or **!** (red: script error, no script at that slot, or unsupported page).

## Import / export

Both buttons live in the popup header.

- **Export** downloads the full `storage.local` object
- **Import** validates the schema and **replaces all** stored scripts after confirm

Schema:

```json
{
  "localhost": [
    {
      "id": "srv_9b1deb4d",
      "name": "Reset Storage & Reload",
      "code": "localStorage.clear(); location.reload();",
      "createdAt": 1773752400000
    }
  ],
  "global": []
}
```

Each snippet: `{ id, name, code, createdAt }`.

## Architecture

```
manifest.json              # MV3 entry
popup/                     # Dashboard UI (HTML/CSS/JS)
background/                # Service worker — hotkey commands
lib/
  hostname.js              # Active tab → hostname
  storage.js               # storage.local CRUD + import validation
  execute.js               # scripting.executeScript world MAIN
icons/                     # icon-16/32/48/128.png (from logo-transparent.png) + logo-transparent.png
scripts/
  package.sh               # dist/ extension tree + store zip
```

Source modules attach to `globalThis.Cast` and load as classic scripts (no bundler). File headers use JSDoc (`@file`, `@license`, `@author`, `@version`).

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab when you open the popup or use a shortcut |
| `scripting` | Inject and run snippets in MAIN world |
| `storage` | Persist script decks locally |

See [PRIVACY.md](PRIVACY.md) for the store-facing privacy summary.

## Package for distribution

```bash
npm run package
```

| Artifact | Purpose |
|----------|---------|
| `dist/cast-webext/` | Clean extension tree |
| `dist/cast-chromium.zip` | Chrome Web Store upload |

Bump `version` in both `manifest.json` and `package.json` before each store upload.

## Chrome Web Store (short checklist)

Current build is **beta** (`0.1.1` / display name **CAST (Beta)**). Chrome versions must be numeric (no `1.0.0-beta` tag).

### Beta (recommended first publish)

1. `npm run package`
2. [Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **New item** → upload `dist/cast-chromium.zip`
3. Listing: screenshots, description, category (**Developer Tools**)
4. Privacy practices → link [PRIVACY.md](PRIVACY.md)
5. Justify `activeTab`, `scripting`, `storage`
6. Visibility: **Unlisted** (share the link with testers only) — or **Private** if you use a Google Group
7. Submit for review

### Later: public 1.0

Bump `manifest.json` + `package.json` to `1.0.0`, rename to `CAST` (drop Beta), re-package, upload a new version, set visibility to **Public**.

## Notes

- Snippets run as async functions in the page context; thrown errors surface in the popup status
- Sites with a strict Content Security Policy (no `unsafe-eval`) block snippets; the popup reports this

## License

[MIT](LICENSE) © 2026 Gobinda Nandi

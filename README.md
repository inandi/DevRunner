# DevRunner

Lightweight **Manifest V3** browser extension for storing and running **site-specific JavaScript** snippets in the page **main world** (`window`). Built for local development and QA — clear storage, fill forms, trigger UI flows, without retyping console scripts.

**Author:** Gobinda Nandi \<gobinda.nandi.public@gmail.com\>  
**License:** [MIT](LICENSE) · **Privacy:** [PRIVACY.md](PRIVACY.md)  
**Version:** 1.0.0

Supports **Chromium** (Chrome, Edge, Brave, Opera), **Firefox**, and **Safari** (via Apple’s Web Extension converter).

## Features

- Scripts namespaced by hostname in `browser.storage.local` (plus a **global** deck)
- One-click run via `scripting.executeScript` with `world: "MAIN"`
- Add / delete snippets from the popup
- JSON **export / import** (replace-all on import)
- Keyboard shortcuts for the top 3 **domain** scripts (by `createdAt`)
- Cross-browser API via vendored [`webextension-polyfill`](https://github.com/mozilla/webextension-polyfill)

## Quick start (unpacked)

```bash
git clone <your-repo-url> DevRunner
cd DevRunner
npm install          # vendors lib/browser-polyfill.js
```

Load **this repo folder** (the directory that contains `manifest.json`), not `dist/` or `node_modules/`.

### Chromium (Chrome / Edge / Brave / Opera)

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. **Load unpacked** → select the DevRunner repo root

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** → choose `manifest.json`
3. Temporary add-ons are removed when Firefox quits

### Sample snippet (`localhost`)

**Name:** `Reset Storage & Reload`

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Usage

1. Open an `http`/`https` tab (e.g. `http://localhost:3000`)
2. Click the DevRunner toolbar icon
3. Add a script (optionally check **Save as global**)
4. **Run** executes in the page’s main world; status appears at the bottom of the popup

Restricted pages (`chrome://`, `about:`, extension pages, etc.) show an unsupported-page state. You can still save **global** scripts from those pages.

## Keyboard shortcuts

| Command | Default | Behavior |
|---------|---------|----------|
| Run domain script #1 | `Alt+Shift+1` | Oldest domain script for the current host |
| Run domain script #2 | `Alt+Shift+2` | Second oldest |
| Run domain script #3 | `Alt+Shift+3` | Third oldest |

Global scripts are **not** bound to these shortcuts. Rebind under:

- Chrome: `chrome://extensions/shortcuts`
- Firefox: Add-ons Manager → gear → Manage Extension Shortcuts
- Edge: `edge://extensions/shortcuts`

## Import / export

- **Export JSON** downloads the full `storage.local` object
- **Import JSON** validates the schema and **replaces all** stored scripts after confirm

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
  browser-polyfill.js      # Vendored (Mozilla) — do not edit by hand
  hostname.js              # Active tab → hostname
  storage.js               # storage.local CRUD + import validation
  execute.js               # scripting.executeScript world MAIN
icons/
scripts/
  vendor-polyfill.js       # npm postinstall copy step
  package.sh               # dist/ webext + store zips
```

Source modules attach to `globalThis.DevRunner` and load as classic scripts (no bundler). File headers use JSDoc (`@file`, `@license`, `@author`, `@version`).

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
| `dist/devrunner-webext/` | Clean extension tree |
| `dist/devrunner-chromium.zip` | Chrome Web Store / Edge Add-ons |
| `dist/devrunner-firefox.zip` | Firefox AMO (same payload; gecko id in manifest) |

Bump `version` in both `manifest.json` and `package.json` before each store upload.

### Safari (macOS)

Requires **Xcode** (`safari-web-extension-converter` is not in plain Command Line Tools).

```bash
npm run package
xcrun safari-web-extension-converter ./dist/devrunner-webext \
  --project-location ./safari-build \
  --app-name DevRunner \
  --bundle-identifier local.inandi.devrunner
```

`safari-build/` is gitignored. Signing and Mac App Store submission are manual in Xcode.

## Chrome Web Store (short checklist)

1. `npm run package`
2. Developer dashboard → upload `dist/devrunner-chromium.zip`
3. Listing: screenshots, description, category (Developer Tools)
4. Privacy practices → link this repo’s [PRIVACY.md](PRIVACY.md) (raw or GitHub Pages)
5. Justify `activeTab`, `scripting`, `storage`

## Notes

- Snippets run as functions in the page context; thrown errors surface in the popup status
- Prefer normal DOM/API calls over exotic eval patterns on strict-CSP sites
- Firefox id: `devrunner@inandi.local` (`browser_specific_settings.gecko`)
- `lib/browser-polyfill.js` is third-party (Mozilla); regenerate with `npm run vendor`

## License

[MIT](LICENSE) © 2026 Gobinda Nandi

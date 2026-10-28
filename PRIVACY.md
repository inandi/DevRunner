# Privacy Policy — DevRunner

**Last updated:** 2026-10-17  
**Author:** Gobinda Nandi \<gobinda.nandi.public@gmail.com\>

DevRunner is a browser extension that stores and runs JavaScript snippets you create.

## Data we collect

**None remotely.** DevRunner does not send your scripts, browsing history, or personal data to any server operated by the author.

## Data stored on your device

- Script decks (name, code, timestamps) are saved in the browser’s local extension storage (`browser.storage.local` / `chrome.storage.local`).
- Data stays on the device/profile where the extension is installed unless you export a JSON backup yourself.

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Read the current tab’s URL/hostname and run a script only when you open the popup or use a DevRunner keyboard shortcut |
| `scripting` | Execute your snippet in the page’s main world |
| `storage` | Persist scripts locally |

## Third parties

DevRunner does not include analytics SDKs or advertising networks. The vendored `webextension-polyfill` library runs locally as part of the extension.

## Contact

Questions about this policy: gobinda.nandi.public@gmail.com

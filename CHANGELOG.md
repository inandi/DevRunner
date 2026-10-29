# Release v0.1.1 - 2026-10-29

DevRunner is now **CAST** (Custom Automation Snippet Trigger). This beta adds copy-to-clipboard, async snippets, and feedback for keyboard shortcuts, and gives the popup a new design. Your saved scripts carry over when you update, with nothing to migrate.

## New Features
- **Copy script:** each script row has a copy button that puts the script's code on your clipboard. The button shows a checkmark when the copy succeeds.
- **Async snippets:** snippets can use `await` at the top level, and if a snippet returns a promise, CAST waits for it and shows the final value.
- **Shortcut feedback:** after `Alt+Shift+1/2/3`, the toolbar icon briefly shows **OK** (green) or **!** (red) if the script failed, no script is assigned to that number, or the page isn't supported.

## Improvements
- **New name and logo:** the extension is now **CAST (Beta)**, with a transparent logo on the toolbar and in the popup header.
- **New look:** a light, frosted-glass theme with see-through cards and soft shadows replaces the dark theme.
- **Scrolling script list:** only the script list scrolls now, with its own scrollbar, so the Add form stays visible.
- **Simpler layout:**
  - Export and Import are now buttons in the popup header.
  - Status messages appear as small notifications that disappear on their own.
  - The Add button has a new design.
- **Clearer errors:** on sites that block running scripts (for example GitHub), CAST now says so plainly instead of showing a technical error.
- **Smaller package:** CAST now uses Chrome's own APIs and has no third-party code.

## Bug Fixes
- Fixed async snippets showing `{}` instead of their real result.
- Fixed saving on a page CAST can't run on (such as `chrome://`): after saving one global script, the next save failed.
- Fixed the export download sometimes being cancelled before it started.

## Deprecated Features
- **Firefox and Safari support is paused.** This release supports Google Chrome only.
- **Export file name changed** from `devrunner-export-<date>.json` to `cast-export-<date>.json`. Older backup files still import normally.

## Known Issues
- **Sites with strict security settings** (no `unsafe-eval`, such as GitHub) block snippets. CAST shows a clear message, but the snippet doesn't run.
- **No way to edit a saved script yet.** To change one, copy it, delete it, and add it again.
- **Shortcut numbering:** `Alt+Shift+1/2/3` run the oldest three scripts for the current site. The popup doesn't yet show which script has which number, and deleting a script moves the later ones up.
- **Import replaces everything:** it overwrites all saved scripts without a preview, so export a backup first.
- **Ports are ignored:** `localhost:3000` and `localhost:8080` share one script list.
- **Import may close the popup:** on some systems the popup can close when the file picker opens. If that happens, try the import again.
- **Notifications can cover the Add button** for a few seconds while they're showing.

## Acknowledgments
- Thanks to everyone testing the CAST beta. Please send feedback and bug reports to gobinda.nandi.public@gmail.com.

---


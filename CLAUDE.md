# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Loading the extension

There is no build step. Load it directly into Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder (the one containing `manifest.json`)
4. After any source file change, click the reload button on the extension's card at `chrome://extensions`, then reload the target tab.

## Architecture

This is a Manifest V3 Chrome extension with three moving parts that must cooperate across Chrome's world boundaries:

### World boundary problem

Chrome content scripts run in an **ISOLATED world** — they can call `chrome.*` APIs but share no JS scope with the page. `navigator.geolocation` lives in the **MAIN world** (the page's own JS environment). You cannot override it from the ISOLATED world directly.

### How the override is delivered

`content.js` runs in the ISOLATED world at `document_start` (before any page script). It:
1. Reads settings from `chrome.storage.local`
2. Bakes the coordinate values into a self-contained IIFE string
3. Appends a `<script>` element to `document.documentElement`, which executes synchronously in the MAIN world
4. Immediately removes the element from the DOM

This inline-script injection is the only reliable way to patch MAIN-world globals from a content script in MV3 (the `world: "MAIN"` content script option cannot access `chrome.storage`, so settings cannot be passed to it without this bridge).

### Settings flow

```
popup.js  →  chrome.storage.local  →  content.js (on next page load)
          →  chrome.runtime.sendMessage(SETTINGS_UPDATED)
          →  background.js reloads active tab
```

Settings are stored under the key `locationSpoofer` as `{ enabled, latitude, longitude, accuracy }`.

### Key constraints to preserve

- `content.js` must stay as an ISOLATED-world script (`run_at: document_start`, no `world` key in manifest). Do not move spoofing logic directly into a `world: "MAIN"` content script — it would lose access to `chrome.storage.local`.
- The inline script must bake values as numeric literals, not pass them via DOM attributes, to avoid XSS concerns from arbitrary storage values being injected into page HTML.
- `background.js` is a service worker — no DOM access, no persistent state outside `chrome.storage`.

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

`background.js` listens to `chrome.webNavigation.onCommitted` (fires before page scripts run). On each main-frame navigation it:
1. Reads settings from `chrome.storage.local`
2. Calls `chrome.scripting.executeScript` with `world: 'MAIN'` and `injectImmediately: true`, passing the spoof function and coordinates as arguments

`chrome.scripting.executeScript` injections bypass the page's Content Security Policy — they are applied by Chrome's extension host process, not by the renderer's inline-script checks. This is the correct MV3 replacement for the old `<script>` tag injection pattern.

### Settings flow

```
popup.js  →  chrome.storage.local
          →  chrome.runtime.sendMessage(SETTINGS_UPDATED)
          →  background.js reloads active tab
          →  webNavigation.onCommitted fires → executeScript injects spoof
```

Settings are stored under the key `locationSpoofer` as `{ enabled, latitude, longitude, accuracy }`.

### Key constraints to preserve

- Keep the spoof function (`spoofGeolocation`) as a named top-level function in `background.js`. `executeScript` serialises the function reference — it cannot close over service-worker variables, so coordinates must be passed via `args`.
- `background.js` is a service worker — no DOM access, no persistent state outside `chrome.storage`.
- There is no content script. Do not reintroduce an inline `<script>` tag injection approach — it is blocked by strict CSP pages.

# Location Spoofer

A Chrome browser extension (Manifest V3) that overrides `navigator.geolocation` to report any coordinates you choose, instead of your real device location.

---

## Features

- Enable/disable spoofing with a single toggle
- Set any latitude, longitude, and accuracy value
- 8 built-in city presets (London, New York, Tokyo, Sydney, Paris, Dubai, Hong Kong, Singapore)
- Settings persist across browser sessions via `chrome.storage.local`
- Override is injected before page scripts run — works even on sites that cache the geolocation API on load

---

## Installation

Chrome does not allow side-loaded extensions from the Web Store, so you load it in **Developer mode**:

1. Clone or download this repository and note the folder path.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the `browserlocation` folder (the one containing `manifest.json`).
6. The **Location Spoofer** icon appears in your Chrome toolbar.

> To update the extension after editing source files, click the reload button (circular arrow) on its card at `chrome://extensions`.

---

## Usage

1. Click the **Location Spoofer** icon in the Chrome toolbar to open the popup.
2. Enter the **Latitude** and **Longitude** you want to report, and optionally an **Accuracy** value in metres.
   - Or click one of the **Quick presets** to fill in a city's coordinates automatically.
3. Toggle **Spoof enabled** to the on position.
4. Click **Apply & Reload Tab**.

The active tab reloads, and any subsequent calls to `navigator.geolocation.getCurrentPosition()` or `watchPosition()` on that tab will receive your fake coordinates.

To restore real geolocation, open the popup, toggle **Spoof enabled** off, and click **Apply & Reload Tab**.

### Coordinate reference

| Field | Valid range | Example |
|---|---|---|
| Latitude | −90 to 90 | `51.5074` (London) |
| Longitude | −180 to 180 | `-0.1278` (London) |
| Accuracy | any positive number (metres) | `50` |

---

## How it works

```
chrome.storage.local
       │
       ▼
content.js (ISOLATED world, document_start)
  reads settings → injects <script> into MAIN world
       │
       ▼
Inline script (MAIN world)
  Object.defineProperty(navigator, 'geolocation', spoofed)
       │
       ▼
Page scripts call navigator.geolocation → receive fake position
```

The content script runs in Chrome's **ISOLATED world** at `document_start`, which lets it read from `chrome.storage.local`. It then injects a small inline `<script>` element into the page's **MAIN world** that replaces `navigator.geolocation` with a spoofed implementation. This happens before any page script executes, so the override is always in place from the first geolocation request.

The background service worker (`background.js`) listens for a `SETTINGS_UPDATED` message from the popup and reloads the active tab so the new content script picks up the updated settings.

---

## File structure

```
browserlocation/
├── manifest.json      # MV3 extension manifest
├── background.js      # Service worker — reloads tab on settings change
├── content.js         # ISOLATED-world script — patches navigator.geolocation
├── popup.html         # Extension popup markup
├── popup.css          # Popup styles
├── popup.js           # Popup logic (load/save settings, preset buttons)
└── icons/
    ├── icon.svg       # Source vector icon
    ├── icon16.png     # 16×16 toolbar icon
    ├── icon48.png     # 48×48 extensions page icon
    └── icon128.png    # 128×128 Chrome Web Store icon
```

---

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persist spoofing settings between popup opens and browser restarts |
| `activeTab` | Reload the currently active tab after settings change |
| `host_permissions: <all_urls>` | Inject the content script on every site |

---

## Limitations

- The override applies only to the JavaScript `navigator.geolocation` API. It does not affect the IP-based geolocation that servers may infer from your network connection, or the `X-Forwarded-For` / `CF-IPCountry` headers some CDNs add.
- Settings apply globally to all tabs. Reloading a tab after disabling spoofing restores native geolocation for that tab.
- The extension targets Chrome (and Chromium-based browsers). It is not tested on Firefox or Safari.

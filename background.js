const DEFAULTS = { enabled: false, latitude: 51.5074, longitude: -0.1278, accuracy: 50 };

// Injected into the page's MAIN world via chrome.scripting.executeScript.
// This bypasses the page's Content Security Policy.
function spoofGeolocation(lat, lng, acc) {
  function makePos() {
    return {
      coords: {
        latitude: lat, longitude: lng, accuracy: acc,
        altitude: null, altitudeAccuracy: null, heading: null, speed: null,
      },
      timestamp: Date.now(),
    };
  }
  const spoofed = {
    getCurrentPosition(ok)  { setTimeout(() => ok(makePos()), 0); },
    watchPosition(ok)       { setTimeout(() => ok(makePos()), 0); return Math.floor(Math.random() * 1e9); },
    clearWatch()            {},
  };
  try {
    Object.defineProperty(navigator, 'geolocation', { get: () => spoofed, configurable: true });
  } catch (e) {}
}

async function tryInject(tabId, frameId) {
  const stored = await chrome.storage.local.get('locationSpoofer');
  const s = { ...DEFAULTS, ...stored.locationSpoofer };
  if (!s.enabled) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: [frameId] },
      world: 'MAIN',
      injectImmediately: true,
      func: spoofGeolocation,
      args: [s.latitude, s.longitude, s.accuracy],
    });
  } catch (_) {
    // Tab may have closed or navigation changed before injection.
  }
}

// Fires when a navigation is committed (before page scripts run).
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // main frame only
  tryInject(details.tabId, details.frameId);
});

// Reload the active tab after the popup saves new settings.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SETTINGS_UPDATED') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
    sendResponse({ ok: true });
  }
});

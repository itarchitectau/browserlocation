// Listens for messages from the popup and reloads the active tab so the
// new content script picks up the updated settings.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SETTINGS_UPDATED') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
    sendResponse({ ok: true });
  }
});

// Darkly Suite — Offscreen Document
// Provides geolocation access for the background service worker.

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'get-geolocation') {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendResponse({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('[Darkly Suite] Geolocation error:', error.message);
        sendResponse({ error: error.message });
      },
      {
        timeout: 10000,
        maximumAge: 300000,
      }
    );
    return true;
  }
});

chrome.runtime.sendMessage({ type: 'offscreen-ready' });

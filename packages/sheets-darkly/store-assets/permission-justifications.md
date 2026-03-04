# Permission Justifications — Darkly for Google Sheets

Each permission listed in manifest.json requires a justification in the Chrome Web Store
Privacy Practices tab. These are copy-paste ready for the submission form.

## Permissions

### storage

Stores user preferences (dark mode on/off, schedule times, preserve grid colors setting)
and an anonymous device token for subscription verification using chrome.storage.sync so
settings persist across sessions and sync across the user's Chrome browsers. No personal
data is stored.

### alarms

Runs periodic checks for schedule-based and sunrise/sunset dark mode. An alarm fires
every minute to determine whether dark mode should be active based on the user's
configured schedule or local sunrise/sunset times. Also used for background polling
after Stripe checkout to detect when payment completes (polls every 30 seconds for
up to 60 minutes after checkout).

### offscreen

Creates an offscreen document to access the browser's Geolocation API, which is not
available in Manifest V3 service workers. Used only when the user opts into
sunrise/sunset scheduling. The offscreen document requests the user's approximate
location (with the browser's permission prompt) to calculate sunrise and sunset times.

## Host Permissions

### https://docs.google.com/*

Content scripts inject dark mode CSS and the settings panel UI into Google Sheets pages.
Content scripts match the narrower `docs.google.com/spreadsheets/*` pattern to apply
themes and render controls only on spreadsheet pages.

### https://darklysuite.com/*

Communicates with the Darkly payment API to check subscription status and initiate
checkout. An anonymous device token (randomly generated UUID) is sent to verify whether
the user has a paid subscription. No personal information is transmitted.

A lightweight content script (`landing-bridge.js`) also runs on darklysuite.com pages
to enable token handoff between the extension and the checkout page. The content script
passes the extension's anonymous device token to the page via a CustomEvent so that
Stripe licenses are linked to the correct extension instance. It also listens for a
checkout-complete event from the success page so the extension can begin polling for
the new license immediately.

## Content Script Domains

### sheetsdarkly.com and darklysuite.com (landing-bridge.js)

A small content script (`landing-bridge.js`) runs on sheetsdarkly.com and darklysuite.com
to bridge communication between the web page and the extension's background worker.
It serves two purposes:

1. **Token handoff** - When the user visits the subscribe or checkout page, the content
   script retrieves the extension's anonymous device token from the background worker
   and passes it to the page via a CustomEvent. This ensures the Stripe license is linked
   to the correct extension instance without requiring the user to copy/paste any IDs.

2. **Checkout completion** - After a successful Stripe payment, the success page dispatches
   a CustomEvent that the content script forwards to the background worker, triggering
   immediate license polling so the user doesn't have to wait for the next scheduled check.

No page content is read, modified, or transmitted. The content script only exchanges
the extension's own anonymous token and a checkout-complete signal.

### https://api.sunrise-sunset.org/*

Fetches sunrise and sunset times for the user's approximate location when they opt into
sunrise/sunset scheduling. Only latitude and longitude coordinates are sent. This is a
public, free API with no authentication required.

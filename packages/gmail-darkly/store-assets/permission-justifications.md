# Permission Justifications — Darkly for Gmail

Each permission listed in manifest.json requires a justification in the Chrome Web Store
Privacy Practices tab. These are copy-paste ready for the submission form.

## Permissions

### storage

Stores user preferences (dark mode on/off, schedule times, theme settings) and an
anonymous device token for subscription verification using chrome.storage.sync so
settings persist across sessions and sync across the user's Chrome browsers. No
personal data is stored.

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

### scripting

Required by the InboxSDK library to register content scripts that integrate the dark
mode toggle button and settings panel directly into Gmail's toolbar interface. InboxSDK
uses chrome.scripting.registerContentScripts() to inject UI components into Gmail.

## Host Permissions

### https://mail.google.com/*

The extension's core functionality: injecting dark mode CSS and the settings panel UI
into Gmail pages. Content scripts match this pattern to apply themes and render controls.

### https://darklysuite.com/*

Communicates with the Darkly payment API to check subscription status and initiate
checkout. An anonymous device token (randomly generated UUID) is sent to verify whether
the user has a paid subscription. No personal information is transmitted.

Also used for `externally_connectable` messaging: the darklysuite.com checkout page
can request the extension's device token so that Stripe licenses are linked to the
correct extension instance. This communication is restricted to darklysuite.com by
the manifest's `externally_connectable.matches` field.

### https://api.sunrise-sunset.org/*

Fetches sunrise and sunset times for the user's approximate location when they opt into
sunrise/sunset scheduling. Only latitude and longitude coordinates are sent. This is a
public, free API with no authentication required.

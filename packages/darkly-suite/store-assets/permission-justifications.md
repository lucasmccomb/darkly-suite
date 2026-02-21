# Permission Justifications — Darkly Suite

Each permission listed in manifest.json requires a justification in the Chrome Web Store
Privacy Practices tab. These are copy-paste ready for the submission form.

Note: Darkly Suite is a bundle extension that provides dark mode for Gmail, Google Sheets,
Google Docs, and Google Drive in a single extension. It requires host permissions for all four
Google apps, plus the scripting permission for Gmail's InboxSDK integration.

## Permissions

### storage

Stores user preferences (dark mode on/off, schedule times, theme preset) for each
supported Google app using chrome.storage.sync so settings persist across sessions and
sync across the user's Chrome browsers. Each app has its own preferences key
(ds_gmail_preferences, ds_sheets_preferences, ds_docs_preferences, ds_drive_preferences). Also uses
chrome.storage.local for pro status cache and sunrise/sunset times cache. No personal
data is stored.

### alarms

Runs periodic checks (every minute) for schedule-based and sunrise/sunset dark mode
across all four supported Google apps. Determines whether dark mode should be active
on each app based on the user's configured schedule or local sunrise/sunset times.

### offscreen

Creates an offscreen document to access the browser's Geolocation API, which is not
available in Manifest V3 service workers. Used only when the user opts into
sunrise/sunset scheduling. The offscreen document requests the user's approximate
location (with the browser's permission prompt) to calculate sunrise and sunset times.

### scripting

Required by the InboxSDK library to register content scripts that integrate the dark
mode toggle button and settings panel directly into Gmail's toolbar interface. InboxSDK
uses chrome.scripting.registerContentScripts() to inject UI components into Gmail. This
permission is only used for the Gmail integration within the bundle.

## Host Permissions

### https://mail.google.com/*

Content scripts inject dark mode CSS and the settings panel UI into Gmail pages. This is
the core functionality for the Gmail portion of the bundle — applying themes and rendering
dark mode controls within the Gmail interface.

### https://docs.google.com/spreadsheets/*

Content scripts inject dark mode CSS and the settings panel UI into Google Sheets pages.
This narrower pattern ensures themes and controls are applied only on spreadsheet pages,
not other docs.google.com content.

### https://docs.google.com/document/*

Content scripts inject dark mode CSS and the settings panel UI into Google Docs pages.
This narrower pattern ensures themes and controls are applied only on document pages,
not other docs.google.com content.

### https://drive.google.com/*

Content scripts inject dark mode CSS and the settings toggle into Google Drive pages.
This enables dashboard-level dark mode theming for the Drive file manager interface.
No Drive file content is read or modified.

### https://darklysuite.com/*

Communicates with the Darkly payment API to check license status. An anonymous device
token (randomly generated UUID) is sent to verify whether the user has a paid license.
No personal information is transmitted.

### https://api.sunrise-sunset.org/*

Fetches sunrise and sunset times for the user's approximate location when they opt into
sunrise/sunset scheduling. Only latitude and longitude coordinates are sent. This is a
public, free API with no authentication required.

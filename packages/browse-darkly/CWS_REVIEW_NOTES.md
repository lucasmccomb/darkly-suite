# Chrome Web Store Review Notes

## Permission Justifications

| Permission | Justification |
|-----------|---------------|
| `sidePanel` | Full settings UI in Chrome's side panel |
| `storage` | Store user preferences, per-domain settings, payment tokens |
| `tabs` | Query active tab URL for per-domain settings |
| `activeTab` | Apply dark mode CSS to current page |
| `alarms` | Schedule-based dark mode, sunrise/sunset check, checkout polling |
| `identity` | Google OAuth for payment/license management |
| `identity.email` | Pre-fill email in checkout flow |

## Host Permission Justification

| Permission | Justification |
|-----------|---------------|
| `<all_urls>` | Core functionality: inject dark mode CSS on any website |
| `https://darklysuite.com/*` | Payment API, license validation, checkout flow |
| `https://api.sunrise-sunset.org/*` | Sunrise/sunset times for auto dark mode scheduling |

## Content Scripts

| Script | World | Purpose |
|--------|-------|---------|
| `content.js` | ISOLATED | Inject dark mode CSS, handle toggle messages |
| `page-world.js` | MAIN | Override matchMedia for prefers-color-scheme |

## Data Handling

- No user data collected or transmitted
- All preferences stored locally in chrome.storage
- Domain names hashed (SHA-256) before any reporting
- License token is a random UUID, not linked to personal data
- No analytics, telemetry, or tracking

## Privacy Policy

Available at https://browsedarkly.com/privacy

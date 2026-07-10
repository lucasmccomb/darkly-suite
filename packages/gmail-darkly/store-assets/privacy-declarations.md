# Privacy Declarations — Darkly for Gmail

Chrome Web Store requires declarations about data collection and usage.
These map to the Privacy Practices tab in the developer dashboard.

## Single Purpose Description

Darkly for Gmail applies a dark mode theme to Gmail with automatic scheduling
based on time of day, sunrise/sunset, or OS theme preference. A paid subscription
is required for all features.

## Privacy Policy URL

https://gmaildarkly.com/privacy

## Data Use Declarations

The Chrome Web Store asks about specific data types. For each, declare whether
it is collected, the purpose, whether it is sold, and whether it is transmitted.

### Personally identifiable information

- Collected: YES (email address — purchase and restore flows only)
- Use purpose: Functionality — when the user starts a purchase or restores a previous
  purchase, the extension opens darklysuite.com, where the user signs in with Google.
  The email address from that sign-in is stored server-side in the darklysuite.com
  license database, linked to the extension's anonymous device token, so the license
  can be verified and restored after a reinstall.
- Sold to third parties: NO
- Transmitted to entities outside the extension: YES — to darklysuite.com (our payment
  backend); Stripe also receives it as the checkout email during payment
- Note: The extension itself never reads or stores the email address. Collection happens
  in the darklysuite.com web flow that the user explicitly initiates; routine license
  checks send only the anonymous device token.

### Health information

- Collected: NO

### Financial and payment information

- Collected: NO
- Note: Payments are handled entirely by Stripe's hosted checkout. The extension
  never sees or stores payment details.

### Authentication information

- Collected: NO
- Note: An anonymous device token (randomly generated UUID) is stored locally and
  sent to darklysuite.com to check license status. The token itself contains no
  personal information; after a purchase, the darklysuite.com license database
  associates it with the purchaser's email address (see "Personally identifiable
  information" above).

### Personal communications

- Collected: NO
- Note: The extension does not read, access, or store any email content.

### Location

- Collected: YES (with user opt-in only)
- Use purpose: Functionality — calculating sunrise/sunset times for automatic scheduling
- Sold to third parties: NO
- Transmitted to entities outside the extension: YES — approximate coordinates are sent
  to the public sunrise-sunset.org API to retrieve sunrise/sunset times
- Note: Location is requested only when the user enables sunrise/sunset mode. The browser
  shows its own permission dialog. Coordinates are rounded to 1 decimal place (~11 km)
  before transmission; only the rounded values are sent and cached locally for up to
  24 hours.

### Web history

- Collected: NO

### User activity

- Collected: NO

### Website content

- Collected: NO
- Note: The extension injects CSS for dark mode theming but does not read or extract
  any page content.

## Remote Code

Does this extension execute remote code?

NO — All code is bundled in the extension package. No remote scripts are loaded or executed.

## Data Usage Certifications

- [ ] I certify that the extension does not sell user data to third parties
- [ ] I certify that the extension does not use or transfer user data for purposes
      unrelated to the extension's single purpose
- [ ] I certify that the extension does not use or transfer user data to determine
      creditworthiness or for lending purposes

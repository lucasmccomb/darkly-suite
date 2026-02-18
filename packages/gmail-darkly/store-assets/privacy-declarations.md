# Privacy Declarations — Darkly for Gmail

Chrome Web Store requires declarations about data collection and usage.
These map to the Privacy Practices tab in the developer dashboard.

## Single Purpose Description

Darkly for Gmail applies a dark mode theme to Gmail with automatic scheduling
based on time of day, sunrise/sunset, or OS theme preference.

## Privacy Policy URL

https://gmaildarkly.com/privacy

## Data Use Declarations

The Chrome Web Store asks about specific data types. For each, declare whether
it is collected, the purpose, whether it is sold, and whether it is transmitted.

### Personally identifiable information

- Collected: NO

### Health information

- Collected: NO

### Financial and payment information

- Collected: NO
- Note: Payments are handled entirely by Stripe's hosted checkout. The extension
  never sees or stores payment details.

### Authentication information

- Collected: NO
- Note: An anonymous device token (randomly generated UUID) is stored locally and
  sent to darklysuite.com to check license status. This token contains no personal
  information and cannot be linked to a user's identity.

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
  shows its own permission dialog. Coordinates are cached locally for up to 24 hours.

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

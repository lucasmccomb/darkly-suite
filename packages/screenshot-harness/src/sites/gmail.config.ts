import { SiteConfig } from '../types';

export const gmailConfig: SiteConfig = {
  id: 'gmail',
  name: 'Gmail',
  tokensPath: 'gmail.css',
  layout: {
    header: {
      productName: 'Gmail',
      productLogo: '\u2709\uFE0F',
      searchPlaceholder: 'Search mail',
      brandColor: undefined,
    },
    sidebar: {
      fabButton: {
        label: 'Compose',
        icon: '\u270F\uFE0F',
      },
      items: [
        { icon: '\uD83D\uDCE5', label: 'Inbox', badge: '3', active: true },
        { icon: '\u2B50', label: 'Starred' },
        { icon: '\u23F0', label: 'Snoozed' },
        { icon: '\uD83D\uDCE4', label: 'Sent' },
        { icon: '\uD83D\uDCC4', label: 'Drafts', badge: '2' },
        { icon: '\u25B6\uFE0F', label: 'More' },
      ],
    },
    companion: true,
  },
};

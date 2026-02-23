/**
 * Bootstrap list of domains known to have native dark mode.
 * Browse Darkly skips these by default to avoid double-darkening.
 * This is a static list — algorithmic detection in isDarkSite() handles the rest.
 */
export const DARK_SITES: ReadonlySet<string> = new Set([
  // Developer tools
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'codepen.io',
  'codesandbox.io',
  'replit.com',
  'vercel.com',
  'netlify.com',
  'railway.app',

  // Code editors / docs
  'code.visualstudio.com',
  'developer.mozilla.org',

  // Social / media
  'twitter.com',
  'x.com',
  'discord.com',
  'twitch.tv',
  'spotify.com',
  'netflix.com',
  'hulu.com',
  'disneyplus.com',
  'primevideo.com',
  'youtube.com', // YouTube auto-detects dark mode

  // Productivity
  'notion.so',
  'linear.app',
  'figma.com',
  'slack.com',
  'obsidian.md',

  // Others with native dark
  'duckduckgo.com',
  'brave.com',
  'proton.me',
  'protonmail.com',
  'signal.org',
]);

/** Check if a domain is in the known dark sites list. */
export function isKnownDarkSite(domain: string): boolean {
  // Check exact match first, then check parent domain
  if (DARK_SITES.has(domain)) return true;

  // Check if subdomain of a known dark site (e.g., app.slack.com -> slack.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DARK_SITES.has(parent)) return true;
  }

  return false;
}

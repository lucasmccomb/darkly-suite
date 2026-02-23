// Runs in the page's main world (not content script isolated world).
// Overrides matchMedia to report dark scheme preference when Browse Darkly is active.

const ATTR = 'data-darkly-active';

// Store the original matchMedia
const originalMatchMedia = window.matchMedia.bind(window);

// Override matchMedia to fake prefers-color-scheme: dark
window.matchMedia = function (query: string): MediaQueryList {
  const result = originalMatchMedia(query);

  // Only intercept prefers-color-scheme queries when Browse Darkly is active
  if (
    query.includes('prefers-color-scheme') &&
    document.documentElement.hasAttribute(ATTR)
  ) {
    const isDarkQuery = query.includes('dark');
    const isLightQuery = query.includes('light');

    return Object.create(result, {
      matches: {
        get() {
          return isDarkQuery ? true : isLightQuery ? false : result.matches;
        },
      },
    });
  }

  return result;
};

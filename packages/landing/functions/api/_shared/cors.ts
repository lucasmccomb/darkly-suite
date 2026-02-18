const ALLOWED_WEB_ORIGINS = [
  'https://darklysuite.com',
  'https://www.darklysuite.com',
  'https://mail.google.com',
  'https://docs.google.com',
  'https://sheets.google.com',
];

// Chrome extension IDs are exactly 32 lowercase a-p characters
const EXTENSION_ORIGIN_RE = /^chrome-extension:\/\/([a-p]{32})$/;

function isAllowedExtension(origin: string, allowedExtensionIds?: string[]): boolean {
  const match = origin.match(EXTENSION_ORIGIN_RE);
  if (!match) return false;

  // No allowlist configured → permit all extensions (local development)
  if (!allowedExtensionIds || allowedExtensionIds.length === 0) return true;

  return allowedExtensionIds.includes(match[1]);
}

/**
 * @param allowedExtensionIds - Parsed list of allowed Chrome extension IDs.
 *   Pass `parseExtensionIds(env.ALLOWED_EXTENSION_IDS)` from callers.
 *   When undefined/empty, all chrome-extension:// origins are allowed (dev mode).
 */
export function corsHeaders(origin?: string, allowedExtensionIds?: string[]): HeadersInit {
  const isAllowed =
    origin &&
    (ALLOWED_WEB_ORIGINS.includes(origin) || isAllowedExtension(origin, allowedExtensionIds));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_WEB_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/** Parse the comma-separated ALLOWED_EXTENSION_IDS env var into an array. */
export function parseExtensionIds(envValue?: string): string[] | undefined {
  if (!envValue) return undefined;
  return envValue
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

export function handleOptions(request: Request, allowedExtensionIds?: string[]): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin') ?? undefined, allowedExtensionIds),
  });
}

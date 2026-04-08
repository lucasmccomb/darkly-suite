// Google app origins where extensions run — always allowed for CORS
const GOOGLE_APP_ORIGINS = [
  'https://mail.google.com',
  'https://docs.google.com',
  'https://sheets.google.com',
];

// Chrome extension IDs are exactly 32 lowercase a-p characters
const EXTENSION_ORIGIN_RE = /^chrome-extension:\/\/([a-p]{32})$/;

function isAllowedExtension(
  origin: string,
  allowedExtensionIds?: string[],
  environment?: string,
): boolean {
  const match = origin.match(EXTENSION_ORIGIN_RE);
  if (!match) return false;

  // Allowlist configured → only permit listed IDs
  if (allowedExtensionIds && allowedExtensionIds.length > 0) {
    return allowedExtensionIds.includes(match[1]);
  }

  // No allowlist + development → permit all extensions (local dev convenience)
  if (environment === 'development') return true;

  // No allowlist + production → fail closed
  return false;
}

/** Derive allowed web origins from SITE_URL (e.g. "https://darklysuite.com" → bare + www). */
function getSiteOrigins(siteUrl: string): string[] {
  const url = new URL(siteUrl);
  const bare = url.hostname.replace(/^www\./, '');
  return [
    `${url.protocol}//${bare}`,
    `${url.protocol}//www.${bare}`,
  ];
}

/**
 * @param siteUrl - The SITE_URL env var (e.g. "https://darklysuite.com").
 *   Used to derive allowed web origins. When omitted, only Google app origins
 *   and extensions are allowed.
 * @param allowedExtensionIds - Parsed list of allowed Chrome extension IDs.
 *   Pass `parseExtensionIds(env.ALLOWED_EXTENSION_IDS)` from callers.
 *   When undefined/empty in production, all chrome-extension:// origins are rejected.
 *   When undefined/empty in development, all chrome-extension:// origins are allowed.
 * @param environment - The ENVIRONMENT env var. Pass `env.ENVIRONMENT` from callers.
 *   "development" enables relaxed extension CORS when no allowlist is set.
 *   Any other value (or undefined) requires the allowlist to be set.
 */
export function corsHeaders(
  origin?: string,
  siteUrl?: string,
  allowedExtensionIds?: string[],
  environment?: string,
): HeadersInit {
  const siteOrigins = siteUrl ? getSiteOrigins(siteUrl) : [];
  const allowedOrigins = [...siteOrigins, ...GOOGLE_APP_ORIGINS];
  const defaultOrigin = siteOrigins[0] ?? GOOGLE_APP_ORIGINS[0];

  const isAllowed =
    origin &&
    (allowedOrigins.includes(origin) ||
      isAllowedExtension(origin, allowedExtensionIds, environment));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : defaultOrigin,
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

export function handleOptions(
  request: Request,
  siteUrl?: string,
  allowedExtensionIds?: string[],
  environment?: string,
): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(
      request.headers.get('Origin') ?? undefined,
      siteUrl,
      allowedExtensionIds,
      environment,
    ),
  });
}

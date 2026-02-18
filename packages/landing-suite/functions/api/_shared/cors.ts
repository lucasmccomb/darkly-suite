export function corsHeaders(origin?: string): HeadersInit {
  const allowedOrigins = [
    'https://darklysuite.com',
    'https://www.darklysuite.com',
    'https://mail.google.com',
    'https://docs.google.com',
    'https://sheets.google.com',
  ];
  const isExtension = origin?.startsWith('chrome-extension://');
  const isAllowed = origin && (allowedOrigins.includes(origin) || isExtension);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function handleOptions(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get('Origin') ?? undefined),
  });
}

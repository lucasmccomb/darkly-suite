/**
 * Google OAuth 2.0 helper -- raw fetch, no external libraries.
 */

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email',
    access_type: 'online',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

interface TokenResponse {
  id_token: string
  access_token: string
  token_type: string
  expires_in: number
}

export async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google token exchange failed (${res.status}): ${err}`)
  }

  return res.json() as Promise<TokenResponse>
}

interface IdTokenPayload {
  iss: string
  sub: string
  aud: string
  email: string
  email_verified: boolean
  exp: number
  iat: number
}

/**
 * Decode a Google ID token (JWT) and extract claims.
 * Validates issuer, audience, and expiry. Skips signature verification
 * since the token comes directly from Google's token endpoint over HTTPS.
 */
export function decodeIdToken(idToken: string, expectedAudience: string): IdTokenPayload {
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT: expected 3 parts')
  }

  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as IdTokenPayload

  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
    throw new Error(`Invalid JWT issuer: ${payload.iss}`)
  }

  if (payload.aud !== expectedAudience) {
    throw new Error(`Invalid JWT audience: ${payload.aud}`)
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now - 60) {
    throw new Error('JWT has expired')
  }

  return payload
}

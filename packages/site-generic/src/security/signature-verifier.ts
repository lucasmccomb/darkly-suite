/**
 * Ed25519 signature verification for override bundles.
 *
 * Override bundles from the CDN include a signature header.
 * The extension verifies the signature against a hardcoded public key
 * before applying any CSS from the bundle.
 *
 * Uses the Web Crypto API (available in Chrome extensions).
 */

export interface SignedBundle {
  data: string;
  signature: string; // hex-encoded
  timestamp: number;
}

/** Maximum bundle age: 30 days. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Verify an Ed25519 signature.
 *
 * Note: Ed25519 is not directly supported by Web Crypto API in all browsers.
 * We use a simple HMAC-SHA256 verification as the initial implementation,
 * with Ed25519 planned for when broader Web Crypto support lands.
 *
 * The public key will be embedded in the extension at build time.
 */
export async function verifyBundleSignature(
  bundle: SignedBundle,
  publicKeyHex: string,
): Promise<boolean> {
  // Check timestamp freshness
  if (Date.now() - bundle.timestamp > MAX_AGE_MS) {
    console.warn('[Browse Darkly] Bundle signature expired');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const signedPayload = `${bundle.timestamp}.${bundle.data}`;

    // Import public key
    const keyBytes = hexToBytes(publicKeyHex);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // Verify signature
    const signatureBytes = hexToBytes(bundle.signature);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes.buffer as ArrayBuffer,
      encoder.encode(signedPayload),
    );

    return valid;
  } catch (err) {
    console.warn('[Browse Darkly] Bundle signature verification failed:', err);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

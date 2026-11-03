/**
 * Encodes bytes as base64url without trailing padding.
 *
 * @param input - Raw bytes or UTF-8 string.
 * @returns Base64url-encoded string.
 */
export function encodeBase64Url(input: Buffer | string): string {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf-8');
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Decodes a base64url value into raw bytes.
 *
 * @param input - Base64url string.
 * @returns Decoded bytes.
 */
export function decodeBase64UrlBytes(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
}

/**
 * Decodes a base64url JSON segment.
 *
 * @param input - Base64url JSON string.
 * @returns Parsed object when decoding succeeds; otherwise null.
 */
export function decodeBase64UrlJson<T>(input: string): T | null {
  try {
    return JSON.parse(decodeBase64UrlBytes(input).toString('utf-8')) as T;
  } catch {
    return null;
  }
}

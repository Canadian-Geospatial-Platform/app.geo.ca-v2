/**
 * Parsed JWT segments used during signature verification.
 */
export type JwtParts = {
  header: string;
  payload: string;
  signature: string;
  signingInput: string;
};

/**
 * Splits a compact JWT into header, payload, and signature segments.
 *
 * @param token - Raw JWT string.
 * @returns Parsed parts when token has exactly three segments; otherwise null.
 */
export function splitJwt(token: string): JwtParts | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    return null;
  }

  return {
    header: parts[0],
    payload: parts[1],
    signature: parts[2],
    signingInput: `${parts[0]}.${parts[1]}`,
  };
}

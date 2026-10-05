import { createSign, randomUUID } from 'node:crypto';
import { encodeBase64Url } from '$lib/utils/auth/base64url';

const CLIENT_ASSERTION_TTL_SECONDS = 5 * 60;

/**
 * Creates a JWT assertion for private_key_jwt client authentication per RFC 7523.
 * The assertion is signed with an RSA private key and used in token endpoint requests
 * to replace the client_secret in client_secret_post authentication.
 *
 * JWT claims:
 * - iss (issuer): client_id
 * - sub (subject): client_id
 * - aud (audience): token endpoint URL
 * - iat (issued at): current time in epoch seconds
 * - exp (expiration): iat + 300 seconds (5 minutes)
 *
 * JWT header:
 * - alg: RS256
 * - typ: JWT
 * - kid: Optional Key ID (e.g., "staging-nrcan-geoca-signer") to help provider identify the signing key
 * - x5t#S256: Optional SHA-256 thumbprint of the client certificate
 *
 * @param clientId - OIDC client identifier
 * @param tokenEndpointUrl - Full URL to the OIDC provider's token endpoint
 * @param privateKeyPem - RSA private key in PEM format (PKCS8)
 * @param x5tS256 - Optional base64url-encoded SHA-256 thumbprint of the client certificate. Included in JWT header when provided.
 * @param kid - Optional Key ID string for provider key identification (e.g., "staging-nrcan-geoca-signer"). Included in JWT header when provided.
 * @returns Signed JWT assertion string in compact serialization format
 * @throws Error if JWT signing fails (e.g., invalid private key format)
 */
export function createClientAssertionJwt(
  clientId: string,
  tokenEndpointUrl: string,
  privateKeyPem: string,
  x5tS256?: string | null,
  kid?: string | null
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + CLIENT_ASSERTION_TTL_SECONDS;

  const header: Record<string, string> = {
    alg: 'RS256',
    typ: 'JWT',
  };

  if (kid) {
    header.kid = kid;
  }

  if (x5tS256) {
    header['x5t#S256'] = x5tS256;
  }

  const payload = {
    iss: clientId,
    sub: clientId,
    aud: tokenEndpointUrl,
    jti: randomUUID(),
    iat: now,
    exp,
  };

  // Create signing input: base64url(header).base64url(payload)
  const signingInput = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;

  // Sign with RS256 using the private key
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKeyPem);

  // Return compact JWT: header.payload.signature
  return `${signingInput}.${encodeBase64Url(signature)}`;
}

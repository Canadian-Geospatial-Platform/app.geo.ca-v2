import { createSign, generateKeyPairSync } from 'node:crypto';
import { vi } from 'vitest';
import { encodeBase64Url } from '$lib/utils/auth/base64url';
import type { JsonWebKey } from '$lib/utils/auth/jwt-types';

export type TestJwk = JsonWebKey & {
  kid?: string;
  use?: string;
};

/**
 * Creates a temporary RSA signing key and matching JWK for tests.
 *
 * @param kid - Key identifier to set on the generated JWK.
 * @returns PEM private key and JWK pair used for JWT signing/verification tests.
 */
export function createTestSigningKey(kid: string): { privateKeyPem: string; jwk: TestJwk } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as TestJwk;
  jwk.kid = kid;
  jwk.use = 'sig';

  return {
    privateKeyPem: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
    jwk,
  };
}

/**
 * Stubs OIDC discovery and JWKS endpoints for verifier tests.
 *
 * @param issuer - Expected OIDC issuer.
 * @param jwksUri - JWKS endpoint URL.
 * @param jwk - Signing key to return from the JWKS endpoint.
 * @param discoveryBaseUrl - Optional base URL used for discovery fetch.
 */
export function stubOidcDiscoveryAndJwksFetch(issuer: string, jwksUri: string, jwk: TestJwk, discoveryBaseUrl?: string): void {
  const discoveryUrl = `${(discoveryBaseUrl ?? issuer).replace(/\/$/, '')}/.well-known/openid-configuration`;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === discoveryUrl) {
        return new Response(JSON.stringify({ issuer, jwks_uri: jwksUri }), { status: 200 });
      }

      if (url === jwksUri) {
        return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
      }

      return new Response('not found', { status: 404 });
    })
  );
}

/**
 * Signs a compact JWT using RS256 for auth verifier tests.
 *
 * @param privateKeyPem - RSA private key in PEM format used for signing.
 * @param header - JWT header object.
 * @param payload - JWT payload object.
 * @returns Signed compact JWT token.
 */
export function signTestJwt(privateKeyPem: string, header: Record<string, unknown>, payload: Record<string, unknown>): string {
  const signingInput = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKeyPem);
  return `${signingInput}.${encodeBase64Url(signature)}`;
}

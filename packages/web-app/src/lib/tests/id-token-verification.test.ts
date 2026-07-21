/**
 * Test coverage: Unit tests for ID token verification against OIDC metadata/JWKS, including success and rejection scenarios.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestSigningKey, signTestJwt, stubOidcDiscoveryAndJwksFetch } from '$lib/tests/auth-test-helpers';
import { verifyIdToken } from '$lib/utils/auth/id-token.server';

const clientId = 'cb802d19-a800-4433-ba7e-369d8ab58604';
const issuer = 'https://auth.test.login-connexion.alpha.canada.ca';
const jwksUri = `${issuer}/jwks`;

/**
 * Signs a test ID token payload with RS256.
 *
 * @param privateKeyPem - RSA private key in PEM format used for signing.
 * @param kid - Key identifier to place in the JWT header.
 * @param aud - Audience claim value.
 * @param exp - Expiration claim value in epoch seconds.
 * @param nonce - Optional nonce claim value.
 * @param extraClaims - Optional additional claims to include in payload.
 * @returns Signed compact JWT token.
 */
function signIdToken(
  privateKeyPem: string,
  kid: string,
  aud: string,
  exp: number,
  nonce?: string,
  extraClaims: Record<string, unknown> = {}
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid, typ: 'JWT' };
  const payload = {
    iss: issuer,
    aud,
    iat: now,
    exp,
    sub: 'user-123',
    ...(nonce ? { nonce } : {}),
    ...extraClaims,
  };

  return signTestJwt(privateKeyPem, header, payload);
}

describe('verifyIdToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('OIDC_CLIENT_ID', clientId);
    vi.stubEnv('OIDC_CUSTOM_DOMAIN', issuer);
  });

  it('accepts a valid RS256 ID token', async () => {
    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const nonce = 'nonce-123';
    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300, nonce);

    await expect(verifyIdToken(token, nonce)).resolves.toMatchObject({ sub: 'user-123', aud: clientId, iss: issuer, nonce });
  });

  it('rejects expired tokens', async () => {
    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) - 60);

    await expect(verifyIdToken(token)).resolves.toBeNull();
  });

  it('rejects tokens when nonce does not match expected value', async () => {
    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300, 'token-nonce');

    await expect(verifyIdToken(token, 'expected-nonce')).resolves.toBeNull();
  });

  it('rejects tokens without nonce claim when an expected nonce is provided', async () => {
    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300);

    await expect(verifyIdToken(token, 'expected-nonce')).resolves.toBeNull();
  });

  it('accepts token issuer from discovery when custom domain differs', async () => {
    const customDomain = 'https://custom-domain.example.test';
    vi.stubEnv('OIDC_CUSTOM_DOMAIN', customDomain);

    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk, customDomain);

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300);

    await expect(verifyIdToken(token)).resolves.toMatchObject({ sub: 'user-123', aud: clientId, iss: issuer });
  });

  it('accepts token when discovery is missing issuer and jwks_uri', async () => {
    const customDomain = 'https://custom-domain-fallback.example.test';
    vi.stubEnv('OIDC_CUSTOM_DOMAIN', customDomain);

    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    const fallbackIssuer = issuer.replace(/\/$/, '');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === `${customDomain}/.well-known/openid-configuration`) {
          return new Response(JSON.stringify({}), { status: 200 });
        }

        if (url === `${fallbackIssuer}/.well-known/jwks.json`) {
          return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
        }

        return new Response('not found', { status: 404 });
      })
    );

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300);

    await expect(verifyIdToken(token)).resolves.toMatchObject({ sub: 'user-123', aud: clientId, iss: issuer });
  });

  it('accepts token when email scope is requested and email claim shape is valid', async () => {
    vi.stubEnv('OIDC_REQUESTED_SCOPES', 'openid email');

    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300, undefined, {
      email: 'user@example.test',
      email_verified: true,
    });

    await expect(verifyIdToken(token)).resolves.toMatchObject({
      sub: 'user-123',
      email: 'user@example.test',
      email_verified: true,
    });
  });

  it('rejects token when email scope is requested and email claim type is invalid', async () => {
    vi.stubEnv('OIDC_REQUESTED_SCOPES', 'openid email');

    const kid = 'id-token-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const token = signIdToken(privateKeyPem, kid, clientId, Math.floor(Date.now() / 1000) + 300, undefined, {
      email: 42,
    });

    await expect(verifyIdToken(token)).resolves.toBeNull();
  });
});

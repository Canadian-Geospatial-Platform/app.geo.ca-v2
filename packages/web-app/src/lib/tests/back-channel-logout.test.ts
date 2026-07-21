/**
 * Test coverage: Unit tests for back-channel logout token verification, covering signature/claim validation and failure paths.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestSigningKey, signTestJwt, stubOidcDiscoveryAndJwksFetch } from '$lib/tests/auth-test-helpers';
import { verifyBackChannelLogoutToken } from '$lib/utils/auth/sign-in-back-channel.server';

const clientId = 'cb802d19-a800-4433-ba7e-369d8ab58604';
const issuer = 'https://auth.test.login-connexion.alpha.canada.ca';
const jwksUri = `${issuer}/jwks`;

/**
 * Builds and signs a minimal valid back-channel logout token for tests.
 *
 * @param privateKeyPem - RSA private key in PEM format used for RS256 signing.
 * @param kid - Key identifier to place in the JWT header.
 * @returns Signed compact JWT logout token.
 */
function signLogoutToken(privateKeyPem: string, kid: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid, typ: 'JWT' };
  const payload = {
    iss: issuer,
    aud: clientId,
    iat: now,
    exp: now + 300,
    jti: 'logout-token-jti',
    sub: 'user-123',
    events: {
      'http://schemas.openid.net/event/backchannel-logout': {},
    },
  };

  return signTestJwt(privateKeyPem, header, payload);
}

describe('verifyBackChannelLogoutToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv('OIDC_CLIENT_ID', clientId);
    vi.stubEnv('OIDC_CUSTOM_DOMAIN', issuer);
  });

  it('accepts a valid RS256 back-channel logout token', async () => {
    const kid = 'logout-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const token = signLogoutToken(privateKeyPem, kid);
    const payload = await verifyBackChannelLogoutToken(token);

    expect(payload?.sub).toBe('user-123');
    expect(payload?.aud).toBe(clientId);
    expect(payload?.events?.['http://schemas.openid.net/event/backchannel-logout']).toEqual({});
  });

  it('rejects tokens with the wrong audience', async () => {
    const kid = 'logout-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', kid, typ: 'JWT' };
    const payload = {
      iss: issuer,
      aud: 'different-client-id',
      iat: now,
      exp: now + 300,
      jti: 'logout-token-jti',
      sub: 'user-123',
      events: {
        'http://schemas.openid.net/event/backchannel-logout': {},
      },
    };
    const token = signTestJwt(privateKeyPem, header, payload);

    await expect(verifyBackChannelLogoutToken(token)).resolves.toBeNull();
  });

  it('rejects tokens without the required back-channel logout event claim', async () => {
    const kid = 'logout-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', kid, typ: 'JWT' };
    const payload = {
      iss: issuer,
      aud: clientId,
      iat: now,
      exp: now + 300,
      jti: 'logout-token-jti',
      sub: 'user-123',
    };
    const token = signTestJwt(privateKeyPem, header, payload);

    await expect(verifyBackChannelLogoutToken(token)).resolves.toBeNull();
  });

  it('rejects tokens without a JTI claim', async () => {
    const kid = 'logout-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', kid, typ: 'JWT' };
    const payload = {
      iss: issuer,
      aud: clientId,
      iat: now,
      exp: now + 300,
      sub: 'user-123',
      events: {
        'http://schemas.openid.net/event/backchannel-logout': {},
      },
    };
    const token = signTestJwt(privateKeyPem, header, payload);

    await expect(verifyBackChannelLogoutToken(token)).resolves.toBeNull();
  });

  it('rejects tokens signed with unsupported JWT alg header', async () => {
    const kid = 'logout-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', kid, typ: 'JWT' };
    const payload = {
      iss: issuer,
      aud: clientId,
      iat: now,
      exp: now + 300,
      jti: 'logout-token-jti',
      sub: 'user-123',
      events: {
        'http://schemas.openid.net/event/backchannel-logout': {},
      },
    };
    const token = signTestJwt(privateKeyPem, header, payload);

    await expect(verifyBackChannelLogoutToken(token)).resolves.toBeNull();
  });

  it('accepts a back-channel logout token without kid in the header', async () => {
    const kid = 'logout-key-1';
    const { jwk, privateKeyPem } = createTestSigningKey(kid);

    stubOidcDiscoveryAndJwksFetch(issuer, jwksUri, jwk);

    const now = Math.floor(Date.now() / 1000);
    // Header without kid - should still be accepted
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: issuer,
      aud: clientId,
      iat: now,
      exp: now + 300,
      jti: 'logout-token-without-kid',
      sub: 'user-456',
      events: {
        'http://schemas.openid.net/event/backchannel-logout': {},
      },
    };
    const token = signTestJwt(privateKeyPem, header, payload);

    const result = await verifyBackChannelLogoutToken(token);
    expect(result?.sub).toBe('user-456');
    expect(result?.aud).toBe(clientId);
  });
});

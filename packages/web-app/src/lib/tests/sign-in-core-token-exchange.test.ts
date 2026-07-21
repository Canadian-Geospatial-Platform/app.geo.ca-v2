/**
 * Test coverage: Unit tests for OIDC authorization-code token exchange, including request construction and error handling.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createClientAssertionJwtMock, getOidcConfigMock } = vi.hoisted(() => ({
  createClientAssertionJwtMock: vi.fn(),
  getOidcConfigMock: vi.fn(),
}));

vi.mock('$lib/utils/auth/client-assertion.server', () => ({
  createClientAssertionJwt: createClientAssertionJwtMock,
}));

vi.mock('$lib/utils/auth/oidc.server', () => ({
  getOidcConfig: getOidcConfigMock,
}));

import { exchangeCodeForTokens } from '$lib/utils/auth/sign-in-core.server';

describe('exchangeCodeForTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();

    getOidcConfigMock.mockReturnValue({
      clientId: 'client-id-123',
      clientSecret: 'client-secret-xyz',
      customDomain: 'https://auth.example.test',
    });

    createClientAssertionJwtMock.mockReturnValue('signed-assertion-jwt');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id_token: 'id-token',
          access_token: 'access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fails closed outside localhost when OIDC_USE_PRIVATE_KEY_JWT is true and no private key is available', async () => {
    vi.stubEnv('OIDC_USE_PRIVATE_KEY_JWT', 'true');

    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), 'pkce-verifier-123', null);

    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('allows localhost fallback to client_secret_post even when OIDC_USE_PRIVATE_KEY_JWT is true', async () => {
    vi.stubEnv('OIDC_USE_PRIVATE_KEY_JWT', 'true');

    const result = await exchangeCodeForTokens('code-abc', new URL('http://localhost:8080/sign-in/receive'), 'pkce-verifier-123', null);

    expect(result).toMatchObject({
      id_token: 'id-token',
      access_token: 'access-token',
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [, requestInit] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    const params = new URLSearchParams(String(requestInit?.body ?? ''));

    expect(params.get('client_secret')).toBe('client-secret-xyz');
    expect(params.get('client_assertion')).toBeNull();
  });

  it('uses private_key_jwt when a private key is provided', async () => {
    vi.stubEnv('OIDC_USE_PRIVATE_KEY_JWT', 'true');

    const result = await exchangeCodeForTokens(
      'code-abc',
      new URL('https://app.example.test/sign-in/receive'),
      'pkce-verifier-123',
      '-----BEGIN PRIVATE KEY-----test-----END PRIVATE KEY-----'
    );

    expect(result).toMatchObject({
      id_token: 'id-token',
      access_token: 'access-token',
    });
    expect(createClientAssertionJwtMock).toHaveBeenCalledWith(
      'client-id-123',
      'https://auth.example.test/oauth2/token',
      '-----BEGIN PRIVATE KEY-----test-----END PRIVATE KEY-----',
      null,
      null
    );

    const [, requestInit] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    const params = new URLSearchParams(String(requestInit?.body ?? ''));

    expect(params.get('client_assertion')).toBe('signed-assertion-jwt');
    expect(params.get('client_assertion_type')).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
    expect(params.get('client_secret')).toBeNull();
  });
});

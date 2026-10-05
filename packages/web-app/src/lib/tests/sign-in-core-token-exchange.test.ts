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
  isHttpsOrLocalhostUrl: (value: string) => value.startsWith('https://') || value.startsWith('http://localhost'),
  isLocalhostUrl: (value: string) => value.startsWith('http://localhost') || value.startsWith('https://localhost'),
  getOidcConfig: getOidcConfigMock,
}));

import { exchangeCodeForTokens, exchangeRefreshToken } from '$lib/utils/auth/sign-in-core.server';

describe('exchangeCodeForTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    getOidcConfigMock.mockReturnValue({
      clientId: 'client-id-123',
      clientSecret: 'client-secret-xyz',
      customDomain: 'https://auth.example.test',
      tokenEndpoint: '',
      jwtKid: '',
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
    vi.restoreAllMocks();
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

  it('uses configured token endpoint and jwt kid when provided', async () => {
    getOidcConfigMock.mockReturnValue({
      clientId: 'client-id-123',
      clientSecret: 'client-secret-xyz',
      customDomain: 'https://auth.example.test',
      tokenEndpoint: 'https://tokens.example.test/custom/token',
      jwtKid: 'test-kid-123',
    });

    await exchangeCodeForTokens(
      'code-abc',
      new URL('https://app.example.test/sign-in/receive'),
      'pkce-verifier-123',
      '-----BEGIN PRIVATE KEY-----test-----END PRIVATE KEY-----'
    );

    expect(createClientAssertionJwtMock).toHaveBeenCalledWith(
      'client-id-123',
      'https://tokens.example.test/custom/token',
      '-----BEGIN PRIVATE KEY-----test-----END PRIVATE KEY-----',
      null,
      'test-kid-123'
    );

    const [fetchUrl] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(fetchUrl).toBe('https://tokens.example.test/custom/token');
  });

  it('returns null when code_verifier is missing', async () => {
    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), null);

    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects a non-HTTPS token endpoint (DR8)', async () => {
    getOidcConfigMock.mockReturnValue({
      clientId: 'client-id-123',
      clientSecret: 'client-secret-xyz',
      customDomain: 'https://auth.example.test',
      tokenEndpoint: 'http://tokens.example.test/custom/token',
      jwtKid: '',
    });

    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), 'pkce-verifier-123');

    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns null when token endpoint returns a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({
          error: 'invalid_client',
          error_description: 'client authentication failed',
        }),
      })
    );

    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), 'pkce-verifier-123');

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[auth/token-exchange] token_request_failed',
      expect.objectContaining({ error: 'invalid_client', error_description: 'client authentication failed' })
    );
  });

  it('returns null when token endpoint returns a non-2xx response with a non-JSON body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('invalid json')),
      })
    );

    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), 'pkce-verifier-123');

    expect(result).toBeNull();
  });

  it('returns null when a successful token response body cannot be parsed as JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('invalid json')),
      })
    );

    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), 'pkce-verifier-123');

    expect(result).toBeNull();
  });

  it('returns null when token endpoint request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await exchangeCodeForTokens('code-abc', new URL('https://app.example.test/sign-in/receive'), 'pkce-verifier-123');

    expect(result).toBeNull();
  });

  it('exchanges a refresh token using the configured client authentication', async () => {
    const result = await exchangeRefreshToken('refresh-token-123');

    expect(result).toMatchObject({
      id_token: 'id-token',
      access_token: 'access-token',
    });

    const [, requestInit] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    const params = new URLSearchParams(String(requestInit?.body ?? ''));
    expect(params.get('grant_type')).toBe('refresh_token');
    expect(params.get('refresh_token')).toBe('refresh-token-123');
    expect(params.get('client_secret')).toBe('client-secret-xyz');
  });

  it('returns null and logs when the refresh token is missing', async () => {
    const result = await exchangeRefreshToken('');

    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[auth/token-refresh] missing_required_input',
      expect.objectContaining({ hasRefreshToken: false })
    );
  });

  it('fails closed outside localhost when OIDC_USE_PRIVATE_KEY_JWT is true and no private key is available', async () => {
    vi.stubEnv('OIDC_USE_PRIVATE_KEY_JWT', 'true');

    const result = await exchangeRefreshToken('refresh-token-123', null);

    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[auth/token-refresh] policy_blocked_fallback',
      expect.objectContaining({ isLocalhost: false })
    );
  });

  it('returns null and logs when neither a private key nor a client secret is configured', async () => {
    getOidcConfigMock.mockReturnValue({
      clientId: 'client-id-123',
      clientSecret: '',
      customDomain: 'https://auth.example.test',
      tokenEndpoint: '',
      jwtKid: '',
    });

    const result = await exchangeRefreshToken('refresh-token-123');

    expect(result).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('[auth/token-refresh] missing_client_credentials', expect.any(Object));
  });

  it('returns null and logs when the token endpoint returns a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ error: 'invalid_grant', error_description: 'refresh token expired' }),
      })
    );

    const result = await exchangeRefreshToken('refresh-token-123');

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[auth/token-refresh] token_request_failed',
      expect.objectContaining({ status: 400, error: 'invalid_grant', error_description: 'refresh token expired' })
    );
  });

  it('returns null and logs when the token endpoint request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await exchangeRefreshToken('refresh-token-123');

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[auth/token-refresh] token_request_exception',
      expect.objectContaining({ error: 'network down' })
    );
  });
});

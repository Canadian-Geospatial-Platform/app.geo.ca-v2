/**
 * Test coverage: Route tests for the sign-in callback endpoint, including token exchange flow, nonce checks, and redirect behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  consumeOidcNonceCookieMock,
  consumePkceVerifierCookieMock,
  exchangeCodeForTokensMock,
  setAuthCookiesMock,
  getLangFromStateMock,
  getPostAuthRedirectMock,
  mergeGuestFavouritesMock,
  verifyIdTokenMock,
} = vi.hoisted(() => ({
  consumeOidcNonceCookieMock: vi.fn(),
  consumePkceVerifierCookieMock: vi.fn(),
  exchangeCodeForTokensMock: vi.fn(),
  setAuthCookiesMock: vi.fn(),
  getLangFromStateMock: vi.fn(),
  getPostAuthRedirectMock: vi.fn(),
  mergeGuestFavouritesMock: vi.fn(),
  verifyIdTokenMock: vi.fn(),
}));

vi.mock('$lib/utils/auth/sign-in-core.server', () => ({
  consumeOidcNonceCookie: consumeOidcNonceCookieMock,
  consumePkceVerifierCookie: consumePkceVerifierCookieMock,
  exchangeCodeForTokens: exchangeCodeForTokensMock,
  setAuthCookies: setAuthCookiesMock,
}));

vi.mock('$lib/utils/auth/sign-in-post-auth.server', () => ({
  getLangFromState: getLangFromStateMock,
  getPostAuthRedirect: getPostAuthRedirectMock,
  mergeGuestFavourites: mergeGuestFavouritesMock,
}));

vi.mock('$lib/utils/auth/id-token.server', () => ({
  verifyIdToken: verifyIdTokenMock,
}));

import { load } from '../../routes/sign-in/receive/+page.server';

describe('GET /sign-in/receive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');

    getLangFromStateMock.mockReturnValue('en-ca');
    consumePkceVerifierCookieMock.mockReturnValue('pkce-verifier');
    consumeOidcNonceCookieMock.mockReturnValue('expected-nonce');
    exchangeCodeForTokensMock.mockResolvedValue({
      id_token: 'id-token',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    });
    verifyIdTokenMock.mockResolvedValue({ sub: 'user-123' });
    setAuthCookiesMock.mockReturnValue(true);
    mergeGuestFavouritesMock.mockResolvedValue(undefined);
    getPostAuthRedirectMock.mockReturnValue('/en-ca/favourites');
  });

  it('redirects to fallback when callback code is missing', async () => {
    const event = {
      cookies: {} as never,
      url: new URL('https://example.test/sign-in/receive?state=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/map-browser' });
  });

  it('redirects to fallback when token exchange or nonce validation fails', async () => {
    exchangeCodeForTokensMock.mockResolvedValue(null);

    const event = {
      cookies: {} as never,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=%2Ffr-ca%2Fmap-browser'),
    } as unknown as Parameters<typeof load>[0];

    getLangFromStateMock.mockReturnValue('fr-ca');

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/fr-ca/map-browser' });
  });

  it('redirects to resolved post-auth path on successful callback handling', async () => {
    const cookies = {} as never;
    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/favourites' });
    expect(verifyIdTokenMock).toHaveBeenCalledWith('id-token', 'expected-nonce');
    expect(setAuthCookiesMock).toHaveBeenCalledWith(cookies, event.url, expect.objectContaining({ id_token: 'id-token' }));
    expect(mergeGuestFavouritesMock).toHaveBeenCalledWith(cookies);
  });
});

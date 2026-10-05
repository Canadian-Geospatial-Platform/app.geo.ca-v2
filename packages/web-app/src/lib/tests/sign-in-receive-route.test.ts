/**
 * Test coverage: Route tests for the sign-in callback endpoint, including token exchange flow, nonce checks, and redirect behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  consumeOidcNonceCookieMock,
  consumeOidcStateCookiesMock,
  consumePkceVerifierCookieMock,
  exchangeCodeForTokensMock,
  setAuthCookiesMock,
  getLangFromStateMock,
  getPostAuthRedirectMock,
  mergeGuestFavouritesMock,
  verifyIdTokenMock,
} = vi.hoisted(() => ({
  consumeOidcNonceCookieMock: vi.fn(),
  consumeOidcStateCookiesMock: vi.fn(),
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
  consumeOidcStateCookies: consumeOidcStateCookiesMock,
  consumePkceVerifierCookie: consumePkceVerifierCookieMock,
  exchangeCodeForTokens: exchangeCodeForTokensMock,
  setAuthCookies: setAuthCookiesMock,
}));

vi.mock('$lib/utils/auth/sign-in-post-auth.server', () => ({
  getLangFromState: getLangFromStateMock,
  getPostAuthRedirect: getPostAuthRedirectMock,
}));

vi.mock('$lib/db/favourites', () => ({
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
    consumeOidcStateCookiesMock.mockReturnValue({ stateToken: 'expected-state-token', returnTo: '/en-ca/favourites' });
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
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];
    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?state=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/map-browser' });
    expect(cookies.set).toHaveBeenCalledWith('auth_error', 'signin_failed', expect.objectContaining({ path: '/' }));
  });

  it('redirects to fallback when state token validation fails', async () => {
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];
    consumeOidcStateCookiesMock.mockReturnValue({ stateToken: 'expected-state-token', returnTo: '/fr-ca/map-browser' });
    getLangFromStateMock.mockReturnValue('fr-ca');

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=unexpected-token'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/fr-ca/map-browser' });
    expect(exchangeCodeForTokensMock).not.toHaveBeenCalled();
    expect(cookies.set).toHaveBeenCalledWith('auth_error', 'signin_failed', expect.objectContaining({ path: '/' }));
  });

  it('redirects to fallback when token exchange or nonce validation fails', async () => {
    exchangeCodeForTokensMock.mockResolvedValue(null);
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=expected-state-token'),
    } as unknown as Parameters<typeof load>[0];

    getLangFromStateMock.mockReturnValue('fr-ca');
    consumeOidcStateCookiesMock.mockReturnValue({ stateToken: 'expected-state-token', returnTo: '/fr-ca/map-browser' });

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/fr-ca/map-browser' });
    expect(cookies.set).toHaveBeenCalledWith('auth_error', 'signin_failed', expect.objectContaining({ path: '/' }));
  });

  it('redirects to fallback when the PKCE verifier is missing', async () => {
    consumePkceVerifierCookieMock.mockReturnValue(null);
    exchangeCodeForTokensMock.mockResolvedValue(null);
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=expected-state-token'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/map-browser' });
    expect(exchangeCodeForTokensMock).toHaveBeenCalledWith('abc', event.url, null, null, null);
    expect(cookies.set).toHaveBeenCalledWith('auth_error', 'signin_failed', expect.objectContaining({ path: '/' }));
  });

  it('redirects to fallback when ID token verification fails', async () => {
    verifyIdTokenMock.mockResolvedValue(null);
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=expected-state-token'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/map-browser' });
    expect(setAuthCookiesMock).not.toHaveBeenCalled();
    expect(cookies.set).toHaveBeenCalledWith('auth_error', 'signin_failed', expect.objectContaining({ path: '/' }));
  });

  it('redirects to fallback when setting auth cookies fails', async () => {
    setAuthCookiesMock.mockReturnValue(false);
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=expected-state-token'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/map-browser' });
    expect(mergeGuestFavouritesMock).not.toHaveBeenCalled();
    expect(cookies.set).toHaveBeenCalledWith('auth_error', 'signin_failed', expect.objectContaining({ path: '/' }));
  });

  it('redirects to resolved post-auth path on successful callback handling', async () => {
    const cookies = {
      set: vi.fn(),
    } as unknown as Parameters<typeof load>[0]['cookies'];
    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/receive?code=abc&state=expected-state-token'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/favourites' });
    expect(verifyIdTokenMock).toHaveBeenCalledWith('id-token', 'expected-nonce');
    expect(setAuthCookiesMock).toHaveBeenCalledWith(cookies, expect.objectContaining({ id_token: 'id-token' }));
    expect(mergeGuestFavouritesMock).toHaveBeenCalledWith(cookies);
    expect(cookies.set).not.toHaveBeenCalledWith('auth_error', expect.any(String), expect.any(Object));
  });
});

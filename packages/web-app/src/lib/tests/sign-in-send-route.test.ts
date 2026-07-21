/**
 * Test coverage: Route tests for the sign-in start endpoint, covering PKCE/nonce setup and provider redirect fallback behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  createOidcNonceMock,
  createPkceChallengeMock,
  createPkceVerifierMock,
  getSignInUrlMock,
  setOidcNonceCookieMock,
  setPkceVerifierCookieMock,
} = vi.hoisted(() => ({
  createOidcNonceMock: vi.fn<() => string>(),
  createPkceChallengeMock: vi.fn<(verifier: string) => string>(),
  createPkceVerifierMock: vi.fn<() => string>(),
  getSignInUrlMock: vi.fn<(requestUrl: URL, state: string, codeChallenge: string, nonce: string) => string | null>(),
  setOidcNonceCookieMock: vi.fn(),
  setPkceVerifierCookieMock: vi.fn(),
}));

vi.mock('$lib/utils/auth/sign-in-core.server', () => ({
  createOidcNonce: createOidcNonceMock,
  createPkceChallenge: createPkceChallengeMock,
  createPkceVerifier: createPkceVerifierMock,
  getSignInUrl: getSignInUrlMock,
  setOidcNonceCookie: setOidcNonceCookieMock,
  setPkceVerifierCookie: setPkceVerifierCookieMock,
}));

import { load } from '../../routes/[lang]/sign-in/send/+page.server';

/**
 * Asserts redirect details from a thrown SvelteKit redirect-like error.
 *
 * @param error - Caught thrown value from route loader.
 * @param status - Expected redirect status code.
 * @param location - Expected redirect location.
 */
function expectRedirect(error: unknown, status: number, location: string): void {
  const candidate = error as { status?: number; location?: string };
  expect(candidate.status).toBe(status);
  expect(candidate.location).toBe(location);
}

describe('GET /[lang]/sign-in/send', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');

    createPkceVerifierMock.mockReturnValue('pkce-verifier');
    createOidcNonceMock.mockReturnValue('oidc-nonce');
    createPkceChallengeMock.mockReturnValue('pkce-challenge');
  });

  it('redirects to language fallback when sign-in URL cannot be created', async () => {
    getSignInUrlMock.mockReturnValue(null);

    const event = {
      cookies: {} as never,
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/send'),
    } as unknown as Parameters<typeof load>[0];

    await expect(load(event)).rejects.toMatchObject({ status: 303, location: '/en-ca/map-browser' });
    expect(setPkceVerifierCookieMock).not.toHaveBeenCalled();
    expect(setOidcNonceCookieMock).not.toHaveBeenCalled();
  });

  it('sets one-time cookies and redirects to provider URL when configured', async () => {
    getSignInUrlMock.mockReturnValue('https://auth.example.test/oauth2/authorize?x=1');

    const cookies = {} as never;
    const event = {
      cookies,
      params: { lang: 'fr-ca' },
      url: new URL('https://example.test/fr-ca/sign-in/send?state=%2Ffr-ca%2Fmap-browser'),
    } as unknown as Parameters<typeof load>[0];

    try {
      await load(event);
      throw new Error('Expected redirect');
    } catch (error) {
      expectRedirect(error, 303, 'https://auth.example.test/oauth2/authorize?x=1');
    }

    expect(setPkceVerifierCookieMock).toHaveBeenCalledWith(cookies, event.url, 'pkce-verifier');
    expect(setOidcNonceCookieMock).toHaveBeenCalledWith(cookies, event.url, 'oidc-nonce');
  });
});

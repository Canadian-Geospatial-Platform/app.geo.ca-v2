/**
 * Test coverage: Route tests for sign-out/logout redirect behavior across localized and root logout endpoints.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clearAuthCookiesMock, getOidcLogoutUrlMock } = vi.hoisted(() => ({
  clearAuthCookiesMock: vi.fn(),
  getOidcLogoutUrlMock: vi.fn<(url: URL) => Promise<string | null>>(),
}));

vi.mock('$lib/utils/auth/auth-cookies', () => ({
  clearAuthCookies: clearAuthCookiesMock,
}));

vi.mock('$lib/utils/auth/sign-in-core.server', () => ({
  getOidcLogoutUrl: getOidcLogoutUrlMock,
}));

import { load as loadLangLogout } from '../../routes/[lang]/sign-in/logout/+page.server';
import { load as loadRootLogout } from '../../routes/sign-in/logout/+page.server';
import { load as loadOidcLogout } from '../../routes/[lang]/sign-in/oidc-logout/+page.server';

/**
 * Asserts that a route loader throws a redirect matching expectations.
 *
 * @param run - Loader invocation that should throw a redirect.
 * @param expected - Expected redirect status and location.
 * @returns Promise resolved when redirect assertion passes.
 */
async function expectRedirect(
  run: () => Promise<unknown> | unknown,
  expected: {
    status: number;
    location: string;
  }
): Promise<void> {
  try {
    await run();
    throw new Error('Expected redirect');
  } catch (error) {
    expect(error).toMatchObject(expected);
  }
}

describe('sign-out route redirects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOidcLogoutUrlMock.mockResolvedValue(null);
  });

  it('redirects /[lang]/sign-in/logout to language favourites when returnTo is favourites', async () => {
    const event = {
      cookies: {} as never,
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/logout?returnTo=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof loadLangLogout>[0];

    await expectRedirect(() => loadLangLogout(event), { status: 303, location: '/en-ca/favourites' });
    expect(clearAuthCookiesMock).toHaveBeenCalled();
  });

  it('falls back to /map-browser when /[lang]/sign-in/logout receives unsupported returnTo', async () => {
    const event = {
      cookies: {} as never,
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/logout?returnTo=%2Fen-ca%2Ffavourites%2Fdatasets'),
    } as unknown as Parameters<typeof loadLangLogout>[0];

    await expectRedirect(() => loadLangLogout(event), { status: 303, location: '/en-ca/map-browser' });
  });

  it('redirects /sign-in/logout to provided favourites return target', async () => {
    const event = {
      cookies: {} as never,
      url: new URL('https://example.test/sign-in/logout?returnTo=%2Ffr-ca%2Ffavourites'),
    } as unknown as Parameters<typeof loadRootLogout>[0];

    await expectRedirect(() => loadRootLogout(event), { status: 303, location: '/fr-ca/favourites' });
  });

  it('keeps returnTo when /[lang]/sign-in/oidc-logout falls back on localhost', async () => {
    const event = {
      params: { lang: 'en-ca' },
      url: new URL('http://localhost:8080/en-ca/sign-in/oidc-logout?returnTo=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    await expectRedirect(() => loadOidcLogout(event), {
      status: 303,
      location: '/en-ca/sign-in/logout?returnTo=%2Fen-ca%2Ffavourites',
    });
  });

  it('redirects to provider logout URL when available', async () => {
    getOidcLogoutUrlMock.mockResolvedValue('https://auth.example.test/logout');

    const event = {
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/oidc-logout'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    await expectRedirect(() => loadOidcLogout(event), {
      status: 303,
      location: 'https://auth.example.test/logout',
    });
  });
});

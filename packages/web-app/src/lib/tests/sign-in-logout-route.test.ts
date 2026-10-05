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
    vi.stubEnv('NODE_ENV', 'development');
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
      cookies: {
        get: vi.fn().mockReturnValue(undefined),
        delete: vi.fn(),
      } as never,
      url: new URL('https://example.test/sign-in/logout?returnTo=%2Ffr-ca%2Ffavourites'),
    } as unknown as Parameters<typeof loadRootLogout>[0];

    await expectRedirect(() => loadRootLogout(event), { status: 303, location: '/fr-ca/favourites' });
  });

  it('treats sid-bearing front-channel logout requests as local sign-out and clears auth cookies', async () => {
    const cookies = {
      get: vi.fn().mockReturnValue(undefined),
      delete: vi.fn(),
    } as never;

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/logout?sid=session-123'),
    } as unknown as Parameters<typeof loadRootLogout>[0];

    await expectRedirect(() => loadRootLogout(event), { status: 303, location: '/en-ca/map-browser' });
    expect(clearAuthCookiesMock).toHaveBeenCalled();
  });

  it('treats logout-marker front-channel requests as local sign-out and clears auth cookies', async () => {
    const cookies = {
      get: vi.fn().mockReturnValue(undefined),
      delete: vi.fn(),
    } as never;

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/logout?logout=true'),
    } as unknown as Parameters<typeof loadRootLogout>[0];

    await expectRedirect(() => loadRootLogout(event), { status: 303, location: '/en-ca/map-browser' });
    expect(clearAuthCookiesMock).toHaveBeenCalled();
  });

  it('uses post_logout_lang cookie to preserve French fallback locale', async () => {
    const cookies = {
      get: vi.fn().mockReturnValue('fr-ca'),
      delete: vi.fn(),
    };

    const event = {
      cookies,
      url: new URL('https://example.test/sign-in/logout'),
    } as unknown as Parameters<typeof loadRootLogout>[0];

    await expectRedirect(() => loadRootLogout(event), { status: 303, location: '/fr-ca/map-browser' });
    expect(clearAuthCookiesMock).toHaveBeenCalledWith(cookies);
  });

  it('keeps returnTo when /[lang]/sign-in/oidc-logout falls back on localhost', async () => {
    const cookies = {
      set: vi.fn(),
    };

    const event = {
      cookies,
      params: { lang: 'en-ca' },
      url: new URL('http://localhost:8080/en-ca/sign-in/oidc-logout?returnTo=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    await expectRedirect(() => loadOidcLogout(event), {
      status: 303,
      location: '/en-ca/sign-in/logout?returnTo=%2Fen-ca%2Ffavourites',
    });
    expect(cookies.set).toHaveBeenCalledWith(
      'post_logout_lang',
      'en-ca',
      expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 600 })
    );
  });

  it('redirects to provider logout URL when available', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    getOidcLogoutUrlMock.mockResolvedValue('https://auth.example.test/logout');

    const cookies = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    };

    const event = {
      cookies,
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/oidc-logout'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    await expectRedirect(() => loadOidcLogout(event), {
      status: 303,
      location: 'https://auth.example.test/logout',
    });
    expect(cookies.set).toHaveBeenCalledWith(
      'post_logout_lang',
      'en-ca',
      expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 600 })
    );
  });

  it('passes the current id_token cookie as id_token_hint to request logout variant 4a', async () => {
    getOidcLogoutUrlMock.mockResolvedValue('https://auth.example.test/logout');

    const cookies = {
      get: vi.fn().mockReturnValue('raw-id-token-value'),
      set: vi.fn(),
    };

    const event = {
      cookies,
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/oidc-logout'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    await expectRedirect(() => loadOidcLogout(event), {
      status: 303,
      location: 'https://auth.example.test/logout',
    });
    expect(getOidcLogoutUrlMock).toHaveBeenCalledWith(event.url, cookies);
  });
});

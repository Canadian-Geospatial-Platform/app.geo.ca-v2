/**
 * Test coverage: Route tests for sign-out/logout redirect behavior across localized and root logout endpoints.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clearAuthCookiesMock, getOidcLogoutUrlMock } = vi.hoisted(() => ({
  clearAuthCookiesMock: vi.fn(),
  getOidcLogoutUrlMock: vi.fn<(url: URL) => Promise<string | null>>(),
}));

vi.mock('#lib/utils/auth/auth-cookies.js', () => ({
  clearAuthCookies: clearAuthCookiesMock,
}));

vi.mock('#lib/utils/auth/sign-in-core.server.js', () => ({
  getOidcLogoutUrl: getOidcLogoutUrlMock,
}));

import { load as loadLangLogout } from '../../routes/[lang]/sign-in/logout/+page.server';
import { load as loadRootLogout } from '../../routes/sign-in/logout/+page.server';
import { actions as oidcLogoutActions, load as loadOidcLogout } from '../../routes/[lang]/sign-in/oidc-logout/+page.server';
import { getLanguageSwitchUrl } from '#lib/utils/language.js';

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

  it.each([
    ['en-ca', 'fr-ca'],
    ['fr-ca', 'en-ca'],
  ] as const)('keeps the favourites return target switching logout from %s to %s', (from, to) => {
    const url = new URL(`https://example.test/${from}/sign-in/oidc-logout?returnTo=%2F${from}%2Ffavourites`);
    const event = {
      params: { lang: to },
      url: new URL(getLanguageSwitchUrl(url, to)),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    expect(loadOidcLogout(event)).toEqual({ lang: to, returnTo: `/${to}/favourites` });
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

  it.each(['en-ca', 'fr-ca'])('ends an expired %s session without confirmation and sets the expiry notice', async (lang) => {
    const cookies = { set: vi.fn() };
    const event = {
      cookies,
      params: { lang },
      url: new URL(`https://example.test/${lang}/sign-in/logout?reason=session-expired`),
    } as unknown as Parameters<typeof loadLangLogout>[0];

    await expectRedirect(() => loadLangLogout(event), { status: 303, location: `/${lang}/map-browser?sessionExpired=1` });
    expect(clearAuthCookiesMock).toHaveBeenCalledWith(cookies);
    expect(cookies.set).toHaveBeenCalledWith(
      'session_expired',
      '1',
      expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 })
    );
    expect(getOidcLogoutUrlMock).not.toHaveBeenCalled();
  });

  it('uses a non-secure expiry flash cookie on local HTTP development', async () => {
    const cookies = { set: vi.fn() };
    const event = {
      cookies,
      params: { lang: 'en-ca' },
      url: new URL('http://localhost:8080/en-ca/sign-in/logout?reason=session-expired'),
    } as unknown as Parameters<typeof loadLangLogout>[0];

    await expectRedirect(() => loadLangLogout(event), { status: 303, location: '/en-ca/map-browser?sessionExpired=1' });
    expect(cookies.set).toHaveBeenCalledWith('session_expired', '1', expect.objectContaining({ secure: false }));
  });

  it('does not show an expiry notice for a normal local sign-out', async () => {
    const cookies = { set: vi.fn() };
    const event = {
      cookies,
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/logout'),
    } as unknown as Parameters<typeof loadLangLogout>[0];

    await expectRedirect(() => loadLangLogout(event), { status: 303, location: '/en-ca/map-browser' });
    expect(cookies.set).not.toHaveBeenCalled();
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

  it('renders the logout confirmation on GET without side effects', () => {
    const cookies = {
      set: vi.fn(),
    };

    const event = {
      cookies,
      params: { lang: 'en-ca' },
      url: new URL('http://localhost:8080/en-ca/sign-in/oidc-logout?returnTo=%2Fen-ca%2Ffavourites'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    expect(loadOidcLogout(event)).toEqual({ lang: 'en-ca', returnTo: '/en-ca/favourites' });
    expect(cookies.set).not.toHaveBeenCalled();
    expect(getOidcLogoutUrlMock).not.toHaveBeenCalled();
  });

  it('does not expose an unsupported return target in the confirmation page', () => {
    const event = {
      params: { lang: 'en-ca' },
      url: new URL('https://example.test/en-ca/sign-in/oidc-logout?returnTo=https%3A%2F%2Fevil.example'),
    } as unknown as Parameters<typeof loadOidcLogout>[0];

    expect(loadOidcLogout(event)).toEqual({ lang: 'en-ca', returnTo: null });
  });

  it('starts local logout only after the confirmation form is posted', async () => {
    const cookies = {
      set: vi.fn(),
    };
    const url = new URL('http://localhost:8080/en-ca/sign-in/oidc-logout');
    const request = new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'returnTo=%2Fen-ca%2Ffavourites',
    });
    const event = {
      cookies,
      params: { lang: 'en-ca' },
      request,
      url,
    } as unknown as Parameters<NonNullable<typeof oidcLogoutActions.confirm>>[0];

    await expectRedirect(() => oidcLogoutActions.confirm!(event), {
      status: 303,
      location: '/en-ca/sign-in/logout?returnTo=%2Fen-ca%2Ffavourites',
    });
    expect(cookies.set).toHaveBeenCalledWith(
      'post_logout_lang',
      'en-ca',
      expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 600 })
    );
  });

  it('starts provider logout only after the confirmation form is posted', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    getOidcLogoutUrlMock.mockResolvedValue('https://auth.example.test/logout');

    const cookies = {
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    };

    const url = new URL('https://example.test/en-ca/sign-in/oidc-logout');
    const request = new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: '',
    });
    const event = {
      cookies,
      params: { lang: 'en-ca' },
      request,
      url,
    } as unknown as Parameters<NonNullable<typeof oidcLogoutActions.confirm>>[0];

    await expectRedirect(() => oidcLogoutActions.confirm!(event), {
      status: 303,
      location: 'https://auth.example.test/logout',
    });
    expect(cookies.set).toHaveBeenCalledWith(
      'post_logout_lang',
      'en-ca',
      expect.objectContaining({ path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 600 })
    );
  });

  it('passes the current id_token cookie as id_token_hint after confirmation', async () => {
    getOidcLogoutUrlMock.mockResolvedValue('https://auth.example.test/logout');

    const cookies = {
      get: vi.fn().mockReturnValue('raw-id-token-value'),
      set: vi.fn(),
    };

    const url = new URL('https://example.test/en-ca/sign-in/oidc-logout');
    const request = new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: '',
    });
    const event = {
      cookies,
      params: { lang: 'en-ca' },
      request,
      url,
    } as unknown as Parameters<NonNullable<typeof oidcLogoutActions.confirm>>[0];

    await expectRedirect(() => oidcLogoutActions.confirm!(event), {
      status: 303,
      location: 'https://auth.example.test/logout',
    });
    expect(getOidcLogoutUrlMock).toHaveBeenCalledWith(event.url, cookies);
  });
});

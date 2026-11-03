import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserInfo } from '#lib/db/db-types.js';

vi.mock('#lib/db/user.js', () => ({ getUserData: vi.fn() }));
vi.mock('#lib/utils/auth/sign-in-core.server.js', () => ({ isOidcConfigured: vi.fn(() => true) }));
vi.mock('#lib/utils/auth/oidc.server.js', () => ({ getOidcManageUrl: vi.fn(() => null) }));

import { getUserData } from '#lib/db/user.js';
import { load } from '../../routes/+layout.server';

describe('layout favourites navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['en-ca', 'My GEO.ca', 'Favourites'],
    ['fr-ca', 'Mon GEO.ca', 'Favoris'],
  ] as const)('uses the correct signed-in and guest links for %s', async (lang, signedInLabel, guestLabel) => {
    const event = {
      params: { lang },
      cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
      depends: vi.fn(),
      url: new URL(`https://example.test/${lang}/map-browser`),
    } as unknown as Parameters<typeof load>[0];

    for (const status of ['ok', 'missing', 'unavailable', 'anonymous'] as const) {
      const signedIn = status !== 'anonymous';
      const userInfo: UserInfo = {
        status,
        Item: { uuid: signedIn ? 'user-1' : null, favourites: ['dataset-1'], mapConfigs: [] },
      };
      vi.mocked(getUserData).mockResolvedValue(userInfo);

      const result = await load(event);
      expect(result?.signedIn).toBe(signedIn);
      expect(result?.navitems?.favourites).toEqual(
        signedIn
          ? { title: signedInLabel, href: `/${lang}/favourites` }
          : { title: guestLabel, href: `/${lang}/favourites`, counter: true, localStorageKey: 'FavouritesResources' }
      );
    }
  });

  it('marks the destination layout as session-expired after the logout redirect', async () => {
    vi.mocked(getUserData).mockResolvedValue({
      status: 'anonymous',
      Item: { uuid: null, favourites: [], mapConfigs: [] },
    });
    const cookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
    const event = {
      params: { lang: 'en-ca' },
      cookies,
      depends: vi.fn(),
      url: new URL('https://example.test/en-ca/map-browser?sessionExpired=1'),
    } as unknown as Parameters<typeof load>[0];

    const result = await load(event);

    expect(result?.sessionExpired).toBe(true);
  });
});

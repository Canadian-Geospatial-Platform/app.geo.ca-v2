import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/db/user.js', () => ({ getUserData: vi.fn() }));

import { getUserData } from '#lib/db/user.js';
import { loadFavouritesPageData } from '#lib/utils/favourites/page-load.server.js';

describe('favourites page titles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['en-ca', 'My GEO.ca', 'Favourites'],
    ['fr-ca', 'Mon GEO.ca', 'Favoris'],
  ] as const)('localizes signed-in and guest breadcrumbs for %s', async (lang, signedInTitle, guestTitle) => {
    for (const status of ['ok', 'missing', 'unavailable', 'anonymous'] as const) {
      const signedIn = status !== 'anonymous';
      vi.mocked(getUserData).mockResolvedValue({
        status,
        Item: { uuid: signedIn ? 'user-1' : null, favourites: [], mapConfigs: [] },
      });
      const url = new URL(`https://example.test/${lang}/favourites`);
      const data = await loadFavouritesPageData({ lang, url, cookies: {} as never, fetch: vi.fn() });

      expect(data.tTitle2).toEqual({ text: signedIn ? signedInTitle : guestTitle, href: url.href });
    }
  });
});

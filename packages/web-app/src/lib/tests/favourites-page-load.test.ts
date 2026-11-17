import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/db/user.js', () => ({ getUserData: vi.fn() }));

import { getUserData } from '#lib/db/user.js';
import { loadFavouritesPageData } from '#lib/utils/favourites/page-load.server.js';

describe('favourites page titles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['en-ca', 'en'],
    ['fr-ca', 'fr'],
  ] as const)('uses the short API language while retaining %s in localized URLs', async (appLang, contentLang) => {
    vi.stubEnv('GEOCORE_API_DOMAIN', 'https://api.example.test');
    vi.mocked(getUserData).mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['record-1'], mapConfigs: [] },
    });
    const fetch = vi.fn<Parameters<typeof loadFavouritesPageData>[0]['fetch']>().mockResolvedValue(Response.json({ Items: [] }));
    const url = new URL(`https://example.test/${appLang}/favourites`);
    const data = await loadFavouritesPageData({ lang: appLang, url, cookies: {} as never, fetch });

    expect(fetch).toHaveBeenCalledOnce();
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get('lang')).toBe(contentLang);
    expect(data.canonicalUrl).toContain(`/${appLang}/favourites`);
  });

  it.each([
    ['en-ca', 'My GEO.ca', 'Favourites'],
    ['fr-ca', 'Mon GEO.ca', 'Favoris'],
  ] as const)('localizes signed-in and guest breadcrumbs for %s', async (appLang, signedInTitle, guestTitle) => {
    for (const status of ['ok', 'missing', 'unavailable', 'anonymous'] as const) {
      const signedIn = status !== 'anonymous';
      vi.mocked(getUserData).mockResolvedValue({
        status,
        Item: { uuid: signedIn ? 'user-1' : null, favourites: [], mapConfigs: [] },
      });
      const url = new URL(`https://example.test/${appLang}/favourites`);
      const data = await loadFavouritesPageData({ lang: appLang, url, cookies: {} as never, fetch: vi.fn() });

      expect(data.tTitle2).toEqual({ text: signedIn ? signedInTitle : guestTitle, href: url.href });
    }
  });
});

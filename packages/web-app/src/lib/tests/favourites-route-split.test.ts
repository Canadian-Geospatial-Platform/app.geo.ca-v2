/**
 * Test coverage: Route-load tests for split favourites pages, covering guest redirects, accessibility rules, and localized data flow.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAppLanguageMock, loadFavouritesPageDataMock } = vi.hoisted(() => ({
  getAppLanguageMock: vi.fn<(lang: string) => 'en-ca' | 'fr-ca'>(),
  loadFavouritesPageDataMock: vi.fn(),
}));

vi.mock('$lib/utils/language', () => ({
  getAppLanguage: getAppLanguageMock,
  pickByLanguage: (lang: 'en-ca' | 'fr-ca', enValue: string, frValue: string) => (lang === 'fr-ca' ? frValue : enValue),
}));

vi.mock('$lib/utils/favourites/page-load.server', () => ({
  loadFavouritesPageData: loadFavouritesPageDataMock,
}));

import { load as loadFavourites } from '../../routes/[lang]/favourites/+page.server';
import { load as loadDatasets } from '../../routes/[lang]/favourites/datasets/+page.server';
import { load as loadMaps } from '../../routes/[lang]/favourites/maps/+page.server';
import { load as loadView } from '../../routes/[lang]/favourites/view/+page.server';

/**
 * Builds mock page-load data for favourites route tests.
 *
 * @param uuid - User UUID or null for guest state.
 * @returns Mock favourites page data.
 */
function createPageData(uuid: string | null) {
  return {
    tTitle1: { text: 'Catalog', href: '/en-ca/map-browser' },
    tTitle2: { text: 'Favourites', href: '/en-ca/favourites' },
    results: [],
    userData: { uuid, favourites: [], mapConfigs: [] },
    canonicalUrl: 'https://example.test/en-ca/favourites',
    alternateUrl: 'https://example.test/fr-ca/favourites',
    alternateLang: 'fr-ca',
    metaDescription: 'desc',
  };
}

/**
 * Creates a minimal page-server event for route load tests.
 *
 * @param url - Absolute request URL.
 * @param lang - Route language parameter.
 * @returns Mock event payload with fetch, cookies, params, and URL.
 */
function createEvent(url: string, lang: string = 'en-ca') {
  return {
    fetch: vi.fn(),
    cookies: {} as never,
    params: { lang },
    url: new URL(url),
  } as const;
}

describe('favourites split route loads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAppLanguageMock.mockImplementation((lang) => (lang === 'fr-ca' ? 'fr-ca' : 'en-ca'));
  });

  it('keeps /favourites accessible for guests', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData(null));

    const event = createEvent('https://example.test/en-ca/favourites');
    const data = (await loadFavourites(event as unknown as Parameters<typeof loadFavourites>[0])) as {
      lang: string;
      userData: { uuid: string | null };
    };

    expect(getAppLanguageMock).toHaveBeenCalledWith('en-ca');
    expect(loadFavouritesPageDataMock).toHaveBeenCalled();
    expect(data.lang).toBe('en-ca');
    expect(data.userData.uuid).toBeNull();
  });

  it('redirects guest users from /favourites/datasets to /favourites', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData(null));
    const event = createEvent('https://example.test/en-ca/favourites/datasets');

    await expect(loadDatasets(event as unknown as Parameters<typeof loadDatasets>[0])).rejects.toMatchObject({
      status: 303,
      location: '/en-ca/favourites',
    });
  });

  it('redirects guest users from /favourites/maps to /favourites', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData(null));
    const event = createEvent('https://example.test/en-ca/favourites/maps');

    await expect(loadMaps(event as unknown as Parameters<typeof loadMaps>[0])).rejects.toMatchObject({
      status: 303,
      location: '/en-ca/favourites',
    });
  });

  it('keeps /favourites/view accessible for guests when dataset ids are provided', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData(null));
    const event = createEvent('https://example.test/en-ca/favourites/view?ids=a,b');

    const data = (await loadView(event as unknown as Parameters<typeof loadView>[0])) as {
      lang: string;
      userData: { uuid: string | null };
    };

    expect(data.lang).toBe('en-ca');
    expect(data.userData.uuid).toBeNull();
  });

  it('redirects guest users from /favourites/view to /favourites when ids are missing', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData(null));
    const event = createEvent('https://example.test/en-ca/favourites/view');

    await expect(loadView(event as unknown as Parameters<typeof loadView>[0])).rejects.toMatchObject({
      status: 303,
      location: '/en-ca/favourites',
    });
  });

  it('returns page data for signed-in users on /favourites/datasets', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData('user-123'));
    const event = createEvent('https://example.test/en-ca/favourites/datasets');
    const data = (await loadDatasets(event as unknown as Parameters<typeof loadDatasets>[0])) as {
      lang: string;
      userData: { uuid: string | null };
      tTitle2: { text: string; href: string };
      tTitle3: { text: string; href: string };
    };

    expect(data.lang).toBe('en-ca');
    expect(data.userData.uuid).toBe('user-123');
    expect(data.tTitle2).toMatchObject({ text: 'Favourites', href: 'https://example.test/en-ca/favourites' });
    expect(data.tTitle3).toMatchObject({ text: 'Datasets', href: 'https://example.test/en-ca/favourites/datasets' });
  });

  it('returns page data for signed-in users on /favourites/maps', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData('user-123'));
    const event = createEvent('https://example.test/en-ca/favourites/maps');
    const data = (await loadMaps(event as unknown as Parameters<typeof loadMaps>[0])) as {
      lang: string;
      userData: { uuid: string | null };
      tTitle2: { text: string; href: string };
      tTitle3: { text: string; href: string };
    };

    expect(data.lang).toBe('en-ca');
    expect(data.userData.uuid).toBe('user-123');
    expect(data.tTitle2).toMatchObject({ text: 'Favourites', href: 'https://example.test/en-ca/favourites' });
    expect(data.tTitle3).toMatchObject({ text: 'Maps', href: 'https://example.test/en-ca/favourites/maps' });
  });

  it('returns page data for signed-in users on /favourites/view', async () => {
    loadFavouritesPageDataMock.mockResolvedValue(createPageData('user-123'));
    const event = createEvent('https://example.test/en-ca/favourites/view?mapId=abc');
    const data = (await loadView(event as unknown as Parameters<typeof loadView>[0])) as {
      lang: string;
      userData: { uuid: string | null };
      tTitle2: { text: string; href: string };
      tTitle3: { text: string; href: string };
    };

    expect(data.lang).toBe('en-ca');
    expect(data.userData.uuid).toBe('user-123');
    expect(data.tTitle2).toMatchObject({ text: 'Favourites', href: 'https://example.test/en-ca/favourites' });
    expect(data.tTitle3).toMatchObject({ text: 'Map', href: 'https://example.test/en-ca/favourites/view?mapId=abc' });
  });
});

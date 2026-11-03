/**
 * Test coverage: Unit tests for app-language normalization and path-based language detection.
 */
import { describe, expect, it } from 'vitest';
import { getAppLanguage, getLangFromPath, getLanguageSwitchUrl, isAppLanguage, isFrench, pickByLanguage } from '#lib/utils/language.js';

describe('getAppLanguage', () => {
  it('normalizes short codes to full app codes', () => {
    expect(getAppLanguage('en')).toBe('en-ca');
    expect(getAppLanguage('fr')).toBe('fr-ca');
  });

  it('accepts full app codes case-insensitively', () => {
    expect(getAppLanguage('EN-CA')).toBe('en-ca');
    expect(getAppLanguage('Fr-Ca')).toBe('fr-ca');
  });

  it('falls back to en-ca for missing or unsupported input', () => {
    expect(getAppLanguage(null)).toBe('en-ca');
    expect(getAppLanguage(undefined)).toBe('en-ca');
    expect(getAppLanguage('')).toBe('en-ca');
    expect(getAppLanguage('de-de')).toBe('en-ca');
  });
});

describe('isAppLanguage', () => {
  it('accepts only the two supported app language codes', () => {
    expect(isAppLanguage('en-ca')).toBe(true);
    expect(isAppLanguage('fr-ca')).toBe(true);
  });

  it('rejects missing values and unsupported codes', () => {
    expect(isAppLanguage(null)).toBe(false);
    expect(isAppLanguage(undefined)).toBe(false);
    expect(isAppLanguage('')).toBe(false);
    expect(isAppLanguage('en')).toBe(false);
  });
});

describe('isFrench', () => {
  it('is true only for fr-ca', () => {
    expect(isFrench('fr-ca')).toBe(true);
    expect(isFrench('en-ca')).toBe(false);
  });
});

describe('pickByLanguage', () => {
  it('picks the French value for fr-ca and the English value otherwise', () => {
    expect(pickByLanguage('fr-ca', 'Sign in', 'Se connecter')).toBe('Se connecter');
    expect(pickByLanguage('en-ca', 'Sign in', 'Se connecter')).toBe('Sign in');
  });
});

describe('getLangFromPath', () => {
  it('extracts the language segment from a relative path', () => {
    expect(getLangFromPath('/fr-ca/map-browser')).toBe('fr-ca');
    expect(getLangFromPath('/en-ca/favourites')).toBe('en-ca');
  });

  describe('getLanguageSwitchUrl', () => {
    const pagePaths = [
      '',
      '/map-browser',
      '/map-browser/record/000183ed-8864-42f0-ae43-c4313a860720',
      '/map-browser/record/000183ed-8864-42f0-ae43-c4313a860720/map',
      '/favourites',
      '/favourites/datasets',
      '/favourites/maps',
      '/favourites/view',
      '/sign-in/launch',
      '/sign-in/oidc-logout',
    ];

    describe.each([
      ['en-ca', 'fr-ca'],
      ['fr-ca', 'en-ca'],
    ] as const)('all pages switching from %s to %s', (from, to) => {
      it.each(pagePaths)('preserves the route, query and fragment for /%s', (path) => {
        const url = new URL(`https://example.test/${from}${path}?keyword=water%20quality&page-number=2#details`);
        const switched = getLanguageSwitchUrl(url, to);

        expect(switched).toBe(`https://example.test/${to}${path}?keyword=water%20quality&page-number=2#details`);
        expect(getLanguageSwitchUrl(new URL(switched), from)).toBe(url.href);
      });

      it('preserves the logout return destination in the selected language', () => {
        const url = new URL(`https://example.test/${from}/sign-in/oidc-logout?returnTo=%2F${from}%2Ffavourites`);
        const switched = new URL(getLanguageSwitchUrl(url, to));

        expect(switched.pathname).toBe(`/${to}/sign-in/oidc-logout`);
        expect(switched.searchParams.get('returnTo')).toBe(`/${to}/favourites`);
        expect(getLanguageSwitchUrl(switched, from)).toBe(url.href);
      });

      it('preserves an unsaved dataset addition to a saved map', () => {
        const url = new URL(`https://example.test/${from}/favourites/view?mapId=saved-map&addDatasetId=dataset-id&source=maps#map`);
        const switched = new URL(getLanguageSwitchUrl(url, to));

        expect(switched.pathname).toBe(`/${to}/favourites/view`);
        expect(switched.search).toBe(url.search);
        expect(switched.hash).toBe('#map');
        expect(getLanguageSwitchUrl(switched, from)).toBe(url.href);
      });

      it('preserves a local sign-in return destination in the selected language', () => {
        const destination = `https://example.test/${from}/favourites/view?mapId=saved-map&source=maps#map`;
        const url = new URL(`https://example.test/${from}/sign-in/launch`);
        url.searchParams.set('state', destination);
        const switched = new URL(getLanguageSwitchUrl(url, to));

        expect(switched.pathname).toBe(`/${to}/sign-in/launch`);
        expect(switched.searchParams.get('state')).toBe(`https://example.test/${to}/favourites/view?mapId=saved-map&source=maps#map`);
        expect(getLanguageSwitchUrl(switched, from)).toBe(url.href);
      });
    });

    it('preserves search filters, pagination, sorting and search mode', () => {
      const url = new URL(
        'https://example.test/en-ca/map-browser?keyword=water&searchMethod=classic&org=nrcan&type=map&theme=water&bbox=-120%2C40%2C-60%2C70&begin=2020-01-01&end=2026-01-01&sort=title&page-number=3#results'
      );
      const switched = new URL(getLanguageSwitchUrl(url, 'fr-ca'));

      expect(switched.pathname).toBe('/fr-ca/map-browser');
      expect(switched.search).toBe(url.search);
      expect(switched.hash).toBe(url.hash);
    });

    it.each(['https://external.test/en-ca/favourites', 'http://[', 'opaque-oidc-state'])(
      'does not rewrite an external, malformed or opaque sign-in state: %s',
      (state) => {
        const url = new URL('https://example.test/en-ca/sign-in/launch');
        url.searchParams.set('state', state);

        expect(new URL(getLanguageSwitchUrl(url, 'fr-ca')).searchParams.get('state')).toBe(state);
      }
    );

    it('does not rewrite opaque state or returnTo on other routes', () => {
      const url = new URL('https://example.test/en-ca/map-browser?state=en-ca&returnTo=%2Fen-ca%2Ffavourites');

      expect(new URL(getLanguageSwitchUrl(url, 'fr-ca')).search).toBe(url.search);
    });

    it.each([
      ['en-ca', 'fr-ca'],
      ['fr-ca', 'en-ca'],
    ] as const)('preserves saved-map and presentation state switching from %s to %s', (from, to) => {
      const url = new URL(`https://example.test/${from}/favourites/view?mapId=saved-map&source=maps&presentation=1#map`);

      expect(getLanguageSwitchUrl(url, to)).toBe(
        `https://example.test/${to}/favourites/view?mapId=saved-map&source=maps&presentation=1#map`
      );
      expect(url.pathname).toBe(`/${from}/favourites/view`);
    });

    it('preserves encoded dataset IDs when switching language', () => {
      const url = new URL('https://example.test/en-ca/favourites/view?ids=dataset-1%2Cdataset-2&source=datasets');

      expect(getLanguageSwitchUrl(url, 'fr-ca')).toBe(
        'https://example.test/fr-ca/favourites/view?ids=dataset-1%2Cdataset-2&source=datasets'
      );
    });

    it('changes only the language path segment, not the host, query or fragment', () => {
      const url = new URL('https://en-ca.example.test/en-ca/map-browser?keyword=en-ca#fr-ca');

      expect(getLanguageSwitchUrl(url, 'fr-ca')).toBe('https://en-ca.example.test/fr-ca/map-browser?keyword=en-ca#fr-ca');
    });

    it('supports localized root paths and leaves unlocalized paths unchanged', () => {
      expect(getLanguageSwitchUrl(new URL('https://example.test/en-ca'), 'fr-ca')).toBe('https://example.test/fr-ca');
      expect(getLanguageSwitchUrl(new URL('https://example.test/map-browser'), 'fr-ca')).toBe('https://example.test/map-browser');
    });
  });

  it('extracts the language segment from an absolute URL', () => {
    expect(getLangFromPath('https://example.test/fr-ca/map-browser?x=1')).toBe('fr-ca');
  });

  it('falls back to en-ca when no language segment is present', () => {
    expect(getLangFromPath('/map-browser')).toBe('en-ca');
    expect(getLangFromPath('https://example.test/map-browser')).toBe('en-ca');
  });

  it('falls back to en-ca for missing input', () => {
    expect(getLangFromPath(null)).toBe('en-ca');
    expect(getLangFromPath(undefined)).toBe('en-ca');
    expect(getLangFromPath('')).toBe('en-ca');
  });
});

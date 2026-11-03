import { describe, expect, it } from 'vitest';
import { load } from '../../routes/[lang]/sign-in/launch/+page.server';
import { getLanguageSwitchUrl } from '#lib/utils/language.js';

function loadLaunch(lang: string, url: string) {
  return load({
    params: { lang },
    url: new URL(url),
  } as unknown as Parameters<typeof load>[0]);
}

describe('GET /[lang]/sign-in/launch', () => {
  it.each([
    ['en-ca', 'fr-ca'],
    ['fr-ca', 'en-ca'],
  ] as const)('keeps the return page after switching from %s to %s', (from, to) => {
    const url = new URL(`https://app.geo.ca/${from}/sign-in/launch`);
    url.searchParams.set('state', `https://app.geo.ca/${from}/map-browser?keyword=water`);
    const switched = getLanguageSwitchUrl(url, to);

    expect(loadLaunch(to, switched)).toEqual({
      lang: to,
      signInUrl: `/${to}/sign-in/send?state=${encodeURIComponent(`https://app.geo.ca/${to}/map-browser?keyword=water`)}`,
    });
  });

  it('defaults to localized favourites', () => {
    expect(loadLaunch('fr-ca', 'https://app.geo.ca/fr-ca/sign-in/launch')).toEqual({
      lang: 'fr-ca',
      signInUrl: '/fr-ca/sign-in/send?state=https%3A%2F%2Fapp.geo.ca%2Ffr-ca%2Ffavourites',
    });
  });

  it('preserves a same-origin localized return state', () => {
    expect(
      loadLaunch('en-ca', 'https://app.geo.ca/en-ca/sign-in/launch?state=https%3A%2F%2Fapp.geo.ca%2Fen-ca%2Ffavourites%3Ftab%3Dmaps')
    ).toEqual({
      lang: 'en-ca',
      signInUrl: '/en-ca/sign-in/send?state=https%3A%2F%2Fapp.geo.ca%2Fen-ca%2Ffavourites%3Ftab%3Dmaps',
    });
  });

  it('rejects a return state on another origin', () => {
    expect(loadLaunch('en-ca', 'https://app.geo.ca/en-ca/sign-in/launch?state=https%3A%2F%2Fevil.example%2F')).toEqual({
      lang: 'en-ca',
      signInUrl: '/en-ca/sign-in/send?state=https%3A%2F%2Fapp.geo.ca%2Fen-ca%2Ffavourites',
    });
  });
});

import type { Actions, PageServerLoad } from './$types';
import { getUserData } from '$lib/db/user';
import { removeFromFavourites } from '$lib/actions';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result';
import type { GeospatialRecord, UserInfo } from '$lib/db/db-types';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
  let response: GeospatialRecord[] = [];
  let userData: UserInfo | undefined;
  let sanitizedResults: GeospatialRecord[] = [];

  const canonicalUrl = `${url.origin}/${params.lang}/favourites`;
  const alternateLang = params.lang === 'fr-ca' ? 'en-ca' : 'fr-ca';
  const alternateUrl = url.href.replace(params.lang, alternateLang);
  const metaDescription =
    params.lang === 'fr-ca'
      ? 'Consultez vos ressources sauvegardées et créez une carte personnalisée.'
      : 'Browse your saved resources and create a custom map.';

  try {
    userData = await getUserData(cookies);
  } catch (e) {
    console.error('error fetching user data in records: \n', e);
  }

  try {
    response = await getRecords(userData?.Item.favourites ?? [], params.lang, fetch);
  } catch (e) {
    console.error('error fetching records: \n', e);
  }

  try {
    sanitizedResults = sanitize(response, params.lang);
  } catch (e) {
    console.error('error fetching records: \n', e);
  }

  return {
    lang: params.lang,
    tTitle1: {
      text: params.lang === 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
      href: `${url.origin}/${params.lang}/map-browser`,
    },
    tTitle2: {
      text: params.lang === 'en-ca' ? 'Favourites' : 'Favoris',
      href: url.href,
    },
    results: sanitizedResults,
    userData: userData?.Item || { uuid: null, favourites: [] },
    canonicalUrl: canonicalUrl,
    alternateUrl: alternateUrl,
    alternateLang: alternateLang,
    metaDescription: metaDescription,
  };
};

/**
 * Gets a record from the GeoCore API.
 *
 * @param id - The record ID.
 * @param lang - The language code.
 * @param fetch - The fetch function.
 * @returns A promise that resolves to the fetch response.
 */
function getRecord(id: string, lang: string, fetch: (url: string | URL, options?: RequestInit) => Promise<Response>): Promise<Response> {
  const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;
  const url = new URL(`${GEOCORE_API_DOMAIN}/id`);
  const params = {
    id: id,
    lang: lang.split('-')[0],
  };
  url.search = new URLSearchParams(params).toString();
  return fetch(url);
}

/**
 * Gets multiple records from the GeoCore API.
 *
 * @param idIterator - An iterable of record IDs.
 * @param lang - The language code.
 * @param fetch - The fetch function.
 * @returns A promise that resolves to an array of records.
 */
async function getRecords(
  idIterator: Iterable<string>,
  lang: string,
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>
): Promise<GeospatialRecord[]> {
  const promises = [];

  for (const id of idIterator) {
    promises.push(getRecord(id, lang, fetch));
  }

  const results = await Promise.all(promises);
  const values = [...results];

  const ret = await Promise.all(
    values.map(async (value) => {
      try {
        const contents = (await value.json()) as { Items?: GeospatialRecord[] };
        if (contents.Items?.[0]) return contents.Items[0];
      } catch (error) {
        console.log(error);
      }
    })
  );

  return ret.filter((item): item is GeospatialRecord => item !== undefined);
}

export const actions = {
  removeFromFavourites: removeFromFavourites,
} satisfies Actions;

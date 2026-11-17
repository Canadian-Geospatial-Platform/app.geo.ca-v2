import { getTranslations } from '#lib/i18n/index.js';
import { getUserData } from '#lib/db/user.js';
import type { GeospatialRecord, UserData, UserDataLoadStatus } from '#lib/db/db-types.js';
import { sanitize } from '#lib/utils/data-sanitization/geocore-result.js';
import { buildCatalogTitle, buildPageTitle, buildSeoMetadata } from '#lib/utils/metadata.js';
import { getContentLanguage, type AppLanguage } from '#lib/utils/language.js';

type FavouritesLoadInput = {
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>;
  url: URL;
  cookies: Parameters<typeof getUserData>[0];
  lang: AppLanguage;
};

type FavouritesLoadOutput = {
  tTitle1: ReturnType<typeof buildCatalogTitle>;
  tTitle2: ReturnType<typeof buildPageTitle>;
  results: GeospatialRecord[];
  userData: UserData;
  userDataStatus: UserDataLoadStatus;
  canonicalUrl: string;
  alternateUrl: string;
  alternateLang: AppLanguage;
  metaDescription: string;
};

/**
 * Loads shared data used by favourites pages.
 *
 * @param input - Page load inputs including fetch, URL, cookies, and language.
 * @returns Shared favourites page data used by server and page loads.
 */
export async function loadFavouritesPageData({ fetch, url, cookies, lang: appLang }: FavouritesLoadInput): Promise<FavouritesLoadOutput> {
  let response: GeospatialRecord[] = [];
  let userInfo: Awaited<ReturnType<typeof getUserData>> | undefined;
  let sanitizedResults: GeospatialRecord[] = [];

  const seo = buildSeoMetadata(url, appLang, 'favourites', getTranslations(appLang).pages.favourites.description);

  try {
    // Keep the page rendering even if user lookup fails.
    userInfo = await getUserData(cookies);
  } catch (e) {
    console.error('error fetching user data in records: \n', e);
  }

  try {
    response = await getRecords(userInfo?.status === 'unavailable' ? [] : (userInfo?.Item.favourites ?? []), appLang, fetch);
  } catch (e) {
    console.error('error fetching records: \n', e);
  }

  try {
    sanitizedResults = sanitize(response, appLang);
  } catch (e) {
    console.error('error sanitizing records: \n', e);
  }

  return {
    tTitle1: buildCatalogTitle(url, appLang),
    tTitle2: userInfo?.Item.uuid
      ? buildPageTitle(url, getTranslations(appLang).general.myGeo)
      : buildPageTitle(url, getTranslations(appLang).components.header.navigation.favourites.title),
    results: sanitizedResults,
    userData: userInfo?.Item || { uuid: null, favourites: [], mapConfigs: [] },
    userDataStatus: userInfo?.status ?? 'anonymous',
    canonicalUrl: seo.canonicalUrl,
    alternateUrl: seo.alternateUrl,
    alternateLang: seo.alternateLang,
    metaDescription: seo.metaDescription,
  };
}

/**
 * Gets a record from the GeoCore API.
 *
 * @param id - GeoCore record identifier.
 * @param appLang - Full application language code used to derive the GeoCore locale.
 * @param fetch - Fetch implementation used to call the GeoCore API.
 * @returns Promise resolving to the GeoCore response for a single record.
 */
function getRecord(
  id: string,
  appLang: AppLanguage,
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>
): Promise<Response> {
  const url = new URL(`${process.env.GEOCORE_API_DOMAIN}/id`);
  const params = {
    id: id,
    lang: getContentLanguage(appLang),
  };
  url.search = new URLSearchParams(params).toString();
  return fetch(url);
}

/**
 * Gets multiple records from the GeoCore API.
 *
 * @param idIterator - Iterable collection of GeoCore record identifiers.
 * @param appLang - Full application language code used to derive the GeoCore locale.
 * @param fetch - Fetch implementation used to call the GeoCore API.
 * @returns Promise resolving to the list of successfully parsed GeoCore records.
 */
async function getRecords(
  idIterator: Iterable<string>,
  appLang: AppLanguage,
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>
): Promise<GeospatialRecord[]> {
  const responses = await Promise.all(Array.from(idIterator, (id) => getRecord(id, appLang, fetch)));

  const records = await Promise.all(
    responses.map(async (response) => {
      try {
        const contents = (await response.json()) as { Items?: GeospatialRecord[] };
        return contents.Items?.[0];
      } catch (error) {
        console.log(error);
        return undefined;
      }
    })
  );

  return records.filter((item): item is GeospatialRecord => item !== undefined);
}

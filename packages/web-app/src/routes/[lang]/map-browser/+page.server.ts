import type { Actions, PageServerLoad } from './$types';
import { addToFavourites, removeFromFavourites } from '$lib/actions';
import { getUserData } from '$lib/db/user';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result';
import { sanitizeSemantic } from '$lib/utils/data-sanitization/semantic-results';
import { formatNumber } from '$lib/utils/format-number';
import type { UserInfo } from '$lib/db/db-types';

interface SearchParams {
  north?: number | string;
  east?: number | string;
  south?: number | string;
  west?: number | string;
  keyword?: string;
  org?: string;
  type?: string;
  theme?: string;
  bbox?: string;
  foundational?: string;
  begin?: string;
  end?: string;
  lang: string;
  min: number;
  max: number;
  sort?: string | null;
}

interface SemanticSearchParams {
  method: string;
  q: string;
  topic_category?: string;
  bbox?: string;
  relation?: string;
  begin?: string;
  end?: string;
  org?: string;
  type?: string;
  theme?: string;
  foundational?: string;
  mappable?: string;
  source_system?: string;
  eo_collection?: string;
  polarization: string;
  orbit_direction: string;
  lang: string;
  sort?: string;
  order: string;
  size?: string;
  from: number;
}

const SEMANTIC_SEARCH_URL = process.env.SEMANTIC_SEARCH_URL;
const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

export const load: PageServerLoad = async ({ request, fetch, params, url, cookies }) => {
  let searchMode = url.searchParams.get('searchMethod') === 'classic' ? 'classic' : 'semantic';
  let response;
  if (searchMode === 'classic') {
    response = await generateUrl(
      fetch,
      url.searchParams,
      params.lang,
      cookies.get('id_token') || '',
      request.headers.get('x-forwarded-for') || ''
    );
  } else {
    response = await generateSemanticUrl(
      fetch,
      url.searchParams,
      params.lang,
      cookies.get('id_token') || '',
      request.headers.get('x-forwarded-for') || ''
    );
  }
  let analytics = await getAnalytics(fetch);
  let parsedResponse = [];
  let userData: UserInfo = { Item: { uuid: '', favourites: [] } };
  let sanitizedResults: string | any[] = [];
  try {
    parsedResponse = await response.json();
    if (searchMode === 'classic') {
      sanitizedResults = sanitize(parsedResponse.Items, params.lang);
    } else {
      sanitizedResults = sanitizeSemantic(parsedResponse?.response?.items);
    }
  } catch (e) {
    console.error(e);
  }

  let totalHits;
  if (searchMode === 'classic') {
    totalHits = parseInt(sanitizedResults?.[0]?.total ? sanitizedResults[0].total : 0);
  } else {
    totalHits = parsedResponse?.response?.total_hits ?? 0;
  }

  try {
    userData = await getUserData(cookies);
  } catch (e) {
    console.warn(e);
  }

  const canonicalUrl = `${url.origin}/${params.lang}/map-browser`;
  const alternateLang = params.lang === 'fr-ca' ? 'en-ca' : 'fr-ca';
  const alternateUrl = url.href.replace(params.lang, alternateLang);
  const metaDescription =
    params.lang === 'fr-ca'
      ? 'Parcourez les enregistrements GeoCore et trouvez les jeux de données les plus pertinents selon vos termes de recherche et filtres sélectionnés.'
      : 'Browse GeoCore records and find the most relevant datasets based on your search terms and selected filters.';

  return {
    lang: params.lang,
    results: sanitizedResults,
    userData: userData.Item,
    start: getMin(url.searchParams),
    end: getMin(url.searchParams) + sanitizedResults?.length,
    analytics: analytics,
    searchMode: searchMode,
    totalHits: totalHits,
    canonicalUrl: canonicalUrl,
    alternateUrl: alternateUrl,
    alternateLang: alternateLang,
    metaDescription: metaDescription,
  };
};

// TODO: combine generateUrl and generateSemanticUrl into one function with a mode parameter
/**
 * Generates a url and sends a fetch request to get records from the GeoCore API.
 *
 * @param fetch - The fetch function.
 * @param searchParams - The URL search parameters.
 * @param lang - The language code.
 * @param token - The authentication token.
 * @param ip - The user's IP address.
 * @returns A promise that resolves to the fetch response.
 */
function generateUrl(
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>,
  searchParams: URLSearchParams,
  lang: string,
  token: string,
  ip: string
): Promise<Response> {
  let url = new URL(`${GEOCORE_API_DOMAIN}/geo`);
  const params = mapSearchParams(searchParams, lang);
  // URLSearchParams automatically encodes special characters to the html counterpart.
  // However, the geocore get requests require the '+' to be unencoded, so
  // we can fix it with replaceAll(). Additionally, the ' character needs to be
  // replaced with '', so we can use replaceAll() a second time.
  url.search = new URLSearchParams(params as unknown as Record<string, string>)
    .toString()
    .replaceAll('%2B', '+')
    .replaceAll('%27', '%27%27');

  return fetch(url, {
    headers: {
      Authentication: `Bearer ${token}`,
      'x-forwarded-for': ip,
    },
  });
}

/**
 * Generates semantic search url and sends a fetch request to get records from the GeoCore API.
 *
 * @param fetch - The fetch function.
 * @param searchParams - The URL search parameters.
 * @param lang - The language code.
 * @param token - The authentication token.
 * @param ip - The user's IP address.
 * @returns A promise that resolves to the fetch response.
 */
function generateSemanticUrl(
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>,
  searchParams: URLSearchParams,
  lang: string,
  token: string,
  ip: string
): Promise<Response> {
  // Testing staging version of semantic search instead of the prod version.
  // Commenting out prod url out for now in case we decide to switch back.
  // let url = new URL(SEMANTIC_SEARCH_URL);
  let url = new URL(`${SEMANTIC_SEARCH_URL}/search-opensearch`);

  const params = mapSemanticSearchResults(searchParams, lang);
  // URLSearchParams automatically encodes special characters to the html counterpart.
  // However, the geocore get requests require the '+' to be unencoded, so
  // we can fix it with replaceAll().
  url.search = new URLSearchParams(params as unknown as Record<string, string>).toString().replaceAll('%2B', '+');
  return fetch(url, {
    headers: {
      Authentication: `Bearer ${token}`,
      'x-forwarded-for': ip,
    },
  });
}

/**
 * Fetches analytics data from the GeoCore API.
 *
 * @param fetch - The fetch function.
 * @returns The analytics results.
 * @async
 */
async function getAnalytics(fetch: (url: string | URL, options?: RequestInit) => Promise<Response>): Promise<any> {
  let analytics = await fetch(`${GEOCORE_API_DOMAIN}/analytics/11`);
  let parsedAnalytics = [];

  try {
    parsedAnalytics = await analytics.json();
  } catch (e) {
    console.error(e);
  }

  for (let i = 0; i < parsedAnalytics.Items.length; i++) {
    let item = parsedAnalytics.Items[i];
    let total = item?.total;
    let organization = item?.organization;

    parsedAnalytics.Items[i].total = total ? formatNumber(total) : 'N/A';
    parsedAnalytics.Items[i].organization = organization ? formatNumber(organization) : 'N/A';
  }

  return parsedAnalytics?.Items[0] ?? {};
}

/**
 * Maps URL search parameters to the format required by the GeoCore API.
 *
 * @param searchParams - The URL search parameters.
 * @param lang - The language code.
 * @returns The mapped search parameters.
 */
function mapSearchParams(searchParams: URLSearchParams, lang: string): SearchParams {
  let mappedParams: SearchParams = {
    north: searchParams.get('north') ?? 90,
    east: searchParams.get('east') ?? 180,
    south: searchParams.get('south') ?? -90,
    west: searchParams.get('west') ?? -180,
    // TODO: separate keyword and category of interest.
    // For now, there is no category of interest param to query,
    // so it is grouped with the keywords
    keyword: getKeyword(searchParams),
    org: searchParams.get('org') ?? '',
    type: searchParams.get('type') ?? '',
    theme: searchParams.get('theme') ?? '',
    bbox: searchParams.get('bbox') ?? '',
    foundational: searchParams.get('foundational') ? 'true' : '',
    begin: typeof searchParams.get('begin') === 'string' ? new Date(searchParams.get('begin') as string).toISOString() : '',
    end: typeof searchParams.get('end') === 'string' ? new Date(searchParams.get('end') as string).toISOString() : '',
    lang: lang.split('-')[0],
    min: getMin(searchParams),
    max: getMax(searchParams),
    sort: searchParams.get('sort'),
  };
  return mappedParams;
}

/**
 * Maps semantic URL search parameters to the format required by the GeoCore API for semantic search.
 *
 * @param searchParams - The URL search parameters.
 * @param lang - The language code.
 * @returns The mapped search parameters.
 */
function mapSemanticSearchResults(searchParams: URLSearchParams, lang: string): SemanticSearchParams {
  let west = searchParams.get('west') ?? -180;
  let north = searchParams.get('north') ?? 90;
  let east = searchParams.get('east') ?? 180;
  let south = searchParams.get('south') ?? -90;
  let bbox = searchParams.get('bbox') ? `${west},${south},${east},${north}` : '';
  let searchTerms = searchParams.get('search-terms');
  let mappedParams: SemanticSearchParams = {
    // Revisit which search method is better after user testing
    method: 'SemanticSearch', // 'HybridSearch',
    q: searchTerms ? searchTerms.replaceAll('"', '') : '',
    topic_category: searchParams.get('category-of-interest') ?? '',
    bbox: bbox,
    relation: searchParams.get('relation') ?? 'intersects',
    begin: typeof searchParams.get('begin') === 'string' ? new Date(searchParams.get('begin') as string).toISOString() : '',
    end: typeof searchParams.get('end') === 'string' ? new Date(searchParams.get('end') as string).toISOString() : '',
    org: searchParams.get('org') ?? '',
    type: searchParams.get('type') ?? '',
    theme: searchParams.get('theme') ?? '',
    foundational: searchParams.get('foundational') ? 'true' : '',
    mappable: searchParams.get('mappable') ? 'true' : '',
    source_system: searchParams.get('source_system') ?? '',
    eo_collection: searchParams.get('eo_collection') ?? '',
    polarization: '',
    orbit_direction: '',
    lang: lang.split('-')[0],
    sort: searchParams.get('sort') ?? 'relevancy',
    order: searchParams.get('sort') === 'title' ? 'asc' : 'desc',
    size: searchParams.get('results-per-page') ?? '10',
    from: getMin(searchParams),
  };
  return mappedParams;
}

/**
 * Extracts and formats the keyword from the search parameters.
 *
 * @param searchParams - The URL search parameters.
 * @returns The formatted keyword.
 */
function getKeyword(searchParams: URLSearchParams): string {
  const searchTerms = searchParams.get('search-terms');
  const category = searchParams.get('category-of-interest');
  let keywords = '';

  if (searchTerms && category) {
    keywords = `${searchTerms}+${category}`;
  } else if (searchTerms) {
    keywords = searchTerms;
  } else if (category) {
    keywords = category;
  }

  // Remove quotation characters, the semantic search throws an error if they are included
  keywords = keywords.replaceAll('"', '');

  return keywords;
}

/**
 * Calculates the minimum index for pagination.
 *
 * @param searchParams - The URL search parameters.
 * @returns The minimum index.
 */
function getMin(searchParams: URLSearchParams): number {
  const pn = searchParams.get('page-number') ? parseInt(searchParams.get('page-number') as string) : 0;
  const pc = searchParams.get('results-per-page') ? parseInt(searchParams.get('results-per-page') as string) : 10;
  const ret = pn * pc;
  return ret;
}

/**
 * Calculates the maximum index for pagination.
 *
 * @param searchParams - The URL search parameters.
 * @returns The maximum index.
 */
function getMax(searchParams: URLSearchParams): number {
  const pn = searchParams.get('page-number') ? parseInt(searchParams.get('page-number') as string) : 0;
  const pc = searchParams.get('results-per-page') ? parseInt(searchParams.get('results-per-page') as string) : 10;
  const ret = (pn + 1) * pc;
  if (pn > 0) {
    return ret - 1;
  }
  return ret;
}

export const actions = {
  addToFavourites: addToFavourites,
  removeFromFavourites: removeFromFavourites,
} satisfies Actions;

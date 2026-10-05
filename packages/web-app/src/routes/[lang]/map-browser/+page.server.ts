import type { Actions, PageServerLoad } from './$types';
import { addToFavourites, removeFromFavourites } from '$lib/actions';
import { getUserData } from '$lib/db/user';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result';
import { sanitizeSemantic } from '$lib/utils/data-sanitization/semantic-results';
import { formatNumber } from '$lib/utils/format-number';
import type { GeospatialRecord, UserInfo } from '$lib/db/db-types';
import { getAppLanguage } from '$lib/utils/language';
import { buildSeoMetadata } from '$lib/utils/metadata';

import { SEMANTIC_SEARCH_URL, GEOCORE_API_DOMAIN } from '$env/static/private';

interface ParsedResponse {
  Items?: GeospatialRecord[];
  response?: {
    items?: Parameters<typeof sanitizeSemantic>[0];
    total_hits?: number;
  };
}

interface AnalyticsItem {
  total?: string;
  organization?: string;
  [key: string]: string | undefined;
}

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

type SearchMode = 'classic' | 'semantic';

export const load: PageServerLoad = async ({ request, fetch, params, url, cookies }) => {
  const lang = getAppLanguage(params.lang);
  const searchMode: SearchMode = url.searchParams.get('searchMethod') === 'classic' || !SEMANTIC_SEARCH_URL ? 'classic' : 'semantic';
  let parsedResponse: ParsedResponse = {};
  let userData: UserInfo = { Item: { uuid: '', favourites: [] }, status: 'anonymous' };
  let sanitizedResults: ReturnType<typeof sanitize> | ReturnType<typeof sanitizeSemantic> = [];

  try {
    const response = await generateSearchUrl(
      fetch,
      url.searchParams,
      lang,
      cookies.get('id_token') || '',
      request.headers.get('x-forwarded-for') || '',
      searchMode
    );
    parsedResponse = (await response.json()) as ParsedResponse;
    if (searchMode === 'classic') {
      sanitizedResults = sanitize(parsedResponse.Items ?? [], lang);
    } else {
      sanitizedResults = sanitizeSemantic(parsedResponse?.response?.items ?? []);
    }
  } catch (e) {
    console.error('Failed to fetch search results:', e);
  }

  const analytics = await getAnalytics(fetch);

  let totalHits;
  if (searchMode === 'classic') {
    const firstResult = sanitizedResults[0] as (GeospatialRecord & { total?: string }) | undefined;
    totalHits = parseInt(firstResult?.total ?? '0', 10);
  } else {
    totalHits = parsedResponse?.response?.total_hits ?? 0;
  }

  try {
    userData = await getUserData(cookies);
  } catch (e) {
    console.warn(e);
  }

  const seo = buildSeoMetadata(url, lang, 'map-browser', {
    en: 'Browse GeoCore records and find the most relevant datasets based on your search terms and selected filters.',
    fr: 'Parcourez les enregistrements GeoCore et trouvez les jeux de données les plus pertinents selon vos termes de recherche et filtres sélectionnés.',
  });

  return {
    lang,
    results: sanitizedResults,
    userData: userData.Item,
    start: getMin(url.searchParams),
    end: getMin(url.searchParams) + sanitizedResults?.length,
    analytics: analytics,
    searchMode: searchMode,
    totalHits: totalHits,
    canonicalUrl: seo.canonicalUrl,
    alternateUrl: seo.alternateUrl,
    alternateLang: seo.alternateLang,
    metaDescription: seo.metaDescription,
  };
};

/**
 * Generates a search URL and sends a fetch request to get records from the API.
 *
 * @param fetch - The fetch function.
 * @param searchParams - The URL search parameters.
 * @param lang - The language code.
 * @param token - The authentication token.
 * @param ip - The user's IP address.
 * @param mode - The search mode.
 * @returns A promise that resolves to the fetch response.
 */
function generateSearchUrl(
  fetch: (url: string | URL, options?: RequestInit) => Promise<Response>,
  searchParams: URLSearchParams,
  lang: string,
  token: string,
  ip: string,
  mode: SearchMode
): Promise<Response> {
  const isSemantic = mode === 'semantic';
  const url = isSemantic ? new URL(`${SEMANTIC_SEARCH_URL}/search-opensearch`) : new URL(`${GEOCORE_API_DOMAIN}/geo`);
  const params = isSemantic ? mapSemanticSearchResults(searchParams, lang) : mapSearchParams(searchParams, lang);

  // URLSearchParams automatically encodes special characters to the html counterpart.
  // However, the geocore get requests require the '+' to be unencoded, so
  // we can fix it with replaceAll(). Classic mode also requires single quotes
  // to be doubled for compatibility with the GeoCore endpoint.
  let query = new URLSearchParams(params as unknown as Record<string, string>).toString().replaceAll('%2B', '+');
  if (!isSemantic) {
    query = query.replaceAll('%27', '%27%27');
  }
  url.search = query;

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
async function getAnalytics(fetch: (url: string | URL, options?: RequestInit) => Promise<Response>): Promise<AnalyticsItem> {
  let parsedAnalytics: { Items: AnalyticsItem[] } = { Items: [] };

  try {
    const analytics = await fetch(`${GEOCORE_API_DOMAIN}/analytics/11`);
    const payload = (await analytics.json()) as { Items?: AnalyticsItem[] };
    parsedAnalytics = { Items: payload.Items ?? [] };
  } catch (e) {
    console.error('Failed to fetch analytics:', e);
  }

  for (let i = 0; i < parsedAnalytics.Items.length; i++) {
    const item = parsedAnalytics.Items[i];
    const total = item?.total;
    const organization = item?.organization;

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
  const mappedParams: SearchParams = {
    north: getNumericSearchParam(searchParams, 'north', 90),
    east: getNumericSearchParam(searchParams, 'east', 180),
    south: getNumericSearchParam(searchParams, 'south', -90),
    west: getNumericSearchParam(searchParams, 'west', -180),
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
  const west = getNumericSearchParam(searchParams, 'west', -180);
  const north = getNumericSearchParam(searchParams, 'north', 90);
  const east = getNumericSearchParam(searchParams, 'east', 180);
  const south = getNumericSearchParam(searchParams, 'south', -90);
  const bbox = searchParams.get('bbox') ? `${west},${south},${east},${north}` : '';
  const searchTerms = searchParams.get('search-terms');
  const mappedParams: SemanticSearchParams = {
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
 * Parses a numeric URL search parameter and falls back to a default value when invalid.
 *
 * @param searchParams - The URL search parameters.
 * @param key - The query parameter key.
 * @param fallback - The default value to use when the parameter is missing or invalid.
 * @returns A valid number as string.
 */
function getNumericSearchParam(searchParams: URLSearchParams, key: string, fallback: number): string {
  const raw = searchParams.get(key);
  if (raw === null || raw.trim() === '') {
    return String(fallback);
  }

  const parsed = Number(raw);
  if (Number.isFinite(parsed)) {
    return String(parsed);
  }

  return String(fallback);
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

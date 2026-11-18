import { formatTranslation, getTranslations } from '#lib/i18n/index.js';
import type { PageLoad } from './$types';
import { formatNumber } from '#lib/utils/format-number.js';
import { getAppLanguage, type AppLanguage } from '#lib/utils/language.js';

/**
 * Prepares localized sorting, breadcrumbs, and pagination text for search results.
 *
 * @param event - Client load event containing server data and current URL.
 * @returns Search data enriched with localized presentation values.
 */
export const load: PageLoad = ({ params, data, url }) => {
  const searchMode = data.searchMode ? (data.searchMode as 'classic' | 'semantic') : 'semantic';
  const appLang = getAppLanguage(params.lang);

  let sortOptions;
  if (searchMode === 'semantic') {
    sortOptions = getTranslations(appLang).components.searchResults.sorting.semantic;
  } else {
    sortOptions = getTranslations(appLang).components.searchResults.sorting.classic;
  }

  const totalResults = data.totalHits ? data.totalHits : 0;
  const numPageText = parsePageMessage(appLang, url, totalResults);
  const resultMessage = parseResultMessage(appLang, url, totalResults);
  return {
    results: data.results,
    lang: appLang,
    userData: data.userData,
    start: data.start,
    end: data.end,
    tTitle1: {
      text: getTranslations(appLang).general.catalogue,
      href: url.href,
    },
    total: totalResults,
    sortOptions,
    analytics: data.analytics,
    numPageText: numPageText,
    resultMessage: resultMessage,
    searchMode,
    canonicalUrl: data.canonicalUrl,
    alternateUrl: data.alternateUrl,
    alternateLang: data.alternateLang,
    metaDescription: data.metaDescription,
  };
};

/**
 * Generates the page message based on language, URL parameters, and total results.
 *
 * @param appLang - The language code.
 * @param url - The URL object.
 * @param totalResults - The total number of results.
 * @returns The page message.
 */
function parsePageMessage(appLang: AppLanguage, url: URL, totalResults: number): string {
  const paginationTranslations = getTranslations(appLang).components.searchResults.pagination;
  const searchParams = url.searchParams;
  const pageNumberParam = parseInt(searchParams.get('page-number') || '0');
  const perPageParam = parseInt(searchParams.get('results-per-page') || '10');

  // + 1 because the geocore page number starts at 0, but we want it to start
  // at 1 to match the pagination element
  const countPerPage = !isNaN(perPageParam) ? perPageParam : 10;
  const pageNumber = formatNumber(!isNaN(pageNumberParam) ? pageNumberParam + 1 : 1, appLang);
  const totalPages = formatNumber(Math.ceil(totalResults / countPerPage), appLang);
  const formattedNumberOfResults = formatNumber(totalResults, appLang);

  const template =
    totalResults === 0 ? paginationTranslations.empty : totalResults === 1 ? paginationTranslations.one : paginationTranslations.other;
  return formatTranslation(template, { count: formattedNumberOfResults, page: pageNumber, pages: totalPages });
}

/**
 * Generates the result message based on language, URL parameters, and total results.
 *
 * @param appLang - The language code.
 * @param url - The URL object.
 * @param totalResults - The total number of results.
 * @returns The result message.
 */
function parseResultMessage(appLang: AppLanguage, url: URL, totalResults: number): string {
  const messagesTranslations = getTranslations(appLang).components.searchResults.messages;
  const searchParams = url.searchParams;
  const searchTerm = searchParams.get('search-terms');

  const formattedNumberOfResults = formatNumber(totalResults, appLang);

  const templates = searchTerm ? messagesTranslations.keyword : messagesTranslations.browse;
  const template = totalResults === 1 ? templates.one : templates.other;
  return formatTranslation(template, { count: formattedNumberOfResults, term: searchTerm ?? '' });
}

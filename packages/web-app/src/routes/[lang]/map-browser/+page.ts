import type { PageLoad } from './$types';
import enLabels from '$lib/components/search-results/i18n/en/translations.json';
import frLabels from '$lib/components/search-results/i18n/fr/translations.json';
import enFilters from '$lib/components/search-results/i18n/en/filter-list.json';
import frFilters from '$lib/components/search-results/i18n/fr/filter-list.json';
import enCategories from '$lib/components/search-results/i18n/en/category-interest.json';
import frCategories from '$lib/components/search-results/i18n/fr/category-interest.json';
import enSortOptions from '$lib/components/search-results/i18n/en/sort-options.json';
import frSortOptions from '$lib/components/search-results/i18n/fr/sort-options.json';
import enSortOptionsSemantic from '$lib/components/search-results/i18n/en/sort-options-semantic.json';
import frSortOptionsSemantic from '$lib/components/search-results/i18n/fr/sort-options-semantic.json';
import { formatNumber } from '$lib/utils/format-number';
import { getAppLanguage, pickByLanguage } from '$lib/utils/language';

export const load: PageLoad = ({ params, data, url }) => {
  const searchMode = data.searchMode ? (data.searchMode as 'classic' | 'semantic') : 'semantic';
  const lang = getAppLanguage(params.lang);
  const t = pickByLanguage(lang, enLabels, frLabels);
  const filters = pickByLanguage(lang, enFilters, frFilters);
  const categories = pickByLanguage(lang, enCategories, frCategories);

  let sortOptions;
  if (searchMode === 'semantic') {
    sortOptions = pickByLanguage(lang, enSortOptionsSemantic, frSortOptionsSemantic);
  } else {
    sortOptions = pickByLanguage(lang, enSortOptions, frSortOptions);
  }

  const totalResults = data.totalHits ? data.totalHits : 0;
  const numPageText = parsePageMessage(lang, url, totalResults);
  const resultMessage = parseResultMessage(lang, url, totalResults);
  return {
    results: data.results,
    lang: lang,
    userData: data.userData,
    start: data.start,
    end: data.end,
    t,
    tTitle1: {
      text: lang === 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
      href: url.href,
    },
    total: totalResults,
    filters,
    categories,
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
 * @param lang - The language code.
 * @param url - The URL object.
 * @param totalResults - The total number of results.
 * @returns The page message.
 */
function parsePageMessage(lang: string, url: URL, totalResults: number): string {
  let message;
  let pageOfText;
  let datasetsText;
  const searchParams = url.searchParams;
  const pageNumberParam = parseInt(searchParams.get('page-number') || '0');
  const perPageParam = parseInt(searchParams.get('results-per-page') || '10');

  // + 1 because the geocore page number starts at 0, but we want it to start
  // at 1 to match the pagination element
  const countPerPage = !isNaN(perPageParam) ? perPageParam : 10;
  const pageNumber = formatNumber(!isNaN(pageNumberParam) ? pageNumberParam + 1 : 1);
  const totalPages = formatNumber(Math.ceil(totalResults / countPerPage));
  const formattedNumberOfResults = formatNumber(totalResults);

  if (lang === 'fr-ca') {
    datasetsText = totalResults === 1 ? 'Ensemble de données' : 'Ensembles de données';
    pageOfText = `Page ${pageNumber} sur ${totalPages}`;
    message = totalResults ? `${formattedNumberOfResults} ${datasetsText}, ${pageOfText}` : `${formattedNumberOfResults} ${datasetsText}`;
  } else {
    datasetsText = totalResults === 1 ? 'Dataset' : 'Datasets';
    pageOfText = `Page ${pageNumber} of ${totalPages}`;
    message = totalResults ? `${formattedNumberOfResults} ${datasetsText}, ${pageOfText}` : `${formattedNumberOfResults} ${datasetsText}`;
  }

  return message;
}

/**
 * Generates the result message based on language, URL parameters, and total results.
 *
 * @param lang - The language code.
 * @param url - The URL object.
 * @param totalResults - The total number of results.
 * @returns The result message.
 */
function parseResultMessage(lang: string, url: URL, totalResults: number): string {
  let message;
  let datasetsText;
  const searchParams = url.searchParams;
  const searchTerm = searchParams.get('search-terms');

  const formattedNumberOfResults = formatNumber(totalResults);

  if (lang === 'fr-ca') {
    datasetsText = totalResults === 1 ? 'ensemble de données' : 'ensembles de données';
    if (searchTerm) {
      message = `Nous avons trouvé ${formattedNumberOfResults} ${datasetsText} pour le mot-clé « ${searchTerm} ». Vous pouvez continuer à explorer les résultats de recherche dans la liste ci-dessous.`;
    } else {
      message = `Nous avons trouvé ${formattedNumberOfResults} ${datasetsText}. Vous pouvez affiner votre recherche en entrant un terme de recherche ci-dessous ou en cliquant sur le bouton des filtres pour certaines options avancées.`;
    }
  } else {
    datasetsText = totalResults === 1 ? 'dataset' : 'datasets';
    if (searchTerm) {
      message = `We have found ${formattedNumberOfResults} ${datasetsText} for the keyword "${searchTerm}". You can continue exploring the search results in the list below.`;
    } else {
      message = `We have found ${formattedNumberOfResults} ${datasetsText}. You can refine your search by entering a search term below, or clicking on the Filters button for some advanced options.`;
    }
  }

  return message;
}

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import enLabels from '$lib/components/search-results/i18n/en/translations.json';
import frLabels from '$lib/components/search-results/i18n/fr/translations.json';
import enFilters from '$lib/components/search-results/i18n/en/filter-list.json';
import frFilters from '$lib/components/search-results/i18n/fr/filter-list.json';
import enCategories from '$lib/components/search-results/i18n/en/category-interest.json';
import frCategories from '$lib/components/search-results/i18n/fr/category-interest.json';

export const load: PageLoad = ({ params, data, url }) => {
	let lang = params.lang;
	let t = lang == 'en-ca' ? enLabels : frLabels;
	let filters = lang == 'fr-ca' ? frFilters : enFilters;
	let categories = lang == 'fr-ca' ? frCategories : enCategories;
	let totalResults = parseInt(data.results?.[0]?.total ? data.results[0].total : 0);
	let numPageText = parsePageMessage(lang, url, totalResults);
	return {
		results: data.results,
		lang: lang,
		userData: data.userData,
		start: data.start,
		end: data.end,
		t: t,
		t_title_1: {
			text:
				lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.href
		},
		total: totalResults,
		filters: filters,
		categories: categories,
		analytics: data.analytics,
		numPageText: numPageText
	};
};

function parsePageMessage(lang, url, totalResults) {
  let message;
  let pageOfText;
  let datasetsText;
  let searchParams = url.searchParams;
  let pageNumberParam = parseInt(searchParams.get('page-number'));
  let perPageParam = parseInt(searchParams.get('results-per-page'));

  // + 1 because the geocore page number starts at 0, but we want it to start
  // at 1 to match the pagination element
  let pageNumber = !isNaN(pageNumberParam) ? pageNumberParam + 1 : 1;
  let perPage = !isNaN(perPageParam) ? perPageParam : 10;
  let totalPages = Math.ceil(totalResults / perPage);

  if (lang == 'fr-ca') {
    datasetsText = totalResults == 1 ? 'Ensemble de données' : 'Ensembles de données';
    pageOfText = 'Page ' + pageNumber + ' sur ' + totalPages;
    message = totalResults + ' ' + datasetsText + ', ' + pageOfText;
  } else {
    datasetsText = totalResults == 1 ? 'Dataset' : 'Datasets';
    pageOfText = 'Page ' + pageNumber + ' of ' + totalPages;
    message = totalResults + ' ' + datasetsText + ', ' + pageOfText;
  }

  return message;
}

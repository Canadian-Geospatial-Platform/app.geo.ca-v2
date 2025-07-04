import { error } from '@sveltejs/kit';
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
import { formatNumber } from '$lib/utils/format-number.ts';

export const load: PageLoad = ({ params, data, url }) => {
	let searchMode = data.searchMode ? data.searchMode : 'semantic';
	let lang = params.lang;
	let t = lang == 'fr-ca' ? frLabels : enLabels;
	let filters = lang == 'fr-ca' ? frFilters : enFilters;
	let categories = lang == 'fr-ca' ? frCategories : enCategories;

	let sortOptions;
	if (searchMode == 'semantic') {
		sortOptions = lang == 'fr-ca' ? frSortOptionsSemantic : enSortOptionsSemantic;
	} else {
		sortOptions = lang == 'fr-ca' ? frSortOptions : enSortOptions;
	}

	let totalResults = data.totalHits ? data.totalHits : 0;
	let numPageText = parsePageMessage(lang, url, totalResults);
	let resultMessage = parseResultMessage(lang, url, totalResults);
	return {
		results: data.results,
		lang: lang,
		userData: data.userData,
		start: data.start,
		end: data.end,
		t: t,
		t_title_1: {
			text: lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.href
		},
		total: totalResults,
		filters: filters,
		categories: categories,
		sortOptions: sortOptions,
		analytics: data.analytics,
		numPageText: numPageText,
		resultMessage: resultMessage,
		searchMode: searchMode,
		canonicalUrl: data.canonicalUrl,
		alternateUrl: data.alternateUrl,
		alternateLang: data.alternateLang,
		metaDescription: data.metaDescription
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

	totalResults = formatNumber(totalResults);
	pageNumber = formatNumber(pageNumber);
	perPage = formatNumber(perPage);
	totalPages = formatNumber(totalPages);

	if (lang == 'fr-ca') {
		datasetsText = totalResults == '1' ? 'Ensemble de données' : 'Ensembles de données';
		pageOfText = 'Page ' + pageNumber + ' sur ' + totalPages;
		message = totalResults + ' ' + datasetsText + ', ' + pageOfText;
	} else {
		datasetsText = totalResults == '1' ? 'Dataset' : 'Datasets';
		pageOfText = 'Page ' + pageNumber + ' of ' + totalPages;
		message = totalResults + ' ' + datasetsText + ', ' + pageOfText;
	}

	return message;
}

function parseResultMessage(lang, url, totalResults) {
	let message;
	let datasetsText;
	let searchParams = url.searchParams;
	let searchTerm = searchParams.get('search-terms');

	totalResults = formatNumber(totalResults);

	if (lang == 'fr-ca') {
		datasetsText = totalResults == '1' ? 'ensemble de données' : 'ensembles de données';
		if (searchTerm) {
			message =
				'Nous avons trouvé ' +
				totalResults +
				' ' +
				datasetsText +
				' pour le mot-clé « ' +
				searchTerm +
				' ». Vous pouvez continuer à explorer les résultats de recherche dans la liste ci-dessous.';
		} else {
			message =
				'Nous avons trouvé ' +
				totalResults +
				' ' +
				datasetsText +
				'. Vous pouvez affiner votre ' +
				'recherche en entrant un terme de recherche ci-dessous ou en cliquant sur le bouton des ' +
				'filtres pour certaines options avancées.';
		}
	} else {
		datasetsText = totalResults == '1' ? 'dataset' : 'datasets';
		if (searchTerm) {
			message =
				'We have found ' +
				totalResults +
				' ' +
				datasetsText +
				' for the keyword "' +
				searchTerm +
				'". You can continue exploring the search results in the list below.';
		} else {
			message =
				'We have found ' +
				totalResults +
				' ' +
				datasetsText +
				'. You can refine your ' +
				'search by entering a search term below, or clicking on the Filters button for some advanced options.';
		}
	}

	return message;
}

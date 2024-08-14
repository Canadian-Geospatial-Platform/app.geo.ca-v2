import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import enLabels from '$lib/components/search-results/i18n/en/translations.json';
import frLabels from '$lib/components/search-results/i18n/fr/translations.json';
import enFilters from '$lib/components/search-results/i18n/en/filter-list.json';
import frFilters from '$lib/components/search-results/i18n/fr/filter-list.json';
import enCategories from '$lib/components/search-results/i18n/en/category-interest.json';
import frCategories from '$lib/components/search-results/i18n/fr/category-interest.json';

export const load: PageLoad = ({ params, data, url }) => {
	let t = params.lang == 'en-ca' ? enLabels : frLabels;
	let filters = params.lang == 'fr-ca' ? frFilters : enFilters;
	let categories = params.lang == 'fr-ca' ? frCategories : enCategories;
	return {
		results: data.results,
		lang: params.lang,
		userData: data.userData,
		start: data.start,
		end: data.end,
		t: t,
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.href
		},
		total: parseInt(data.results?.[0]?.total ? data.results[0].total : 0),
		filters: filters,
		categories: categories,
	};
};

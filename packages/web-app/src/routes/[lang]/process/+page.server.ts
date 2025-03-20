import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import enLabels from '$lib/components/search-results/i18n/en/translations.json';
import frLabels from '$lib/components/search-results/i18n/fr/translations.json';
// import enFilters from '$lib/components/search-results/i18n/en/filter-list.json';
// import frFilters from '$lib/components/search-results/i18n/fr/filter-list.json';
// import enCategories from '$lib/components/search-results/i18n/en/category-interest.json';
// import frCategories from '$lib/components/search-results/i18n/fr/category-interest.json';
// import enSortOptions from '$lib/components/search-results/i18n/en/sort-options.json';
// import frSortOptions from '$lib/components/search-results/i18n/fr/sort-options.json';
// import enSortOptionsSemantic from '$lib/components/search-results/i18n/en/sort-options-semantic.json';
// import frSortOptionsSemantic from '$lib/components/search-results/i18n/fr/sort-options-semantic.json';

export const load: PageLoad = async (params) => {
    // let serviceUrl = "https://d6g0331e16.execute-api.ca-central-1.amazonaws.com/Stage/processes/FloodMapping";
    let serviceUrl = "https://d6g0331e16.execute-api.ca-central-1.amazonaws.com/Prod/processes/FloodMapping";
    const svcDef = await fetch(serviceUrl)
    if (!svcDef.ok) {
        throw new Error('Bad response');
    }

    return await svcDef.json()
};

import type { PageServerLoad } from './$types';
import { page } from '$app/stores';
import { addToFavourites, removeFromFavourites } from '$lib/actions.ts';
import { getUserData } from '$lib/db/user.ts';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result.ts';
import { sanitizeSemantic } from '$lib/utils/data-sanitization/semantic-results.ts';
import { formatNumber } from '$lib/utils/format-number.ts';

const SEMANTIC_SEARCH_URL = process.env.SEMANTIC_SEARCH_URL;

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	let searchMode = params?.searchMethod == 'classic' ? 'classic' : 'semantic';
	let response;
	if (searchMode == 'classic') {
		response = await generateUrl(fetch, url.searchParams, params.lang, cookies.get('id_token'));
	} else {
		response = await generateSemanticUrl(
			fetch,
			url.searchParams,
			params.lang,
			cookies.get('id_token')
		);
	}
	let analytics = await getAnalytics(fetch);
	let parsedResponse = [];
	let userData = { Item: { favourites: [] } };
	let sanitizedResults;
	try {
		parsedResponse = await response.json();
		if (searchMode == 'classic') {
			sanitizedResults = sanitize(parsedResponse.Items, params.lang);
		} else {
			sanitizedResults = sanitizeSemantic(parsedResponse?.response?.items, params.lang);
		}
	} catch (e) {
		console.error(e);
	}

	let totalHits;
	if (searchMode == 'classic') {
		totalHits = parseInt(sanitizedResults?.[0]?.total ? sanitizedResults[0].total : 0);
	} else {
		totalHits = parsedResponse?.response?.total_hits ?? 0;
	}

	try {
		userData = await getUserData(cookies);
	} catch (e) {
		console.warn(e);
	}

	const canonicalUrl = url.origin + '/' + params.lang + '/map-browser';
	const alternateLang = params.lang == 'fr-ca' ? 'en-ca' : 'fr-ca';
	const alternateUrl = url.href.replace(params.lang, alternateLang);
	const metaDescription =
		params.lang == 'fr-ca'
			? 'Parcourez les enregistrements GeoCore et trouvez les jeux de données les plus pertinents selon vos termes de recherche et filtres sélectionnés.'
			: 'Browse GeoCore records and find the most relevant datasets based on your search terms and selected filters.';

	return {
		lang: params.lang,
		results: sanitizedResults,
		userData: userData.Item,
		start: getMin(url.searchParams),
		end: getMin(url.searchParams) + sanitizedResults.length,
		analytics: analytics,
		searchMode: searchMode,
		totalHits: totalHits,
		canonicalUrl: canonicalUrl,
		alternateUrl: alternateUrl,
		alternateLang: alternateLang,
		metaDescription: metaDescription
	};
};

function generateUrl(fetch, searchParams, lang, token) {
	let url = new URL('https://geocore.api.geo.ca/geo');
	const params = mapSearchParams(searchParams, lang);
	// URLSearchParams automatically encodes special characters to the html counterpart.
	// However, the geocore get requests require the '+' to be unencoded, so
	// we can fix it with replaceAll(). Additionally, the ' character needs to be
	// replaced with '', so we can use replaceAll() a second time.
	url.search = new URLSearchParams(params)
		.toString()
		.replaceAll('%2B', '+')
		.replaceAll('%27', '%27%27');
	return fetch(url, {
		headers: { Authentication: 'Bearer ' + token }
	});
}

function generateSemanticUrl(fetch, searchParams, lang, token) {
	// Testing staging version of semantic search instead of the prod version.
	// Commenting out prod url out for now in case we decide to switch back.
	// todo: switch this to an environment variable.
	// let url = new URL(SEMANTIC_SEARCH_URL);
	let url = new URL('https://search-recherche.geocore.api.geo.ca/search-opensearch');
	// let url = new URL('https://search-recherche.geocore-stage.api.geo.ca/search-opensearch');

	const params = mapSemanticSearchResults(searchParams, lang);
	// URLSearchParams automatically encodes special characters to the html counterpart.
	// However, the geocore get requests require the '+' to be unencoded, so
	// we can fix it with replaceAll().
	url.search = new URLSearchParams(params).toString().replaceAll('%2B', '+');
	return fetch(url, {
		headers: { Authentication: 'Bearer ' + token }
	});
}

async function getAnalytics(fetch) {
	let analytics = await fetch('https://geocore.api.geo.ca/analytics/11');
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

function mapSearchParams(searchParams, lang) {
	let cKeys = concatKeys(searchParams);
	let ret = {
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
		begin: searchParams.get('begin') ? new Date(searchParams.get('begin')).toISOString() : '',
		end: searchParams.get('end') ? new Date(searchParams.get('end')).toISOString() : '',
		lang: lang.split('-')[0],
		min: getMin(searchParams),
		max: getMax(searchParams),
		sort: searchParams.get('sort')
	};
	return ret;
}

function mapSemanticSearchResults(searchParams, lang) {
	let west = searchParams.get('west') ?? -180;
	let north = searchParams.get('north') ?? 90;
	let east = searchParams.get('east') ?? 180;
	let south = searchParams.get('south') ?? -90;
	let bbox = searchParams.get('bbox') ? west + ',' + south + ',' + east + ',' + north : '';
	let searchTerms = searchParams.get('search-terms');
	let ret = {
		// Revisit which search method is better after user testing
		method: 'SemanticSearch', // 'HybridSearch',
		q: searchTerms ? searchTerms.replaceAll('"', '') : '',
		topicCategory: searchParams.get('category-of-interest') ?? '',
		bbox: bbox,
		relation: searchParams.get('relation') ?? 'intersects',
		begin: searchParams.get('begin') ? new Date(searchParams.get('begin')).toISOString() : '',
		end: searchParams.get('end') ? new Date(searchParams.get('end')).toISOString() : '',
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
		order: searchParams.get('sort') == 'title' ? 'asc' : 'desc',
		size: searchParams.get('results-per-page') ?? '10',
		from: getMin(searchParams)
	};
	return ret;
}

function getKeyword(searchParams) {
	const searchTerms = searchParams.get('search-terms');
	const category = searchParams.get('category-of-interest');
	let keywords = '';

	if (searchTerms && category) {
		keywords = searchTerms + '+' + category;
	} else if (searchTerms) {
		keywords = searchTerms;
	} else if (category) {
		keywords = category;
	}

	// Remove quotation characters, the semantic search throws an error if they are included
	keywords = keywords.replaceAll('"', '');

	return keywords;
}

function getMin(searchParams) {
	const pn = parseInt(searchParams.get('page-number')) || 0;
	const pc = parseInt(searchParams.get('results-per-page')) || 10;
	const ret = pn * pc;
	return ret;
}

function getMax(searchParams) {
	const pn = parseInt(searchParams.get('page-number')) || 0;
	const pc = parseInt(searchParams.get('results-per-page')) || 10;
	const ret = (pn + 1) * pc;
	if (pn > 0) {
		return ret - 1;
	}
	return ret;
}

function concatKeys(searchParams) {
	let ret = {
		org: '',
		type: '',
		theme: '',
		bbox: ''
	};

	searchParams.forEach((key, value) => {
		ret.org = conditionalConcat('organisations-', key, value, ret.org);
		ret.others = conditionalConcat('others-', key, value, ret.others);
		ret.theme = conditionalConcat('themes-', key, value, ret.theme);
		ret.type = conditionalConcat('types-', key, value, ret.type);
		ret.bbox = conditionalConcat('bbox-', key, value, ret.bbox);
	});
	return ret;
}

function conditionalConcat(prefix, key, value, ret) {
	if (value.startsWith(prefix) && key == 'on') {
		if (ret) ret += '|';
		let sv = value.slice(prefix.length);
		ret += sv;
	}
	return ret;
}

export const actions = {
	addToFavourites: addToFavourites,
	removeFromFavourites: removeFromFavourites
} satisfies Actions;

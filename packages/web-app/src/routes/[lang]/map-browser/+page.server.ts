import type { PageServerLoad } from './$types';
import { page } from '$app/stores';
import { addToMapCart, removeFromMapCart } from '$lib/actions.ts';
import { getUserData } from '$lib/db/user.ts';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result.ts';
import { sanitizeSemantic } from '$lib/utils/data-sanitization/semantic-results.ts';
import Organizations from '$lib/components/search-results/filters/organizations.svelte';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	let searchMode = params?.searchMethod == 'classic' ? 'classic' : 'semantic';
	let response;
	if (searchMode == 'classic') {
		response = await generateUrl(fetch, url.searchParams, params.lang, cookies.get('id_token'));
	} else {
		response = await generateSemanticUrl(fetch, url.searchParams, params.lang, cookies.get('id_token'));
	}
	let analytics = await getAnalytics(fetch);
	let parsedResponse = [];
	let userData = { Item: { mapCart: [] } };
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
		totalHits = parseInt(
			sanitizedResults?.[0]?.total ? sanitizedResults[0].total : 0);
	} else {
		totalHits = parsedResponse?.response?.total_hits ?? 0;
	}

	for (const result of sanitizedResults) {
		let lang = params.lang == 'fr-ca' ? 'fr' : 'en';
		let id = result.id;
		let url = 'https://geocore.api.geo.ca/vcs?lang=' + lang + '&id=' + id;
		try {
			let vcsResponse = await fetch(url);
			let vcs = await vcsResponse.json();
			let rcs = vcs.response.rcs[lang];
			let hasMap = rcs.length > 0;
			result.hasMap = hasMap;
		} catch (e) {
			console.warn('Unable to verify map for ' + result.id);
		}
	}

	try {
		userData = await getUserData(cookies);
	} catch (e) {
		console.warn(e);
	}
	return {
		lang: params.lang,
		results: sanitizedResults,
		userData: userData.Item,
		start: getMin(url.searchParams),
		end: getMin(url.searchParams) + sanitizedResults.length,
		analytics: analytics,
		searchMode: searchMode,
		totalHits: totalHits
	};
};

function generateUrl(fetch, searchParams, lang, token) {
	let url = new URL('https://geocore.api.geo.ca/geo');
	const params = mapSearchParams(searchParams, lang);
	// URLSearchParams automatically encodes special characters to the html counterpart.
	// However, the geocore get requests require the '+' to be unencoded, so
	// we can fix it with replaceAll(). Additionally, the ' character needs to be
	// replaced with '', so we can use replaceAll() a second time.
	url.search = new URLSearchParams(params).toString()
	  .replaceAll('%2B', '+').replaceAll('%27', '%27%27');
	return fetch(url, {
		headers: { Authentication: 'Bearer ' + token }
	});
}

function generateSemanticUrl(fetch, searchParams, lang, token) {
	// Testing staging version of semantic search instead of the prod version.
	// Commenting out prod url out for now in case we decide to switch back.
	// let url = new URL('https://search-recherche.geocore.api.geo.ca/search-opensearch');
	let url = new URL('https://search-recherche.geocore-stage.api.geo.ca/search-opensearch');

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
		begin: searchParams.get('begin')
			? new Date(searchParams.get('begin')).toISOString()
			: '',
		end: searchParams.get('end')
			? new Date(searchParams.get('end')).toISOString()
			: '',
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
	let bbox = searchParams.get('bbox') ?
	  west + "," + south + "," + east + "," + north : "";
	let ret = {
	    method: 'SemanticSearch',
	    q: getKeyword(searchParams),
	    bbox: bbox,
	    relation: searchParams.get('relation') ?? 'intersects',
	    begin: searchParams.get('begin')
			? new Date(searchParams.get('begin')).toISOString() : '',
	    end: searchParams.get('end')
			? new Date(searchParams.get('end')).toISOString() : '',
	    org: searchParams.get('org') ?? '',
	    type: searchParams.get('type') ?? '',
	    theme: searchParams.get('theme') ?? '',
	    foundational: searchParams.get('foundational') ? 'true' : '',
	    source_system: '',
	    eo_collection: '',
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
	addToMapCart: addToMapCart,
	removeFromMapCart: removeFromMapCart
} satisfies Actions;

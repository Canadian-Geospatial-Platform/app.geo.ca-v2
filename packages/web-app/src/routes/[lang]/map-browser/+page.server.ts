import type { PageServerLoad } from './$types';
import { page } from '$app/stores';
import { addToMapCart, removeFromMapCart } from '$lib/actions.ts';
import { getUserData } from '$lib/db/user.ts';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result.ts';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	let response = await generateUrl(fetch, url.searchParams, params.lang, cookies.get('id_token'));
	let parsedResponse = [];
	let userData = { Item: { mapCart: [] } };
	let sanitizedResults;
	try {
		parsedResponse = await response.json();
		sanitizedResults = sanitize(parsedResponse.Items, params.lang);
	} catch (e) {
		console.error(e);
	}

	try {
		userData = await getUserData(cookies);
	} catch (e) {
		console.warn(e);
	}

	console.log(sanitizedResults);

	return {
		lang: params.lang,
		results: sanitizedResults,
		userData: userData.Item
	};
};

function generateUrl(fetch, searchParams, lang, token) {
	let url = new URL('https://geocore.api.geo.ca/geo');
	const params = mapSearchParams(searchParams, lang);
	url.search = new URLSearchParams(params).toString();
	return fetch(url, {
		headers: { Authentication: 'Bearer ' + token }
	});
}

function mapSearchParams(searchParams, lang) {
	let cKeys = concatKeys(searchParams);
	let ret = {
		north: 72.04683989379397,
		east: 44.6484375,
		south: 41.244772343082076,
		west: -180,
		keyword: searchParams.get('search-terms'),
		org: cKeys.org,
		type: cKeys.type,
		theme: cKeys.theme,
		bbox: cKeys.bbox,
		foundational: searchParams.get('others-foundational') === 'on' ? 'true' : '',
		begin: searchParams.get('spatio-temporal-start')
			? new Date(searchParams.get('spatio-temporal-start')).toISOString()
			: '',
		end: searchParams.get('spatio-temporal-end')
			? new Date(searchParams.get('spatio-temporal-end')).toISOString()
			: '',
		lang: lang.split('-')[0],
		min: getMin(searchParams),
		max: getMax(searchParams),
		sort: searchParams.get('sort')
	};
	return ret;
}

function getMin(searchParams) {
	const pn = searchParams.get('page-number') || 0;
	const pc = searchParams.get('results-per-page') || 10;
	const ret = pn * pc;
	return ret;
}

function getMax(searchParams) {
	const pn = searchParams.get('page-number') || 0;
	const pc = searchParams.get('results-per-page') || 10;
	const ret = pn * pc + (pc - 1);
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

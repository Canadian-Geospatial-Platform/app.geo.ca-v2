export const load = async ({ fetch, params, url }) => {
	let response = await generateUrl(fetch, url.searchParams, params.lang);
	let parsedResponse = response.json();
	return {
		lang: params.lang,
		results: parsedResponse
	};
};

function generateUrl(fetch, searchParams, lang) {
	let url = new URL('https://geocore.api.geo.ca/geo');
	const params = mapSearchParams(searchParams, lang);
	url.search = new URLSearchParams(params).toString();
	return fetch(url);
}

function mapSearchParams(searchParams, lang) {
	let cKeys = concatKeys(searchParams);
	return {
		north: 69.8698915662856,
		east: 44.6484375,
		south: 46.01222384063236,
		west: -180,
		keyword: searchParams.get('search-terms'),
		org: cKeys.org,
		others: cKeys.others,
		type: cKeys.type,
		theme: cKeys.theme,
		bbox: cKeys.bbox,
		lang: lang.split('-')[0],
		min: 1,
		max: 10,
		sort: 'title'
	};
}

function concatKeys(searchParams) {
	let ret = {
		others: '',
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

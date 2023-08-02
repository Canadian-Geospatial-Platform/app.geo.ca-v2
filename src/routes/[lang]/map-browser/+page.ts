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
	console.log(searchParams.get('others-foundational'));
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
		begin: searchParams.get('spatio-temporal-start')? new Date(searchParams.get('spatio-temporal-start')).toISOString():'',
		end: searchParams.get('spatio-temporal-end')? new Date(searchParams.get('spatio-temporal-end')).toISOString():'',
		lang: lang.split('-')[0],
		min: 1,
		max: 10,
		sort: 'title'
	};
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

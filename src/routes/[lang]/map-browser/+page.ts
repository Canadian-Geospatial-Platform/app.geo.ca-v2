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
	return {
		north: 69.8698915662856,
		east: 44.6484375,
		south: 46.01222384063236,
		west: -180,
		keyword: searchParams.get('search-terms'),
		org: mapOrganisations(searchParams),
		lang: lang.split('-')[0],
		min: 1,
		max: 10,
		sort: 'title'
	};
}

function mapOrganisations(searchParams) {
	let ret = '';
	searchParams.forEach((key, value) => {
		let prefix = 'organisations-';
		if (value.startsWith(prefix) && key == 'on') {
			if (ret) ret += '|';
			let sv = value.slice(14);
			ret += sv;
		}
	});
	return ret;
}

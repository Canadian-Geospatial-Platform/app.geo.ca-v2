export const load = async ({ fetch, params, url }) => {
	const response = await generateUrl(url.searchParams, params.lang.split('-')[0]);
	return {
		lang: params.lang,
		results: await response.json()
	};
};

function generateUrl(searchParams, lang) {
	console.log(searchParams);
	let url = new URL('https://geocore.api.geo.ca/geo');
	const params = {
		north: 69.8698915662856,
		east: 44.6484375,
		south: 46.01222384063236,
		west: -180,
		keyword: searchParams.get('search-terms'),
		lang: lang,
		min: 1,
		max: 10,
		sort: 'title'
	};
	url.search = new URLSearchParams(params).toString();
	console.log(url);
	return fetch(url);
}

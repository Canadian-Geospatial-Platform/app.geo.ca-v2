import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, url }) => {
	let response = await getRecord(url.searchParams.get('id'), params.lang, fetch);
	let parsedResponse;
	try {
		parsedResponse = await response.json();
	} catch (e) {
		console.error(e);
		console.log(e);
	}
	console.log(parsedResponse.body);
	return {
		lang: params.lang,
		t_title: params.lang == 'en-ca' ? 'Favorites' : 'Favoris',
		results: parsedResponse.body
	};
};

function getRecord(id, lang, fetch) {
	let url = new URL('https://geocore.api.geo.ca/id');
	const params = {
		id: id,
		lang: lang.split('-')[0]
	};
	url.search = new URLSearchParams(params).toString();
	return fetch(url);
}

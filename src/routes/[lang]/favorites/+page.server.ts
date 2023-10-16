import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params, url }) => {
	let response = [];
	try {
		response = await getRecords(url.searchParams.values('id'), params.lang, fetch);
	} catch (e) {
		console.error('error fetching records: \n', e);
	}

	let x = await response;
	x = normaliseData(params.lang, x);
	return {
		lang: params.lang,
		t_title: params.lang == 'en-ca' ? 'Favorites' : 'Favoris',
		results: []
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

async function getRecords(idIterator, lang, fetch) {
	let promises = [];

	for (const id of idIterator) {
		promises.push(getRecord(id, lang, fetch));
	}

	const results = await Promise.all(promises);
	const values = [...results];

	let ret = await Promise.all(
		values.map(async (v) => {
			const contents = await v.json();
			return contents.body.Items[0];
		})
	);
	return ret;
}

function normaliseData(lang, records) {
	for (const r of records) {
		r.title = r['title_' + lang.split('-')[0]];
		r.description = r['title_' + lang.split('-')[0]];
	}
	return records;
}

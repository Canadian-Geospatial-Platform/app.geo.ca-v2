import type { PageServerLoad } from './$types';
import { getUserData } from '$lib/utils/user-db.ts';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	let response = [];
	let userData = { Item: { mapCart: [] } };
	try {
		userData = await getUserData(cookies);
	} catch (e) {
		console.error('error fetching records: \n', e);
	}
	try {
		response = await getRecords(userData.Item.mapCart, params.lang, fetch);
	} catch (e) {
		console.error('error fetching records: \n', e);
	}

	let x = await response;
	try {
		x = normaliseData(params.lang, x);
	} catch (e) {
		console.error('error fetching records: \n', e);
		x = [];
	}
	return {
		lang: params.lang,
		t_title: params.lang == 'en-ca' ? 'Favorites' : 'Favoris',
		results: x,
		userData: userData.Item
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
			try {
				const contents = await v.json();
				if (contents.Items[0]) return contents.Items[0];
			} catch {
				(error) => console.log(error);
			}
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

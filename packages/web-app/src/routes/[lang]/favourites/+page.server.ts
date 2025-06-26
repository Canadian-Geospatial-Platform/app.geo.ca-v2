import type { PageServerLoad } from './$types';
import { getUserData } from '$lib/db/user.ts';
import { removeFromFavourites } from '$lib/actions.ts';
import { sanitize } from '$lib/utils/data-sanitization/geocore-result.ts';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	let response = [];
	let userData;
	let sanitizedResults;

	const canonicalUrl = url.origin + '/' + params.lang + '/favourites';
	const alternateLang = params.lang == 'fr-ca' ? 'en-ca' : 'fr-ca';
	const alternateUrl = url.href.replace(params.lang, alternateLang);
	const metaDescription = params.lang == 'fr-ca' ?
	  'Consultez vos ressources sauvegardées et créez une carte personnalisée.' :
	  'Browse your saved resources and create a custom map.';

	try {
		userData = await getUserData(cookies);
	} catch (e) {
		console.error('error fetching user data in records: \n', e);
	}

	try {
		response = await getRecords(userData.Item.favourites, params.lang, fetch);
	} catch (e) {
		console.error('error fetching records: \n', e);
	}

	let results = [];
	try {
		results = await response;
		sanitizedResults = sanitize(results, params.lang);
	} catch (e) {
		console.error('error fetching records: \n', e);
		results = [];
	}

	return {
		lang: params.lang,
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.origin + '/' + params.lang + '/map-browser'
		},
		t_title_2: {
			text: params.lang == 'en-ca' ? 'Favourites' : 'Mon Panier',
			href: url.href
		},
		results: sanitizedResults,
		userData: userData.Item,
		canonicalUrl: canonicalUrl,
		alternateUrl: alternateUrl,
		alternateLang: alternateLang,
		metaDescription: metaDescription,
	};
};

function getRecord(id, lang, fetch) {
	const url = new URL('https://geocore.api.geo.ca/id');
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

export const actions = {
	removeFromFavourites: removeFromFavourites
} satisfies Actions;

import type { PageServerLoad } from './$types';
import { getRecord } from '$lib/db/record.ts';

const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	const lang = params.lang === 'en-ca' ? 'en' : 'fr';

	let record;
	let features;
	let properties;
	try {
		record = await getRecord(params.uuid);
		features = record?.features[0];
		properties = features?.properties;
	} catch (e) {
		console.warn('error fetching record for microdata:\n', e);
	}

	return {
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.origin + '/' + params.lang + '/map-browser'
		},
		t_title_2: {
			text: params.lang == 'en-ca' ? 'Metadata' : 'Métadonnées',
			href: url.origin + '/' + params.lang + '/map-browser/record/' + params.uuid
		},
		t_title_3: {
			text: properties.title,
			href: url.href
		},
		lang: params.lang,
		uuid: params.uuid,
		coordinates: features.geometry.coordinates
	};
};

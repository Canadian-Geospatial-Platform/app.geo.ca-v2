import type { PageServerLoad } from './$types';
import { Config } from 'sst/node/config';
import { getRecord } from '$lib/db/record.ts';
import enLabels from '$lib/components/record/i18n/en.json';
import frLabels from '$lib/components/record/i18n/fr.json';

const GEOCORE_API_DOMAIN = Config.GEOCORE_API_DOMAIN;

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

	let t = params.lang == 'en-ca' ? enLabels : frLabels;
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
			text: lang == 'en-ca' ? properties.title.en : properties.title.fr,
			href: url.href
		},
		lang: params.lang,
		uuid: params.uuid,
		coordinates: features.geometry.coordinates
	};
};

import type { PageServerLoad } from './$types';
import { getRecord } from '$lib/db/record.ts';
import enLabels from '$lib/components/record/i18n/en/translations.json';
import frLabels from '$lib/components/record/i18n/fr/translations.json';
import { error } from '@sveltejs/kit';
import { parseText } from '$lib/utils/parse-text.ts';

const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	const lang = params.lang === 'en-ca' ? 'en' : 'fr';

	let record;
	try {
		record = await getRecord(params.uuid);
	} catch (e) {
		console.warn('error fetching record ' + params.uuid + ' for microdata:\n', e);
		// If the record doesn't exist, throw an error so that the page is routed to +error.svelte
		throw error(404, 'Record ' + params.uuid + ' not found');
	}

	// @ts-ignore
	const fetchRelated = async (id) => {
		try {
			const collectionsResponse = await fetch(`https://geocore.api.geo.ca/id/v2?id=${id}&lang=${lang}`);
			const parsedCollectionsResponse = await collectionsResponse.json();
			const related = parsedCollectionsResponse?.body?.Items?.[0]?.similarity ?? [];
			return related;
		} catch (e) {
			console.error('Error fetching related items:', e);
			return []; // Return empty array if fetch fails
		}
	};

	const fetchAnalytics = async (id, lang) => {
		let parsedAnalyticResponse;
		try {
			const analyticResponse = await fetch(
				`https://geocore.api.geo.ca/analytics/10?uuid=${id}&lang=${lang}`
			);
			parsedAnalyticResponse = JSON.parse(await analyticResponse.json());
		} catch (e) {
			console.error(
				'error fetching analytics from:',
				`https://geocore.api.geo.ca/analytics/10?uuid=${id}&lang=${lang}\nerror message:`,
				e
			);
		}
		return parsedAnalyticResponse;
	};

	let t = params.lang == 'en-ca' ? enLabels : frLabels;

    const analyticRes = await fetchAnalytics(params.uuid, lang);
    const related = await fetchRelated(params.uuid);

    let item_v2 = record?.features[0];

    if (item_v2?.properties.description) {
        item_v2.properties.description.en = parseText(item_v2.properties.description.en);
        item_v2.properties.description.fr = parseText(item_v2.properties.description.fr);
    }

    // For the english version of the role, the value 'pointOfContact' is really common.
    // We can replace it with the more readable 'point of contact'.
    if (item_v2?.properties?.contact?.[0]?.role?.en) {
        item_v2.properties.contact[0].role.en =
            item_v2.properties.contact[0].role.en.replace('pointOfContact', 'point of contact');
    }

    const canonicalUrl = url.origin + '/' + lang + '/map-browser/record/' + params.uuid;
	const alternateLang = params.lang == 'fr-ca' ? 'en-ca' : 'fr-ca';
	const alternateUrl = url.href.replace(lang, alternateLang);
	const metaDescription = params.lang == 'fr-ca' ?
	  "La page de métadonnées et la carte de l'enregistrement GeoCore " +  params.uuid :
	  "The metadata page and map for the GeoCore record " +  params.uuid;

	return {
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.origin + '/' + params.lang + '/map-browser'
		},
		t_title_2: {
			text: params.lang == 'en-ca' ? 'Metadata' : 'Métadonnées',
			href: url.href
		},
		lang: params.lang,
		uuid: params.uuid,
		test: 'test',
		related: related,
		analyticRes: analyticRes,
		t: t,
		item_v2: item_v2,
		canonicalUrl: canonicalUrl,
		alternateUrl: alternateUrl,
		alternateLang: alternateLang,
		metaDescription: metaDescription,
	};
};

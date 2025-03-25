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
		console.warn('error fetching record for microdata:\n', e);
		// If the record doesn't exist, throw an error so that the page is routed to +error.svelte
		throw error(404, 'Record not found');
	}

	// @ts-ignore
	const fetchRelated = async (id) => {
		try {
			const collectionsResponse = await fetch(`${GEOCORE_API_DOMAIN}/collections?id=${id}`);
			const parsedCollectionsResponse = await collectionsResponse.json();
			const related = [];
			if (parsedCollectionsResponse.parent) {
				related.push({ ...parsedCollectionsResponse.parent, ...{ type: 'parent' } });
			}
			if (parsedCollectionsResponse.sibling_count > 0) {
				parsedCollectionsResponse.sibling.forEach((s) => {
					related.push({ ...s, ...{ type: 'member' } });
				});
			}
			if (parsedCollectionsResponse.child_count > 0) {
				parsedCollectionsResponse.child.forEach((s) => {
					related.push({ ...s, ...{ type: 'member' } });
				});
			}
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
				`${GEOCORE_API_DOMAIN}/analytics/10?uuid=${id}&lang=${lang}`
			);
			parsedAnalyticResponse = JSON.parse(await analyticResponse.json());
		} catch (e) {
			console.error(
				'error fetching analytics from:',
				`${GEOCORE_API_DOMAIN}/analytics/10?uuid=${id}&lang=${lang}\nerror message:`,
				e
			);
		}
		return parsedAnalyticResponse;
	};

	let t = params.lang == 'en-ca' ? enLabels : frLabels;

    const analyticRes = await fetchAnalytics(params.uuid, lang);
    const related = await fetchRelated(params.uuid);

    let item_v2 = record?.features[0];

    if (item_v2.properties.description) {
        item_v2.properties.description.en = parseText(item_v2.properties.description.en);
        item_v2.properties.description.fr = parseText(item_v2.properties.description.fr);
    }

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
		item_v2: item_v2
	};
};

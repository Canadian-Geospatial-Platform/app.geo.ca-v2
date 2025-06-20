import type { PageServerLoad } from './$types';
import { getRecord } from '$lib/db/record.ts';
import enLabels from '$lib/components/record/i18n/en/translations.json';
import frLabels from '$lib/components/record/i18n/fr/translations.json';
import { error } from '@sveltejs/kit';
import { parseText } from '$lib/utils/parse-text.ts';
import { formatNumber } from '$lib/utils/format-number.ts';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
    // The "sst/node/config" package dynamically binds resources at runtime.
    // Importing it at the top level would cause build-time errors because SST resources
    // are not available during the build process. To avoid this, we import it inside
    // the `load()` function so it's only accessed when the server is running.
    const config = await import("sst/node/config");
	const GEOCORE_API_DOMAIN = config.Config.GEOCORE_API_DOMAIN;

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
	const fetchSimilar = async (id) => {
		try {
			const collectionsResponse = await fetch(`${GEOCORE_API_DOMAIN}/id/v2?id=${id}&lang=${lang}`);
			const parsedCollectionsResponse = await collectionsResponse.json();
			const similar = parsedCollectionsResponse?.body?.Items?.[0]?.similarity ?? [];
			return similar;
		} catch (e) {
			console.error('Error fetching similar items:', e);
			return []; // Return empty array if fetch fails
		}
	};
	
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

    if (analyticRes['30']) {
		analyticRes['30'] = formatNumber(analyticRes['30']);
    }

    if (analyticRes.all) {
		analyticRes.all = formatNumber(analyticRes.all);
    }

    const similar = await fetchSimilar(params.uuid);
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

    const canonicalUrl = url.origin + '/' + params.lang + '/map-browser/record/' + params.uuid;
	const alternateLang = params.lang == 'fr-ca' ? 'en-ca' : 'fr-ca';
	const alternateUrl = url.href.replace(params.lang, alternateLang);
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
		similar: similar,
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

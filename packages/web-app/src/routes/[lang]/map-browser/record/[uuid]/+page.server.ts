import type { PageServerLoad } from './$types';
import { Config } from 'sst/node/config';
import { getRecord } from '$lib/db/record.ts';
import enLabels from '$lib/components/record/i18n/en.json';
import frLabels from '$lib/components/record/i18n/fr.json';

const GEOCORE_API_DOMAIN = Config.GEOCORE_API_DOMAIN;

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	const lang = params.lang === 'en-ca' ? 'en' : 'fr';

	let record;
	try {
		record = await getRecord(params.uuid);
	} catch (e) {
		console.warn('error fetching record for microdata:\n', e);
	}

	// @ts-ignore
	const fetchResult = async (id, lang) => {
		const idResponse = await fetch(`${GEOCORE_API_DOMAIN}/id/v2?id=${id}&lang=${lang}`);
		const parsedIDResponse = await idResponse.json();
		return parsedIDResponse;
	};
	const fetchRelated = async (id) => {
		const collectionsResponse = await fetch(`${GEOCORE_API_DOMAIN}/collections?id=${id}`);
		const parsedCollectionsResponse = await collectionsResponse.json();
		const related = [];
		if (parsedCollectionsResponse.parent !== null) {
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
	};
	const fetchAnalytics = async (id, lang) => {
		const analyticResponse = await fetch(
			`${GEOCORE_API_DOMAIN}/analytics/10?uuid=${id}&lang=${lang}`
		);

		let parsedAnalyticResponse;
		try {
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
	return {
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.origin + '/' + params.lang + '/map-browser'
		},
		t_title_2: {
			text: params.lang == 'en-ca' ? 'metadata' : 'métadonnées',
			href: url.href
		},
		lang: params.lang,
		uuid: params.uuid,
		test: 'test',
		result: fetchResult(params.uuid, lang),
		related: fetchRelated(params.uuid),
		analyticRes: fetchAnalytics(params.uuid, lang),
		t: t,
		item_v2: record?.features[0]
	};
};

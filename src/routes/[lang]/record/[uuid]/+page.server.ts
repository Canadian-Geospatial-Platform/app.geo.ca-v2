import type { PageServerLoad } from './$types';
import enLabels from '$lib/components/record/i18n/en.json';
import frLabels from '$lib/components/record/i18n/fr.json';

export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
	console.log('loading data in server...');
	const lang = params.lang === 'en-ca' ? 'en' : 'fr';

	// @ts-ignore
	const fetchResult = async (id, lang) => {
		const idResponse = await fetch(`https://geocore.api.geo.ca/id/v2?id=${id}&lang=${lang}`);
		const parsedIDResponse = await idResponse.json();
		return parsedIDResponse;
	};
	const fetchRelated = async (id) => {
		const collectionsResponse = await fetch(`https://geocore.api.geo.ca/collections?id=${id}`);
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
			`https://geocore.api.geo.ca/analytics/10?uuid=${id}&lang=${lang}`
		);
		const parsedAnalyticResponse = JSON.parse(await analyticResponse.json());
		return parsedAnalyticResponse;
	};
	let t = params.lang == 'en-ca' ? enLabels : frLabels;
	console.log('h is', t.nav.home);
	return {
		t_title: params.lang == 'en-ca' ? 'metadata' : 'métadonnées',
		lang: params.lang,
		uuid: params.uuid,
		test: 'test',
		result: fetchResult(params.uuid, lang),
		related: fetchRelated(params.uuid),
		analyticRes: fetchAnalytics(params.uuid, lang),
		t: t
	};
};

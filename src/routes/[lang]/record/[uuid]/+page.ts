export const load = async ({ params }) => {
	const lang = params.lang === 'en-ca' ? 'en' : 'fr';

	const [idResponse, collectionsResponse, analyticResponse] =
		await Promise.all([fetch(`https://geocore.api.geo.ca/id/v2?id=${params.uuid}&lang=${lang}`),
		fetch(`https://geocore.api.geo.ca/collections?id=${params.uuid}`),
		fetch(`https://geocore.api.geo.ca/analytics/10?uuid=${params.uuid}&lang=${lang}`),]);
	if (!idResponse.ok) {
		throw new Error(`HTTP error: ${idResponse.status}`)
	}

	if (!collectionsResponse.ok) {
		throw new Error(`HTTP error: ${collectionsResponse.status}`)
	}

	const parsedIDResponse = await idResponse.json()
	const parsedCollectionsResponse = await collectionsResponse.json()
	const parsedAnalyticResponse = await analyticResponse.json()
	// @ts-ignore
	const related = [];
	if (parsedCollectionsResponse.parent !== null) {
		related.push({ ...parsedCollectionsResponse.parent, ...{ 'type': 'parent' } });
	};
	if (parsedCollectionsResponse.sibling_count > 0) {
		parsedCollectionsResponse.sibling.forEach(s => {
			related.push({ ...s, ...{ 'type': 'member' } });
		});
	}
	if (parsedCollectionsResponse.child_count > 0) {
		parsedCollectionsResponse.child.forEach(s => {
			related.push({ ...s, ...{ 'type': 'member' } });
		});
	}

	return {
		t_title:
			params.lang == 'en-ca' ? 'metadata' : 'métadonnées',
		lang: params.lang,
		uuid: params.uuid,
		result: parsedIDResponse,
		related,
		analyticRes: parsedAnalyticResponse
	};
};

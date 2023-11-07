import type { PageServerLoad } from "../../../$types";

export const load:PageServerLoad = async ({ fetch, params, url, cookies }) => {
	console.log("loading data in server...", import.meta.env.MODE, import.meta.env.SSR);	
	const lang = params.lang === 'en-ca' ? 'en' : 'fr';
	const APP_API_DOMAIN_URL=import.meta.env.VITE_APP_API_DOMAIN_URL;
	
	// @ts-ignore
	const fetchResult=async (id, lang)=>{
		const idResponse= await fetch(`${APP_API_DOMAIN_URL}/id/v2?id=${id}&lang=${lang}`);
		const parsedIDResponse = await idResponse.json();
		return parsedIDResponse;
	}
	const fetchRelated=async (id)=>{
		const collectionsResponse = await fetch(`${APP_API_DOMAIN_URL}/collections?id=${id}`);
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
	}
	const fetchAnalytics=async (id, lang)=>{	
		const analyticResponse=await fetch(`${APP_API_DOMAIN_URL}/analytics/10?uuid=${id}&lang=${lang}`);	
		const parsedAnalyticResponse = JSON.parse(await analyticResponse.json());
		return parsedAnalyticResponse;
	}
	
	return {
		t_title: params.lang == 'en-ca' ? 'metadata' : 'métadonnées',
		lang: params.lang,
		uuid: params.uuid,
		result: fetchResult(params.uuid, lang),
		related: fetchRelated(params.uuid),
		analyticRes: fetchAnalytics(params.uuid, lang)
	};
};
import type { PageServerLoad } from './$types';
import { getRecord } from '$lib/db/record.ts';

export const load: PageServerLoad = async ({ params }) => {
	let record;
	try {
		record = await getRecord(params.uuid);
	} catch (e) {
		console.warn('error fetching record for microdata:\n', e);
	}
	return {
		uuid: params.uuid,
		lang: params.lang,
		item_v2: record?.features[0],
		t_title: record?.features[0].properties.title[params.lang.split('-').shift()]
	};
};

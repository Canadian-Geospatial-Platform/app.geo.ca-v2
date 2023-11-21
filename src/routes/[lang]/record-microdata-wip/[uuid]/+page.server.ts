import type { PageServerLoad } from './$types';
import item from '$lib/components/microdata/sample-item.json';
import { getRecord } from '$lib/io/record.ts';
import { Table } from 'sst/node/table';
import { Bucket } from 'sst/node/bucket';

export const load: PageServerLoad = async ({ params }) => {
	let record = await getRecord(params.uuid);
	return {
		uuid: params.uuid,
		lang: params.lang,
		item_v2: record.features[0],
		t_title: record.features[0].properties.title[params.lang.split('-').shift()]
	};
};

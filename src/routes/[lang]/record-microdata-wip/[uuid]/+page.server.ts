import type { PageServerLoad } from './$types';
import item from '$lib/components/microdata/sample-item.json';
// import { getRecord } from './get-record.ts';
import { Table } from 'sst/node/table';
import { Bucket } from 'sst/node/bucket';

export const load: PageServerLoad = async ({ fetch, params }) => {
	// let record = await getRecord(params.uuid)
	console.log(
		'True Project. The bucket object should contain information on the bound bucket. instead it is an empty object: \n',
		Bucket
	);
	return {
		uuid: params.uuid,
		lang: params.lang,
		item: filterFieldsByLanguage(item, params.lang.split('-').shift()),
		t_title: item.features[0].properties.title[params.lang.split('-').shift()]
	};
};

function filterFieldsByLanguage(item, lang: String) {
	let ret = item.features[0];
	return ret;
}

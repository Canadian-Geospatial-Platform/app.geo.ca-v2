import type { PageServerLoad } from './$types';
import item from '$lib/components/microdata/sample-item.json';

export const load: PageServerLoad = async ({ fetch, params }) => {
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

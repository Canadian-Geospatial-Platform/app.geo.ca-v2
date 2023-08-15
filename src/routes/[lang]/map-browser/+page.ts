import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, data }) => {
	return {
		results: data.results,
		lang: params.lang,
		t_title:
			params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales'
	};
};

function translations(lang) {
	return {
		title: lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales'
	};
}

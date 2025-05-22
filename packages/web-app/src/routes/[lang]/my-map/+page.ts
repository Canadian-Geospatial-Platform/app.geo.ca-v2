import type { PageLoad } from './$types';
import enLabels from '$lib/components/mymap/i18n/en/translations.json';
import frLabels from '$lib/components/mymap/i18n/fr/translations.json';

export const load: PageLoad = ({ params, data, url }) => {
	let lang = params.lang;
	let t = lang == 'fr-ca' ? frLabels : enLabels;

	return {
		lang: lang,
		t: t,
		t_title_1: data.t_title_1,
		t_title_2: data.t_title_2,
		results: data.results,
		userData: data.userData,
		canonicalUrl: data.canonicalUrl,
		alternateUrl: data.alternateUrl,
		alternateLang: data.alternateLang,
		metaDescription: data.metaDescription,
	};
};

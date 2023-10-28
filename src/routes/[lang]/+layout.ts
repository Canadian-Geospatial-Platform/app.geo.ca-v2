import type { LayoutLoad } from './$types';
import {locale} from '$lib/components/i18n/i18n';

export const load: LayoutLoad = async ({ params }) => {
	//console.log('layout',params.lang);
	if(params.lang!=='en-ca'){
		locale.set('fr');		
	}else{
		locale.set('en');
	}
	
	return {
		lang: params.lang
	};
};

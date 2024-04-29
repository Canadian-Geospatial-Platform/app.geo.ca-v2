import type { LayoutServerLoad } from './$types';
import { Config } from 'sst/node/config';
import enFooterLabels from '$lib/components/footer/i18n/en.json';
import frFooterLabels from '$lib/components/footer/i18n/fr.json';

export const load: LayoutServerLoad = async ({ cookies, params }) => {
	return {
		lang: params.lang,
		FEATURE_SIGN_IN: Config.FEATURE_SIGN_IN === 'true' ? true : false,
		signedIn: cookies.get('id_token') ? true : false,
		i18nFooterLabels: params.lang == 'en-ca' ? enFooterLabels : frFooterLabels
	};
};

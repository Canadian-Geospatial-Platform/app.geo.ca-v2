import type { LayoutServerLoad } from './$types';
import { Config } from 'sst/node/config';

export const load: LayoutServerLoad = async ({ cookies, params }) => {
	return {
		lang: params.lang,
		FEATURE_SIGN_IN: Config.FEATURE_SIGN_IN === 'true' ? true : false,
		signedIn: cookies.get('id_token') ? true : false
	};
};

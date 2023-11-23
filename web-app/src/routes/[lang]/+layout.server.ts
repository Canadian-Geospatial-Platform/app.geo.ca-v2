import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, params }) => {
	return {
		lang: params.lang,
		signedIn: cookies.get('id_token') ? true : false
	};
};

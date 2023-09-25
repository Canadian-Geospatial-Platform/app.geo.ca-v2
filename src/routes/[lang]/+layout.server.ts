import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, params }) => {
	return {
		lang: params.lang,
		jwt: cookies.get('token')
	};
};

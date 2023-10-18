import type { LayoutServerLoad } from './$types';
import { getUserData } from '$lib/utils/user-db.ts';

export const load: LayoutServerLoad = async ({ cookies, params }) => {
	let userData = await getUserData(cookies);
	return {
		lang: params.lang,
		jwt: cookies.get('id_token'),
		userData: userData.Item
	};
};

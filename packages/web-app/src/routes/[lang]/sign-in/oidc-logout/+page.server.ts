import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

const CLIENT_ID = process.env.OIDC_CLIENT_ID;
const CUSTOM_DOMAIN = process.env.OIDC_CUSTOM_DOMAIN;

export const load: PageServerLoad = ({ url, cookies, params, fetch }) => {
	throw redirect(
		303,
		CUSTOM_DOMAIN +
			'/logout?client_id=' +
			CLIENT_ID +
			'&logout_uri=' +
			url.origin +
			'/' +
			params.lang +
			'/sign-in/logout'
	);
};

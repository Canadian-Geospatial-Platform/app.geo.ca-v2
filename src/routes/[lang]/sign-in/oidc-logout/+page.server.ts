import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { Config } from 'sst/node/config';

const CLIENT_ID = Config.OIDC_CLIENT_ID;
const CUSTOM_DOMAIN = Config.OIDC_CUSTOM_DOMAIN;

export const load: PageServerLoad = ({ url, cookies, params, fetch }) => {console.log(url)
	throw redirect(303, CUSTOM_DOMAIN + '/logout?client_id=' + CLIENT_ID + '&logout_uri=' + url.origin + '/' + params.lang + '/sign-in/logout');
};

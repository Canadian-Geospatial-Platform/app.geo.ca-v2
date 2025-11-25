import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';
import { Config } from 'sst/node/config';
import { exchangeCode } from '$lib/utils/sign-in';

const CLIENT_ID = process.env.OIDC_CLIENT_ID;
const CUSTOM_DOMAIN = process.env.OIDC_CUSTOM_DOMAIN;
const CLIENT_SECRET = Config.OIDC_CLIENT_SECRET;

export const load: PageServerLoad = async ({ cookies, url }) => {
	let jwt = null;
	let res = await exchangeCode(url, cookies);
	if (res.ok) {
		throw redirect(303, res.value || '/');
	} else {
		console.warn('error fetching and setting jwt');
	}
};

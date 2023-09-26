import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';

const CLIENT_ID = env.VITE_CLIENT_ID;
const CUSTOM_DOMAIN = env.VITE_CUSTOM_DOMAIN;

export const load: PageServerLoad = async ({ params, url }) => {
	const authUrl = CUSTOM_DOMAIN + '/oauth2/authorize?';
	const data = {
		client_id: CLIENT_ID,
		response_type: 'code',
		scope: 'openid',
		redirect_uri: url.origin + '/en-ca/sign-in/receive',
		state: url.searchParams.get('state') ?? url.origin + '/'
	};
	throw redirect(303, authUrl + urlEncode(data));
};

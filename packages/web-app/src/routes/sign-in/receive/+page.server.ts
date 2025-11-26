import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';
import { Config } from 'sst/node/config';
import { exchangeCode } from '$lib/utils/sign-in';

let GEOCORE_API_DOMAIN: string;
let SEMANTIC_SEARCH_URL: string;
let CLIENT_ID: string;
try {
	console.log('Reading values from sst/config/node.');
	GEOCORE_API_DOMAIN = Config.VITE_GEOCORE_API_DOMAIN;
	SEMANTIC_SEARCH_URL = Config.VITE_SEMANTIC_SEARCH_URL;
	CLIENT_ID = Config.VITE_CLIENT_ID;
} catch (e) {
	console.warn(
		'Error using values from sst/config/node, assuming the project is running locally and reading from .env.\n If this is not the case please ensure correct configuration of environment variables.'
	);
	GEOCORE_API_DOMAIN = import.meta.env.VITE_GEOCORE_API_DOMAIN;
	SEMANTIC_SEARCH_URL = import.meta.env.VITE_SEMANTIC_SEARCH_URL;
	CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
}

export const load: PageServerLoad = async ({ cookies, url }) => {
	let jwt = null;
	let res = await exchangeCode(url, cookies);
	if (res.ok) {
		throw redirect(303, res.value || '/');
	} else {
		console.warn('error fetching and setting jwt');
	}
};

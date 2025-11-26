import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';
import { Config } from 'sst/node/config';
import { exchangeCode } from '$lib/utils/sign-in';
import { getGeocoreApiDomain, getSemanticSearchUrl } from '$lib/utils/environment-variables.ts';

const GEOCORE_API_DOMAIN = getGeocoreApiDomain();
const SEMANTIC_SEARCH_URL = getSemanticSearchUrl();

export const load: PageServerLoad = async ({ cookies, url }) => {
	let jwt = null;
	let res = await exchangeCode(url, cookies);
	if (res.ok) {
		throw redirect(303, res.value || '/');
	} else {
		console.warn('error fetching and setting jwt');
	}
};

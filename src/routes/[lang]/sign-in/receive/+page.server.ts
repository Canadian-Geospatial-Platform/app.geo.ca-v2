import type { PageServerLoad } from './$types';
import { Config } from 'sst/node/config';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';

const CLIENT_ID = Config.OIDC_CLIENT_ID;
const CUSTOM_DOMAIN = Config.OIDC_CUSTOM_DOMAIN;
const CLIENT_SECRET = Config.OIDC_CLIENT_SECRET;

export const load: PageServerLoad = async ({ cookies, params, url, fetch }) => {
	let jwt = null;
	cookies.set('test', 'test cookie set', { path: '/' });
	try {
		jwt = await getJWT(url.searchParams.get('code'), url.origin + url.pathname, fetch);
		cookies.set('id_token', jwt.id_token, { path: '/' });
		cookies.set('access_token', jwt.access_token, { path: '/' });
		cookies.set('refresh_token', jwt.refresh_token, { path: '/' });
	} catch (error) {
		console.warn('error fetching and setting jwt', error);
	}

	throw redirect(303, url.searchParams.get('state'));
};

// todo: error handling
const getJWT = async function (code: String, signInPageUrl: String, fetch) {
	console.log('starting get jwt');
	var myHeaders = new Headers();
	myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

	var urlencoded = new URLSearchParams();
	urlencoded.append('grant_type', 'authorization_code');
	urlencoded.append('code', code);
	urlencoded.append('redirect_uri', signInPageUrl);
	urlencoded.append('client_id', CLIENT_ID);
	urlencoded.append('client_secret', CLIENT_SECRET);
	console.log('urlencodedis:\n', urlencoded);
	var requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: urlencoded,
		redirect: 'follow'
	};
	const res = await fetch(CUSTOM_DOMAIN + '/oauth2/token', requestOptions)
		.then((result) => {
			return result;
		})
		.catch((error) => {
			console.warn('error', error);
			return { error: 'there was an error fetching the code' };
		});
	console.log('res is:\n', await res);
	const jsonRes = await res.json();
	console.log('resjson is:\n', jsonRes);
	return jsonRes;
};

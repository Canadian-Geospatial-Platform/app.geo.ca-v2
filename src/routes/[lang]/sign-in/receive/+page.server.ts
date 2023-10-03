import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';

const CLIENT_ID = env.VITE_CLIENT_ID;
const CUSTOM_DOMAIN = env.VITE_CUSTOM_DOMAIN;

export const load: PageServerLoad = async ({ cookies, params, url, fetch }) => {
	let jwt = null;

	console.log(1)
	try {
	console.log(2)
		jwt = await getJWT(url.searchParams.get('code'), url.origin + url.pathname, fetch);
	console.log(3)
	} catch (error) {
	console.log(4)
		console.warn('error fetching jwt');
	console.log(5)
	}
	console.log(6)
	cookies.set('token', JSON.stringify(jwt?.id_token), { path: '/' });
	console.log(7);
	console.log('state is: \n', url.searchParams.get('state'))
	console.log(8);
	throw redirect(303, url.searchParams.get('state'));
};

const getJWT = async function (code: String, signInPageUrl: String, fetch) {
	console.log('getJwt');
	const data = {
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: signInPageUrl,
		client_id: CLIENT_ID
	};
	console.log(data);
	const url = CUSTOM_DOMAIN + '/oauth2/token';
	return fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		},
		body: urlEncode(data)
	})
		.then((response) => response.json())
		.then((data) => {
			const res = data;
			if (!res) throw 'Falsy Jwt returned.';
			if (res.error) throw 'Error message returned from authorization server:\n' + res.error;
			return res;
		})
		.catch((error) => {
			console.error('Error:', error);
			throw 'Error:' + error;
		});
};

import type { PageServerLoad } from './$types';
import { Config } from 'sst/node/config';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';

const CLIENT_ID = Config.OIDC_CLIENT_ID;
const CUSTOM_DOMAIN = Config.OIDC_CUSTOM_DOMAIN;
const CLIENT_SECRET = Config.OIDC_CLIENT_SECRET;

export const load: PageServerLoad = async ({ cookies, params, url, fetch }) => {
	let jwt = null;
	console.log('deploy test')

	try {
		console.log('pre logMovies:\n');
		const x = await logMovies(fetch)
		console.log('post logMovies:\n');
		jwt = await getJWT(url.searchParams.get('code'), url.origin + url.pathname, fetch);
		console.log('jwt is:\n', jwt);
		cookies.set('token', jwt, { path: '/' });
	} catch (error) {
		console.warn('error fetching and setting jwt');
	}

	throw redirect(303, url.searchParams.get('state'));
};

// const getJWT = async function (code: String, signInPageUrl: String, fetch) {
// 	console.log('getJwt');
// 	const data = {
// 		grant_type: 'authorization_code',
// 		code: code,
// 		redirect_uri: signInPageUrl,
// 		client_id: CLIENT_ID,
// 		client_secret: CLIENT_SECRET
// 	};
// 	const url = CUSTOM_DOMAIN + '/oauth2/token';
// 	return fetch(url, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
// 		},
// 		body: urlEncode(data)
// 	})
// 		.then((response) => {
// 			response.json();
// 		})
// 		.then((data) => {
// 			const res = data;
// 			if (!res) throw 'Falsy Jwt returned.';
// 			if (res.error) throw 'Error message returned from authorization server:\n' + res.error;
// 			return res;
// 		})
// 		.catch((error) => {
// 			console.warn('Error:', error);
// 			throw 'Error:' + error;
// 		});
// };

const getJWT = async function (code: String, signInPageUrl: String, fetch) {
	console.log('getJWT2')
	var myHeaders = new Headers();
	myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');

	var urlencoded = new URLSearchParams();
	urlencoded.append('grant_type', 'authorization_code');
	urlencoded.append('code', code);
	urlencoded.append('redirect_uri', signInPageUrl);
	urlencoded.append('client_id', CLIENT_ID);
	urlencoded.append('client_secret', CLIENT_SECRET);
	var requestOptions = {
		method: 'POST',
		headers: myHeaders,
		body: urlencoded,
		redirect: 'follow'
	};
	const res = fetch(CUSTOM_DOMAIN + '/oauth2/token', requestOptions)
		.then((response) => {response.json()})
		.then((result) => {
			console.log(result);
			return result;
		})
		.catch((error) => {
		console.warn('error', error)
		return {'error': 'there was an error fetching the code'}
		}
	);
	console.log('res is: \n', await res)
	return await res;
};

async function logMovies(fetch) {
  const response = await fetch("https://gist.githubusercontent.com/saniyusuf/406b843afdfb9c6a86e25753fe2761f4/raw/523c324c7fcc36efab8224f9ebb7556c09b69a14/Film.JSON");
  const movies = await response.json();
  console.log('movies is:\n', movies);
}

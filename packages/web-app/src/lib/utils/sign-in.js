import { createRemoteJWKSet, jwtVerify } from 'jose';
import * as client from 'openid-client';
import { page } from '$app/stores';
import {
	getOidcCustomDomain,
	getOidcClientId,
	getOidcClientSecret
} from '$lib/utils/environment-variables.ts';

const OIDC_CLIENT_SECRET = getOidcClientSecret();
const OIDC_CLIENT_ID = getOidcClientId();
const OIDC_CUSTOM_DOMAIN = getOidcCustomDomain();
const RESPONSE_TYPE = 'code';
const SCOPE = 'openid profile email phone language';

console.log(OIDC_CLIENT_SECRET, OIDC_CLIENT_ID, OIDC_CUSTOM_DOMAIN);

// configuration
let server = new URL(OIDC_CUSTOM_DOMAIN + '/oauth2/.well-known/openid-configuration'); // Authorization Server's Issuer Identifier
let clientId = OIDC_CLIENT_ID || ''; // Client identifier at the Authorization Server
let clientSecret = OIDC_CLIENT_SECRET || ''; // Client Secret

let config = await client.discovery(server, clientId, clientSecret);

// configuration end

// returns a url that the user must be redirected to.
const signIn = async (cookies, state) => {
	console.log('signing in.');
	try {
		/**
		 * Value used in the authorization request as the redirect_uri parameter, this
		 * is typically pre-registered at the Authorization Server.
		 */
		let redirect_uri = 'http://localhost:8080/sign-in/receive';
		let scope = SCOPE; // Scope of the access request
		/**
		 * PKCE: The following MUST be generated for every redirect to the
		 * authorization_endpoint. You must store the code_verifier and state in the
		 * end-user session such that it can be recovered as the user gets redirected
		 * from the authorization server back to your application.
		 */
		let code_verifier = client.randomPKCECodeVerifier();
		cookies.set('code_verifier', code_verifier, { path: '/' });
		cookies.set('state', state, { path: '/' });
		let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

		let parameters = {
			redirect_uri,
			scope,
			state,
			code_challenge,
			code_challenge_method: 'S256'
		};
		console.log('got to params');
		let redirectTo = client.buildAuthorizationUrl(config, parameters);

		// now redirect the user to redirectTo.href
		console.log('Please redirect the user to', redirectTo.href);

		return { ok: true, value: redirectTo };
	} catch (error) {
		console.log('Error building sign-in url.', error);
		return { ok: false };
	}
};

const exchangeCode = async (currentUrl, cookies) => {
	let ret = { ok: false, value: null };
	try {
		let tokens = await client.authorizationCodeGrant(config, currentUrl, {
			pkceCodeVerifier: cookies.get('code_verifier'),
			expectedState: cookies.get('state')
		});
		cookies.set('jwt', JSON.stringify(tokens), { path: '/' });
		cookies.set('access_token', tokens.access_token, { path: '/' });
		cookies.set('id_token', tokens.id_token, { path: '/' });
		cookies.set('refresh_token', tokens.refresh_token, { path: '/' });
		cookies.set('grant_id', tokens.grant_id, { path: '/' });
		ret.value = cookies.get('state');
		ret.ok = true;
		console.log('User is signed in.');
		return ret;
	} catch (error) {
		console.error('error exchanging code.', error);
		return ret;
	}
};

const signOut = async (cookies) => {
	cookies.delete('access_token', { path: '/' });
	cookies.delete('id_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });
	cookies.delete('grant_id', { path: '/' });
	cookies.delete('jwt', { path: '/' });
	console.log('User is signed out.');
};

const getToken = async (cookies) => {
	let ret = { ok: false, value: null };
	try {
		// validate token here
		const { payload, protectedHeader } = await jwtVerify(JSON.parse(cookies.jwt), secret, {
			issuer: server
		});

		return ret;
	} catch (error) {
		console.log('Token is invalid.', error);
		return { ok: false, value: null };
	}
};

export { signIn, signOut, exchangeCode, getToken };

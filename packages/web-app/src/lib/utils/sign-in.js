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

// configuration
const server = new URL(OIDC_CUSTOM_DOMAIN + '/oauth2/.well-known/openid-configuration'); // Authorization Server's Issuer Identifier
const clientId = OIDC_CLIENT_ID || ''; // Client identifier at the Authorization Server
const clientSecret = OIDC_CLIENT_SECRET || ''; // Client Secret

const config = await client.discovery(server, clientId, clientSecret);

// Fetch OIDC configuration
const configValues = await fetch(
	`${OIDC_CUSTOM_DOMAIN}/oauth2/.well-known/openid-configuration`
).then((res) => res.json());

// Create JWKS client
const JWKS = createRemoteJWKSet(new URL(configValues.jwks_uri));

// configuration end

// Base64 URL encoding/decoding helpers
const base64UrlEncode = (str) => {
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (str) => {
	// Add back padding
	let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
	while (base64.length % 4) {
		base64 += '=';
	}
	return atob(base64);
};

// returns a url that the user must be redirected to.
const signIn = async (cookies, state, url) => {
	console.log('signing in.');
	try {
		/**
		 * Value used in the authorization request as the redirect_uri parameter, this
		 * is typically pre-registered at the Authorization Server.
		 */
		console.log('url is:\n', url);
		console.log('url is:\n', JSON.stringify(url));
		let redirect_uri = url.origin + '/sign-in/receive';
		let scope = SCOPE; // Scope of the access request
		/**
		 * PKCE: The following MUST be generated for every redirect to the
		 * authorization_endpoint. You must store the code_verifier and state in the
		 * end-user session such that it can be recovered as the user gets redirected
		 * from the authorization server back to your application.
		 */
		let code_verifier = client.randomPKCECodeVerifier();
		cookies.set('code_verifier', code_verifier, { path: '/' });
		// Encode state as base64 URL before storing
		const encodedState = base64UrlEncode(state);
		cookies.set('state', encodedState, { path: '/' });
		let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

		let parameters = {
			redirect_uri,
			scope,
			state: encodedState,
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
		// Decode the state from base64 URL
		const encodedState = cookies.get('state');
		let tokens = await client.authorizationCodeGrant(config, currentUrl, {
			pkceCodeVerifier: cookies.get('code_verifier'),
			expectedState: encodedState
		});
		cookies.set('jwt', JSON.stringify(tokens), { path: '/' });
		cookies.set('access_token', tokens.access_token, { path: '/' });
		cookies.set('id_token', tokens.id_token, { path: '/' });
		cookies.set('refresh_token', tokens.refresh_token, { path: '/' });
		cookies.set('grant_id', tokens.grant_id, { path: '/' });
		// Decode the state before returning
		ret.value = base64UrlDecode(encodedState);
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
	// console.log(JSON.parse(cookies.get('jwt')));
	try {
		// validate token here
		const { payload, protectedHeader } = await jwtVerify(cookies.get('id_token'), JWKS, {
			issuer: configValues.issuer,
			audience: OIDC_CLIENT_ID
		});
		ret.value = payload;
		ret.ok = true;
		return ret;
	} catch (error) {
		console.log('Token is invalid.', error);
		return { ok: false, value: null };
	}
};

export { signIn, signOut, exchangeCode, getToken };

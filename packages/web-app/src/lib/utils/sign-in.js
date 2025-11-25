import { createRemoteJWKSet, jwtVerify } from 'jose';
import * as client from 'openid-client';
import { page } from '$app/stores';

const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CUSTOM_DOMAIN = process.env.OIDC_CUSTOM_DOMAIN;
const OIDC_REDIRECT_URIS = [
	'https://localhost:8080/en-ca/logout',
	'https://localhost:8080/fr-ca/logout'
];
const HOST_CERTIFICATE = process.env.OIDC_HOST_CERTIFICATE;
const RESPONSE_TYPE = 'code';
const SCOPE = 'openid profile email phone language';

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
		ret.value = cookies.get('state');
		ret.ok = true;
		console.log('prereturn');
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
	cookies.delete('jwt', { path: '/' });
	console.log('signed out.');
};

export { signIn, signOut, exchangeCode };

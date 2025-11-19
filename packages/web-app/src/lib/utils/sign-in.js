import { createRemoteJWKSet, jwtVerify } from 'jose';
import * as client from 'openid-client';
import { page } from '$app/stores';

const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CUSTOM_DOMAIN = process.env.OIDC_CUSTOM_DOMAIN;
const OIDC_REDIRECT_URIS = ["https://localhost:8080/en-ca/logout", "https://localhost:8080/fr-ca/logout"]
const HOST_CERTIFICATE = process.env.OIDC_HOST_CERTIFICATE;
const RESPONSE_TYPE = "code";
const SCOPE = 'openid profile email phone language';

// configuration
let server = new URL(OIDC_CUSTOM_DOMAIN + "/oauth2/.well-known/openid-configuration") // Authorization Server's Issuer Identifier
let clientId = OIDC_CLIENT_ID || '' // Client identifier at the Authorization Server
let clientSecret = OIDC_CLIENT_SECRET || '' // Client Secret

let config = await client.discovery(
	server,
	clientId,
	clientSecret,
)
console.log(config)
// configuration end

const signIn = async (cookies) => {
	console.log("signing in.")
	try {
		/**
		 * Value used in the authorization request as the redirect_uri parameter, this
		 * is typically pre-registered at the Authorization Server.
		 */
		let redirect_uri = "https://localhost:8080/en-ca/receive"
		let scope = SCOPE// Scope of the access request
		/**
		 * PKCE: The following MUST be generated for every redirect to the
		 * authorization_endpoint. You must store the code_verifier and state in the
		 * end-user session such that it can be recovered as the user gets redirected
		 * from the authorization server back to your application.
		 */
		let code_verifier = client.randomPKCECodeVerifier()
		cookies.set("code_verifier", code_verifier, { path: '/' })
		let code_challenge =
			await client.calculatePKCECodeChallenge(code_verifier)

		let parameters = {
			redirect_uri,
			scope,
			code_challenge,
			code_challenge_method: 'S256',
		}
		console.log("got to params")
		let redirectTo = client.buildAuthorizationUrl(config, parameters)

		// now redirect the user to redirectTo.href
		console.log('Please redirect the user to', redirectTo.href)

		return { ok: true, value: redirectTo };
	} catch (error) {
		console.log('Token is invalid.', error);
		return { ok: false };
	}
};

const exchangeCode = async (currentUrl, state, cookies) => {
	let getCurrentUrl = currentUrl

	let tokens = await client.authorizationCodeGrant(
		config,
		getCurrentUrl(),
		{
			pkceCodeVerifier: cookies.get("code_verifier"),
			expectedState: state,
		},
	)

	console.log('Token Endpoint Response', tokens)
	cookies.set('jwt', JSON.stringify(tokens), { path: '/' });
	return tokens;
}

const signOut = async (cookies) => {
	cookies.delete('access_token', { path: '/' });
	cookies.delete('id_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });
	cookies.delete('jwt', { path: '/' });
	console.log("signed out.")
}

export { signIn, signOut, exchangeCode };

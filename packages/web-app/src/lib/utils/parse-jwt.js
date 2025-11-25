import { createRemoteJWKSet, jwtVerify } from 'jose';

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

const getToken = async (cookies) => {
	try {
		// validate token here
		return { ok: true, value: 'payload' };
	} catch (error) {
		console.log('Token is invalid.', error);
		return { ok: false };
	}
};

export { getToken };

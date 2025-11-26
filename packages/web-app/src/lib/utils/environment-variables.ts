// todo: Prevent this import from printing an error when run locally. It should only be used when deployed to the cloud.
import { Config } from 'sst/node/config';

/**
 * Returns the Geovore API domain.
 * Falls back to Vite env variable if SST binding is not available.
 */
const getGeocoreApiDomain = function () {
	return 'VITE_GEOCORE_API_DOMAIN' in Config
		? Config.VITE_GEOCORE_API_DOMAIN
		: import.meta.env.VITE_GEOCORE_API_DOMAIN;
};

/**
 * Returns the Semantic Search URL.
 * Falls back to Vite env variable if SST binding is not available.
 */
const getSemanticSearchUrl = function () {
	return 'VITE_SEMANTIC_SEARCH_URL' in Config
		? Config.VITE_SEMANTIC_SEARCH_URL
		: import.meta.env.VITE_SEMANTIC_SEARCH_URL;
};

const getOidcCustomDomain = function () {
	return 'VITE_OIDC_CUSTOM_DOMAIN' in Config
		? Config.VITE_OIDC_CUSTOM_DOMAIN
		: import.meta.env.VITE_OIDC_CUSTOM_DOMAIN;
};

const getOidcClientId = function () {
	return 'VITE_OIDC_CLIENT_ID' in Config
		? Config.VITE_OIDC_CLIENT_ID
		: import.meta.env.VITE_OIDC_CLIENT_ID;
};

const getOidcClientSecret = function () {
	return 'VITE_OIDC_CLIENT_SECRET' in Config
		? Config.VITE_OIDC_CLIENT_SECRET
		: import.meta.env.VITE_OIDC_CLIENT_SECRET;
};

export {
	getGeocoreApiDomain,
	getSemanticSearchUrl,
	getOidcCustomDomain,
	getOidcClientId,
	getOidcClientSecret
};

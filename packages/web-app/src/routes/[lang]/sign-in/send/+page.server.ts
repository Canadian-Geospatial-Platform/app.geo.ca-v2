import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import {
  createOidcNonce,
  createOidcStateToken,
  createPkceChallenge,
  createPkceVerifier,
  getSignInUrl,
  setOidcNonceCookie,
  setOidcStateCookies,
  setPkceVerifierCookie,
} from '$lib/utils/auth/sign-in-core.server';

/**
 * Starts the OIDC sign-in flow by redirecting to the provider authorized URL.
 *
 * @param event - SvelteKit load event containing language params, URL, and cookies.
 * @returns Redirect response to provider authorize URL or local fallback path.
 */
export const load: PageServerLoad = async ({ cookies, params, url }: Parameters<PageServerLoad>[0]): Promise<void> => {
  // Log OIDC config status in non-production environments for easier debugging
  if (process.env.NODE_ENV !== 'production') {
    const oidcDomain = process.env.OIDC_CUSTOM_DOMAIN ?? '';
    const oidcHost = oidcDomain ? new URL(oidcDomain).host : '';
    console.info('[sign-in/send] OIDC config status', {
      hasClientId: Boolean(process.env.OIDC_CLIENT_ID),
      hasClientSecret: Boolean(process.env.OIDC_CLIENT_SECRET),
      hasCustomDomain: Boolean(oidcDomain),
      oidcHost,
    });
  }

  const fallbackPath = `/${params.lang}/map-browser`;
  const returnTo = url.searchParams.get('state') ?? fallbackPath;
  const pkceVerifier = createPkceVerifier();
  const oidcNonce = createOidcNonce();
  const oidcState = createOidcStateToken();
  const signInUrl = getSignInUrl(url, oidcState, createPkceChallenge(pkceVerifier), oidcNonce);

  if (!signInUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sign-in/send] Missing OIDC config, redirecting to fallback path');
    }
    throw redirect(303, fallbackPath);
  }

  setPkceVerifierCookie(cookies, pkceVerifier);
  setOidcNonceCookie(cookies, oidcNonce);
  setOidcStateCookies(cookies, oidcState, returnTo);
  throw redirect(303, signInUrl);
};

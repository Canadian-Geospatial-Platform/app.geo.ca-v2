import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import {
  consumeOidcNonceCookie,
  consumePkceVerifierCookie,
  exchangeCodeForTokens,
  setAuthCookies,
} from '$lib/utils/auth/sign-in-core.server';
import { getLangFromState, getPostAuthRedirect, mergeGuestFavourites } from '$lib/utils/auth/sign-in-post-auth.server';
import { verifyIdToken } from '$lib/utils/auth/id-token.server';
import { getPrivateKeyMaterial } from '$lib/utils/auth/oidc.server';

/**
 * Handles the OIDC callback without a language prefix, stores auth cookies,
 * and redirects back to the original in-app location.
 *
 * @param event - SvelteKit load event containing callback URL and cookies.
 * @returns Redirect response to fallback or resolved post-auth path.
 */
export const load: PageServerLoad = async ({ cookies, url }: Parameters<PageServerLoad>[0]): Promise<void> => {
  const isNonProd = process.env.NODE_ENV !== 'production';
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const lang = getLangFromState(state);
  const fallbackPath = `/${lang}/map-browser`;

  if (!code) {
    if (isNonProd) {
      console.warn('[sign-in/receive] Missing authorization code in callback');
    }
    throw redirect(303, fallbackPath);
  }

  const codeVerifier = consumePkceVerifierCookie(cookies);
  const expectedNonce = consumeOidcNonceCookie(cookies);
  const keyMaterial = await getPrivateKeyMaterial();
  const tokenResponse = await exchangeCodeForTokens(code, url, codeVerifier, keyMaterial?.pem ?? null, keyMaterial?.x5tS256 ?? null);
  if (!tokenResponse || !expectedNonce) {
    if (isNonProd) {
      console.warn('[sign-in/receive] Token exchange/nonce validation failed', {
        hasCodeVerifier: Boolean(codeVerifier),
        hasExpectedNonce: Boolean(expectedNonce),
      });
    }
    throw redirect(303, fallbackPath);
  }

  const idTokenPayload = tokenResponse.id_token ? await verifyIdToken(tokenResponse.id_token, expectedNonce) : null;
  if (!idTokenPayload) {
    if (isNonProd) {
      console.warn('[sign-in/receive] ID token verification failed', {
        hasIdToken: Boolean(tokenResponse.id_token),
        hasExpectedNonce: Boolean(expectedNonce),
      });
    }
    throw redirect(303, fallbackPath);
  }

  const didSetCookies = setAuthCookies(cookies, url, tokenResponse);
  if (!didSetCookies) {
    if (isNonProd) {
      console.warn('[sign-in/receive] Failed to set auth cookies', {
        hasIdToken: Boolean(tokenResponse.id_token),
        hasAccessToken: Boolean(tokenResponse.access_token),
        hasRefreshToken: Boolean(tokenResponse.refresh_token),
      });
    }
    throw redirect(303, fallbackPath);
  }

  try {
    await mergeGuestFavourites(cookies);
  } catch {
    // Keep auth redirect resilient even if favourites merge fails.
  }

  throw redirect(303, getPostAuthRedirect(url, state, lang));
};

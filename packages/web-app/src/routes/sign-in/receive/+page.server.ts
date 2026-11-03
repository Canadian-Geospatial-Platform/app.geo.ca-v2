import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import {
  consumeOidcNonceCookie,
  consumeOidcStateCookies,
  consumePkceVerifierCookie,
  exchangeCodeForTokens,
  setAuthCookies,
} from '#lib/utils/auth/sign-in-core.server.js';
import { getLangFromState, getPostAuthRedirect } from '#lib/utils/auth/sign-in-post-auth.server.js';
import { mergeGuestFavourites } from '#lib/db/favourites.js';
import { getCookieDomainOptions, isSecureCookieEnvironment } from '#lib/utils/auth/cookie-policy.server.js';
import { verifyIdToken } from '#lib/utils/auth/id-token.server.js';
import { getPrivateKeyMaterial } from '#lib/utils/auth/oidc.server.js';
import { createSessionCookie } from '#lib/utils/auth/session-cookie.server.js';

const AUTH_ERROR_COOKIE_NAME = 'auth_error';

/**
 * Sets a short-lived marker so the localized page can display a sign-in failure.
 *
 * @param cookies - Request cookie jar used to store the marker.
 */
function setAuthErrorCookie(cookies: Parameters<PageServerLoad>[0]['cookies']): void {
  cookies.set(AUTH_ERROR_COOKIE_NAME, 'signin_failed', {
    path: '/',
    ...getCookieDomainOptions(),
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookieEnvironment(),
    maxAge: 60,
  });
}

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
  const callbackState = url.searchParams.get('state');
  // Consume state before validation so a callback cannot replay the one-time auth transaction.
  const { stateToken: expectedStateToken, returnTo } = consumeOidcStateCookies(cookies);
  const lang = getLangFromState(returnTo ?? callbackState);
  const fallbackPath = `/${lang}/map-browser`;

  /**
   * Marks the failed callback and redirects to the localized sign-in fallback.
   *
   * @param reason - Failure reason used for non-production diagnostics.
   * @param details - Optional safe diagnostic context.
   * @throws Redirects to the localized map-browser page.
   */
  function failAuth(reason: string, details?: Record<string, unknown>): never {
    setAuthErrorCookie(cookies);
    if (isNonProd) {
      console.warn(`[sign-in/receive] ${reason}`, details);
    }
    throw redirect(303, fallbackPath);
  }

  if (!code) {
    failAuth('Missing authorization code in callback');
  }

  if (!expectedStateToken || !callbackState || callbackState !== expectedStateToken) {
    failAuth('State validation failed', {
      hasExpectedStateToken: Boolean(expectedStateToken),
      hasCallbackState: Boolean(callbackState),
      matchesStateToken: callbackState === expectedStateToken,
    });
  }

  const codeVerifier = consumePkceVerifierCookie(cookies);
  const expectedNonce = consumeOidcNonceCookie(cookies);
  const keyMaterial = await getPrivateKeyMaterial();
  const tokenResponse = await exchangeCodeForTokens(code, url, codeVerifier, keyMaterial?.pem ?? null, keyMaterial?.x5tS256 ?? null);
  if (!tokenResponse || !codeVerifier || !expectedNonce) {
    failAuth('Token exchange/PKCE/nonce validation failed', {
      hasCodeVerifier: Boolean(codeVerifier),
      hasExpectedNonce: Boolean(expectedNonce),
    });
  }

  const idTokenPayload = tokenResponse.id_token ? await verifyIdToken(tokenResponse.id_token, expectedNonce) : null;
  if (!idTokenPayload) {
    failAuth('ID token verification failed', {
      hasIdToken: Boolean(tokenResponse.id_token),
      hasExpectedNonce: Boolean(expectedNonce),
    });
  }

  const didSetCookies = setAuthCookies(cookies, tokenResponse);
  if (!didSetCookies) {
    failAuth('Failed to set auth cookies', {
      hasIdToken: Boolean(tokenResponse.id_token),
      hasAccessToken: Boolean(tokenResponse.access_token),
      hasRefreshToken: Boolean(tokenResponse.refresh_token),
    });
  }

  createSessionCookie(cookies, idTokenPayload.sub ?? idTokenPayload.username ?? '', idTokenPayload.sid ?? null);

  try {
    await mergeGuestFavourites(cookies);
  } catch {
    // Authentication is already established; a favourites persistence failure must not block sign-in.
    // Keep auth redirect resilient even if favourites merge fails.
  }

  throw redirect(303, getPostAuthRedirect(url, returnTo ?? callbackState, lang));
};

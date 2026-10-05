import type { Cookies } from '@sveltejs/kit';
import { clearAuthCookies } from '$lib/utils/auth/auth-cookies';
import { getLangFromPath } from '$lib/utils/language';

/**
 * Normalizes and validates post-auth state redirects.
 *
 * @param requestUrl - Current request URL.
 * @param state - Optional state value from auth round-trip.
 * @param lang - Active language segment.
 * @returns Safe in-app path for redirect.
 */
function normalizeStateUrl(requestUrl: URL, state: string | null, lang: string): string {
  const fallbackPath = `/${lang}/map-browser`;
  if (!state) {
    return fallbackPath;
  }

  try {
    // Only allow same-origin redirects to prevent open redirect issues.
    const parsed = new URL(state, requestUrl.origin);
    if (parsed.origin !== requestUrl.origin) {
      return fallbackPath;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}

/**
 * Infers the language segment from round-trip state.
 *
 * @param state - State value from auth round-trip.
 * @returns `fr-ca` when state points to French routes; otherwise `en-ca`.
 */
export function getLangFromState(state: string | null): 'en-ca' | 'fr-ca' {
  return getLangFromPath(state);
}

/**
 * Computes a safe redirect target after successful authentication.
 *
 * @param requestUrl - Current request URL.
 * @param state - Optional state value from auth round-trip.
 * @param lang - Active language segment.
 * @returns Safe post-auth path.
 */
export function getPostAuthRedirect(requestUrl: URL, state: string | null, lang: string): string {
  return normalizeStateUrl(requestUrl, state, lang);
}

/**
 * Returns the in-app destination used after local sign-out cookie cleanup.
 *
 * @param lang - Optional language segment. Defaults to `en-ca` when missing.
 * @param returnTo - Optional explicit in-app path to return to.
 * @returns Language-scoped map browser path.
 */
export function getPostLogoutRedirectPath(lang?: string, returnTo?: string | null): string {
  const fallbackLang = lang ?? 'en-ca';
  const fallbackPath = `/${fallbackLang}/map-browser`;

  const allowedReturnToPaths = lang ? [`/${lang}/favourites`] : ['/en-ca/favourites', '/fr-ca/favourites'];
  if (returnTo && allowedReturnToPaths.includes(returnTo)) {
    return returnTo;
  }

  return fallbackPath;
}

/**
 * Clears local auth cookies and resolves the redirect target for the local sign-out routes.
 *
 * Shared by the localized and non-localized `/sign-in/logout` routes so both apply
 * the same cookie-clearing and redirect-resolution behavior.
 *
 * @param cookies - Cookie jar from the request context.
 * @param url - Current request URL, used to read the `returnTo` query param.
 * @param lang - Active language segment, when known.
 * @returns Language-scoped redirect path after local sign-out cookie cleanup.
 */
export function completeLocalLogout(cookies: Cookies, url: URL, lang?: string): string {
  clearAuthCookies(cookies);
  const returnTo = url.searchParams.get('returnTo');
  return getPostLogoutRedirectPath(lang, returnTo);
}

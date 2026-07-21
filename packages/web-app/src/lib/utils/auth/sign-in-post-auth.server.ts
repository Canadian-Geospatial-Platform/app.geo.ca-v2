import type { Cookies } from '@sveltejs/kit';
import { getUserData, putUserData } from '$lib/db/user';

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
  if (!state) {
    return 'en-ca';
  }

  try {
    const parsed = new URL(state);
    if (parsed.pathname.startsWith('/fr-ca/')) {
      return 'fr-ca';
    }
  } catch {
    if (state.startsWith('/fr-ca/')) {
      return 'fr-ca';
    }
  }

  return 'en-ca';
}

/**
 * Merges guest favourites captured before sign-in into the signed-in profile.
 *
 * @param cookies - Cookie jar from the request context.
 */
export async function mergeGuestFavourites(cookies: Cookies): Promise<void> {
  const guestCookie = cookies.get('guest_favourites') ?? '';
  if (!guestCookie) {
    return;
  }

  let decodedGuestCookie = guestCookie;
  try {
    decodedGuestCookie = decodeURIComponent(guestCookie);
  } catch {
    // Keep raw cookie content when decoding fails.
  }

  // Retrieve guest favourites from cookies
  const guest = decodedGuestCookie
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (guest.length === 0) {
    cookies.delete('guest_favourites', { path: '/' });
    return;
  }

  const userData = await getUserData(cookies);
  if (!userData.Item.uuid) {
    return;
  }

  const server = userData.Item.favourites ?? [];
  const merged = Array.from(new Set([...server, ...guest]));

  let didPersist = true;

  // Write only when order/content changed to avoid unnecessary DynamoDB writes.
  if (merged.length !== server.length || server.some((id, index) => id !== merged[index])) {
    const result = await putUserData(
      {
        uuid: userData.Item.uuid,
        favourites: merged,
        mapConfigs: userData.Item.mapConfigs ?? [],
      },
      cookies
    );
    didPersist = result.ok;
  }

  if (didPersist) {
    cookies.delete('guest_favourites', { path: '/' });
  }
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

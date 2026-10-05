import { normalizeFavourites } from '$lib/utils/favourites-storage';

/**
 * Cookie name used to carry guest favourites from the client into the sign-in callback for merging.
 */
export const GUEST_FAVOURITES_COOKIE_NAME = 'guest_favourites';

/**
 * Encodes a raw favourites storage value for safe transport in a cookie.
 *
 * @param rawFavourites - Raw comma-separated favourites value from local storage.
 * @returns URI-encoded cookie value.
 */
export function encodeGuestFavouritesCookieValue(rawFavourites: string): string {
  return encodeURIComponent(rawFavourites);
}

/**
 * Decodes and normalizes a guest favourites cookie value.
 *
 * Falls back to the raw cookie value when it is not URI-encoded.
 *
 * @param cookieValue - Raw cookie value read from the request.
 * @returns Normalized list of favourite IDs.
 */
export function decodeGuestFavouritesCookieValue(cookieValue: string): string[] {
  let decoded = cookieValue;
  try {
    decoded = decodeURIComponent(cookieValue);
  } catch {
    // Keep raw cookie content when decoding fails.
  }

  return normalizeFavourites(decoded.split(','));
}

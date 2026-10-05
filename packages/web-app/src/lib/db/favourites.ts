import type { Cookies } from '@sveltejs/kit';
import { getUserData, putUserData } from '$lib/db/user';
import { decodeGuestFavouritesCookieValue, GUEST_FAVOURITES_COOKIE_NAME } from '$lib/utils/guest-favourites';

/**
 * Merges guest favourites captured before sign-in into the signed-in profile.
 *
 * @param cookies - Cookie jar from the request context.
 */
export async function mergeGuestFavourites(cookies: Cookies): Promise<void> {
  const guestCookie = cookies.get(GUEST_FAVOURITES_COOKIE_NAME) ?? '';
  if (!guestCookie) {
    return;
  }

  const guest = decodeGuestFavouritesCookieValue(guestCookie);

  if (guest.length === 0) {
    cookies.delete(GUEST_FAVOURITES_COOKIE_NAME, { path: '/' });
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
    cookies.delete(GUEST_FAVOURITES_COOKIE_NAME, { path: '/' });
  }
}

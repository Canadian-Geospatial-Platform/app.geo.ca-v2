import { getUserData, putUserData } from '$lib/db/user';
import type { Cookies } from '@sveltejs/kit';

interface favouritesProps {
  cookies: Cookies;
  request: Request;
}

type FavouriteActionResult = {
  ok: boolean;
  favourites: string[];
};

/**
 * Adds an item to the signed-in user's favourites.
 *
 * @param props - Server action context containing cookies and form request.
 * @returns Operation status and the resulting favourites list.
 */
export async function addToFavourites({ cookies, request }: favouritesProps): Promise<FavouriteActionResult> {
  // Resolve the current signed-in user from cookies/JWT claims.
  const userData = await getUserData(cookies);
  const formData = await request.formData();
  // Normalize the record id from the submitted form payload.
  const id = String(formData.get('id') ?? '').trim();

  // Reject when not signed in or when id is missing/blank.
  if (!userData.Item.uuid || !id) {
    return { ok: false, favourites: userData.Item.favourites ?? [] };
  }

  // Keep ids unique while preserving insertion order.
  userData.Item.favourites = Array.from(new Set([...(userData.Item.favourites ?? []), id]));
  // Persist the full user item (uuid + favourites) to DynamoDB.
  const result = await putUserData(userData.Item, cookies);
  return { ok: result.ok, favourites: userData.Item.favourites };
}

/**
 * Removes an item from the signed-in user's favourites.
 *
 * @param props - Server action context containing cookies and form request.
 * @returns Operation status and the resulting favourites list.
 */
export async function removeFromFavourites({ cookies, request }: favouritesProps): Promise<FavouriteActionResult> {
  const userData = await getUserData(cookies);
  const formData = await request.formData();
  const id = String(formData.get('id') ?? '').trim();

  // Reject when not signed in or when id is missing/blank.
  if (!userData.Item.uuid || !id) {
    return { ok: false, favourites: userData.Item.favourites ?? [] };
  }

  // Remove only exact id matches; preserve remaining order.
  userData.Item.favourites = (userData.Item.favourites ?? []).filter((favourite: string) => favourite !== id);
  const result = await putUserData(userData.Item, cookies);
  return { ok: result.ok, favourites: userData.Item.favourites };
}

/**
 * Clears all favourites for the signed-in user.
 *
 * @param props - Server action context containing cookies.
 * @returns Operation status and an empty favourites list on success.
 */
export async function clearFavourites({ cookies }: Omit<favouritesProps, 'request'>): Promise<FavouriteActionResult> {
  const userData = await getUserData(cookies);
  // Clearing favourites is only valid for authenticated users.
  if (!userData.Item.uuid) {
    return { ok: false, favourites: [] };
  }

  userData.Item.favourites = [];
  const result = await putUserData(userData.Item, cookies);
  return { ok: result.ok, favourites: [] };
}

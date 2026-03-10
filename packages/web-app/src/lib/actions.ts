import { getUserData, putUserData } from '$lib/db/user';
import { redirect, type Cookies } from '@sveltejs/kit';

interface favouritesProps {
	url: URL;
	cookies: Cookies;
	request: Request;
}

/**
 * Adds an item to the user's favourites and redirects back to the original URL.
 *
 * @param props - The properties including URL, cookies, and request.
 * @returns A promise that resolves when the operation is complete.
 */
export async function addToFavourites({ url, cookies, request }: favouritesProps): Promise<void> {
	const userData = await getUserData(cookies);
	const formData = await request.formData();
	userData.Item.favourites.push(formData.get('id') as string);
	putUserData(userData.Item, cookies);
	throw redirect(303, url.href);
}

/**
 * Removes an item from the user's favourites and redirects back to the original URL.
 *
 * @param props - The properties including URL, cookies, and request.
 * @returns A promise that resolves when the operation is complete.
 */
export async function removeFromFavourites({
	url,
	cookies,
	request
}: favouritesProps): Promise<void> {
	const userData = await getUserData(cookies);
	const formData = await request.formData();
	userData.Item.favourites = userData.Item.favourites.filter(
		(favourite: string) => favourite !== formData.get('id')
	);
	putUserData(userData.Item, cookies);
	throw redirect(303, url.href);
}

import { getUserData, putUserData } from '$lib/db/user.ts';
import { redirect } from '@sveltejs/kit';

const addToFavourites = async ({ url, cookies, request, event }) => {
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	userData.favourites.push(fd.get('id'));
	putUserData(userData, cookies);
	throw redirect(303, url.href);
};
const removeFromFavourites = async ({ url, cookies, request, event }) => {
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	let x = userData.favourites.filter((x) => x !== fd.get('id'));
	userData.favourites = userData.favourites.filter((x) => x !== fd.get('id'));
	putUserData(userData, cookies);
	throw redirect(303, url.href);
};

export { addToFavourites, removeFromFavourites };

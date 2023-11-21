import { getUserData, putUserData } from '$lib/io/user.ts';
import { redirect } from '@sveltejs/kit';

const addToMapCart = async ({ url, cookies, request, event }) => {
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	userData.mapCart.push(fd.get('id'));
	putUserData(userData, cookies);
	throw redirect(303, url.href);
};
const removeFromMapCart = async ({ url, cookies, request, event }) => {
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	let x = userData.mapCart.filter((x) => x !== fd.get('id'));
	userData.mapCart = userData.mapCart.filter((x) => x !== fd.get('id'));
	putUserData(userData, cookies);
	throw redirect(303, url.href);
};

export { addToMapCart, removeFromMapCart };

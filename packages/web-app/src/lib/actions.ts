import { getUserData, putUserData } from '$lib/db/user.ts';
import { redirect } from '@sveltejs/kit';

const addToMyCart = async ({ url, cookies, request, event }) => {
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	userData.myCart.push(fd.get('id'));
	putUserData(userData, cookies);
	throw redirect(303, url.href);
};
const removeFromMyCart = async ({ url, cookies, request, event }) => {
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	let x = userData.myCart.filter((x) => x !== fd.get('id'));
	userData.myCart = userData.myCart.filter((x) => x !== fd.get('id'));
	putUserData(userData, cookies);
	throw redirect(303, url.href);
};

export { addToMyCart, removeFromMyCart };

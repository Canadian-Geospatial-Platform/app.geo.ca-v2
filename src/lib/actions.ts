import { getUserData, putUserData } from '$lib/utils/user-db.ts';
import { parseJwt } from '$lib/utils/parse-jwt';
import { redirect } from '@sveltejs/kit';

const addToMapCart = async ({ url, cookies, request, event }) => {
	let userId = parseJwt(cookies.get('id_token')).identities[0].userId;
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	userData.mapCart.push(fd.get('id'));
	putUserData(userData);
	throw redirect(303, url.href);
	return { success: true };
};
const removeFromMapCart = async ({ url, cookies, request, event }) => {
	let userId = parseJwt(cookies.get('id_token')).identities[0].userId;
	let userData = await getUserData(cookies);
	userData = userData.Item;
	const fd = await request.formData();
	let x = userData.mapCart.filter((x) => x !== fd.get('id'));
	userData.mapCart = userData.mapCart.filter((x) => x !== fd.get('id'));
	putUserData(userData);
	throw redirect(303, url.href);
	return { success: true };
};

export { addToMapCart, removeFromMapCart };

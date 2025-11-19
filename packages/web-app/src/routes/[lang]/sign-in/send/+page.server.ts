import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';
import { signIn } from '$lib/utils/sign-in';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
	let signInUrl = await signIn(cookies);
	if (signInUrl.ok) {
		throw redirect(303, signInUrl.value || '/');
	} else {
		//handle error
	}
};

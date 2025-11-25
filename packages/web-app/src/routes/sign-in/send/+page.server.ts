import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { urlEncode } from '$lib/utils/url-encode';
import { signIn } from '$lib/utils/sign-in';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
	let signInUrl = await signIn(cookies, url.href);
	if (signInUrl.ok) {
		let redirectUrl = signInUrl.value || '/'
		throw redirect(303, redirectUrl);
	} else {
		//handle error
	}
};

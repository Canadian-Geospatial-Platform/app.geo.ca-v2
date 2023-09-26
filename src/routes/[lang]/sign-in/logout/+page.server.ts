import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = ({ cookies, params }) => {
	cookies.delete('token', { path: '/' });
	throw redirect(303, '/' + params.lang + '/map-browser');
};

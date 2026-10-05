import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { completeLocalLogout } from '$lib/utils/auth/sign-in-post-auth.server';

/**
 * Clears local auth cookies and redirects to the map browser.
 *
 * @param event - SvelteKit load event containing cookies and language params.
 * @returns Redirect response to the language-scoped map browser page.
 */
export const load: PageServerLoad = ({ cookies, params, url }: Parameters<PageServerLoad>[0]): Promise<void> => {
  throw redirect(303, completeLocalLogout(cookies, url, params.lang));
};

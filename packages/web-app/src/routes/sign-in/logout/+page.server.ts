import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { completeLocalLogout } from '#lib/utils/auth/sign-in-post-auth.server.js';
import { isAppLanguage } from '#lib/utils/language.js';

/**
 * Clears local auth cookies after provider logout and returns to a language-aware map browser path.
 *
 * @param event - SvelteKit load event containing cookies.
 * @returns Redirect response to a language-scoped map browser page.
 */
export const load: PageServerLoad = ({ cookies, url }: Parameters<PageServerLoad>[0]): Promise<void> => {
  const cookieLanguage = cookies.get('post_logout_lang');
  const appLangHint = isAppLanguage(cookieLanguage) ? cookieLanguage : undefined;
  throw redirect(303, completeLocalLogout(cookies, url, appLangHint));
};

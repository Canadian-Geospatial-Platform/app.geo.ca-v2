import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Preserves compatibility with legacy localized callback URLs.
 *
 * Unlike /[lang]/sign-in/send, this route only redirects: the provider callback is
 * registered against the locale-independent /sign-in/receive, which does the real work.
 */
export const load: PageServerLoad = async ({ url }: Parameters<PageServerLoad>[0]): Promise<void> => {
  throw redirect(303, `/sign-in/receive${url.search}`);
};

import { getTranslations } from '#lib/i18n/index.js';
import type { LayoutServerLoad } from './$types';
import { getUserData } from '#lib/db/user.js';
import { getCookieDomainOptions } from '#lib/utils/auth/cookie-policy.server.js';
import { isOidcConfigured } from '#lib/utils/auth/sign-in-core.server.js';
import { getOidcManageUrl } from '#lib/utils/auth/oidc.server.js';
import { getAppLanguage } from '#lib/utils/language.js';

type NavLink = {
  title: string;
  href: string;
  info?: string;
  tipId?: string;
};

type NavOption = {
  colTitle?: string;
  links: NavLink[];
};

type NavItem = {
  title: string;
  href?: string;
  counter?: boolean;
  localStorageKey?: string;
  options?: NavOption[];
};

type NavItems = Record<string, NavItem>;

/**
 * Loads global layout data for language-specific navigation
 * and signed-in user context used across pages.
 *
 * @param event - SvelteKit load event containing params and cookies.
 * @returns Layout data used by shared navigation and profile UI.
 */
export const load: LayoutServerLoad = async ({ params, cookies, depends, url }) => {
  depends('app:favourites');

  const appLang = getAppLanguage(params.lang);
  const userInfo = await getUserData(cookies);
  const signedIn = Boolean(userInfo.Item.uuid);
  console.debug('[+layout.server] User state loaded', {
    signedIn,
    userStatus: userInfo.status,
    uuid: userInfo.Item.uuid,
  });

  // When stale auth cookies were cleared this request, set a short-lived flash cookie so the
  // "signed out" notification survives any subsequent redirect (e.g. from a protected route).
  if (userInfo.sessionExpired) {
    cookies.set('session_expired', '1', {
      path: '/',
      ...getCookieDomainOptions(),
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      maxAge: 60,
    });
  }

  // Consume the flash cookie set by a previous request so the banner only shows once.
  const sessionExpired = cookies.get('session_expired') === '1' || url.searchParams.get('sessionExpired') === '1';
  if (sessionExpired) {
    cookies.delete('session_expired', { path: '/', ...getCookieDomainOptions() });
  }
  const authError = cookies.get('auth_error') === 'signin_failed';
  if (authError) {
    cookies.delete('auth_error', { path: '/', ...getCookieDomainOptions() });
  }
  // Clone shared catalogue data before customizing signed-in navigation.
  const navitems = structuredClone(getTranslations(appLang).components.header.navigation) as NavItems;

  if (signedIn && navitems.favourites) {
    navitems.favourites = {
      title: getTranslations(appLang).general.myGeo,
      href: `/${appLang}/favourites`,
    };
  }

  return {
    lang: appLang,
    signedIn,
    sessionExpired,
    authError,
    FEATURE_SIGN_IN: isOidcConfigured(),
    // Expose the deployment-controlled management portal only to authenticated users and only over HTTPS.
    manageCanadaLoginUrl: signedIn ? getOidcManageUrl() : null,
    userData: userInfo.Item,
    userDataStatus: userInfo.status,
    navitems,
  };
};

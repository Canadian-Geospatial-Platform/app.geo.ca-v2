import { getTranslations } from '#lib/i18n/index.js';
import { pickByLanguage, type AppLanguage } from '#lib/utils/language.js';

/**
 * Standard SEO metadata payload returned by server loads.
 */
interface SeoMetadata {
  canonicalUrl: string;
  alternateUrl: string;
  alternateLang: AppLanguage;
  metaDescription: string;
}

/**
 * Breadcrumb title link object used by page-level title slots.
 */
interface BreadcrumbTitle {
  text: string;
  href: string;
}

/**
 * Builds canonical and alternate URLs with an already-localized page description.
 *
 * @param url Current request URL.
 * @param appLang Current app language.
 * @param canonicalPath Path segment after language, without leading slash.
 * @param description Description already localized for appLang; used unchanged.
 * @returns SEO metadata object used in page data.
 */
export function buildSeoMetadata(url: URL, appLang: AppLanguage, canonicalPath: string, description: string): SeoMetadata {
  const canonicalUrl = `${url.origin}/${appLang}/${canonicalPath}`;
  const alternateAppLang = pickByLanguage<AppLanguage>(appLang, 'fr-ca', 'en-ca');
  const alternateUrl = url.href.replace(appLang, alternateAppLang);
  const metaDescription = description;

  return {
    canonicalUrl,
    alternateUrl,
    alternateLang: alternateAppLang,
    metaDescription,
  };
}

/**
 * Builds the common catalog breadcrumb title.
 *
 * @param url Current request URL.
 * @param appLang Current app language.
 * @returns Localized breadcrumb title and href for the catalog root.
 */
export function buildCatalogTitle(url: URL, appLang: AppLanguage): BreadcrumbTitle {
  return {
    text: getTranslations(appLang).general.catalogue,
    href: `${url.origin}/${appLang}/map-browser`,
  };
}

/**
 * Builds a localized page breadcrumb title for the current URL.
 *
 * @param url Current request URL.
 * @param title Already-localized page title; used unchanged.
 * @returns Localized breadcrumb title and href.
 */
export function buildPageTitle(url: URL, title: string): BreadcrumbTitle {
  return {
    text: title,
    href: url.href,
  };
}

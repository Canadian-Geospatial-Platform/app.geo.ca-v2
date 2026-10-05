import { pickByLanguage, type AppLanguage } from '$lib/utils/language';

/**
 * Localized description payload used for SEO metadata.
 */
interface DescriptionByLanguage {
  en: string;
  fr: string;
}

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
 * Builds canonical, alternate, and localized description metadata for a page.
 *
 * @param url Current request URL.
 * @param lang Current app language.
 * @param canonicalPath Path segment after language, without leading slash.
 * @param description Localized description strings.
 * @returns SEO metadata object used in page data.
 */
export function buildSeoMetadata(url: URL, lang: AppLanguage, canonicalPath: string, description: DescriptionByLanguage): SeoMetadata {
  const canonicalUrl = `${url.origin}/${lang}/${canonicalPath}`;
  const alternateLang: AppLanguage = lang === 'fr-ca' ? 'en-ca' : 'fr-ca';
  const alternateUrl = url.href.replace(lang, alternateLang);
  const metaDescription = pickByLanguage(lang, description.en, description.fr);

  return {
    canonicalUrl,
    alternateUrl,
    alternateLang,
    metaDescription,
  };
}

/**
 * Builds the common catalog breadcrumb title.
 *
 * @param url Current request URL.
 * @param lang Current app language.
 * @returns Localized breadcrumb title and href for the catalog root.
 */
export function buildCatalogTitle(url: URL, lang: AppLanguage): BreadcrumbTitle {
  return {
    text: pickByLanguage(lang, 'Geospatial Data Catalog', 'Catalogue de données géospatiales'),
    href: `${url.origin}/${lang}/map-browser`,
  };
}

/**
 * Builds a localized page breadcrumb title for the current URL.
 *
 * @param url Current request URL.
 * @param lang Current app language.
 * @param titleEn English page title.
 * @param titleFr French page title.
 * @returns Localized breadcrumb title and href.
 */
export function buildPageTitle(url: URL, lang: AppLanguage, titleEn: string, titleFr: string): BreadcrumbTitle {
  return {
    text: pickByLanguage(lang, titleEn, titleFr),
    href: url.href,
  };
}

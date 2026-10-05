/**
 * Canonical language codes supported by the app.
 */
export type AppLanguage = 'en-ca' | 'fr-ca';

const DEFAULT_LANGUAGE: AppLanguage = 'en-ca';
const SUPPORTED_LANGUAGES: readonly AppLanguage[] = ['en-ca', 'fr-ca'];

/**
 * Normalizes an arbitrary language input to a supported app language.
 *
 * Accepts short codes (`en`, `fr`) and full app codes (`en-ca`, `fr-ca`).
 * Falls back to English Canadian when input is missing or unsupported.
 *
 * @param input Raw language value from route params, query strings, or state.
 * @returns A normalized supported app language.
 */
export function getAppLanguage(input?: string | null): AppLanguage {
  if (!input) return DEFAULT_LANGUAGE;

  const normalized = input.toLowerCase();

  if (normalized === 'en' || normalized === 'en-ca') return 'en-ca';
  if (normalized === 'fr' || normalized === 'fr-ca') return 'fr-ca';

  return DEFAULT_LANGUAGE;
}

/**
 * Type guard that checks whether a value is one of the supported app languages.
 *
 * @param input Value to validate.
 * @returns True when the input is a valid AppLanguage.
 */
export function isAppLanguage(input?: string | null): input is AppLanguage {
  if (!input) return false;
  return SUPPORTED_LANGUAGES.includes(input as AppLanguage);
}

/**
 * Convenience predicate for French-language branching.
 *
 * @param lang Normalized app language.
 * @returns True when the language is French Canadian.
 */
export function isFrench(lang: AppLanguage): boolean {
  return lang === 'fr-ca';
}

/**
 * Picks between English and French values based on app language.
 *
 * @param lang Normalized app language.
 * @param enValue Value to use for English.
 * @param frValue Value to use for French.
 * @returns The value corresponding to the provided language.
 */
export function pickByLanguage<T>(lang: AppLanguage, enValue: T, frValue: T): T {
  return isFrench(lang) ? frValue : enValue;
}

/**
 * Extracts the app language from a path, relative state value, or absolute URL string.
 *
 * Looks for an `/en-ca/` or `/fr-ca/` path segment; falls back to English Canadian
 * when the segment is missing, unparsable, or the input is empty.
 *
 * @param pathOrUrl Path (e.g. `/fr-ca/map-browser`) or absolute URL string.
 * @returns A normalized supported app language.
 */
export function getLangFromPath(pathOrUrl?: string | null): AppLanguage {
  if (!pathOrUrl) return DEFAULT_LANGUAGE;

  let pathname = pathOrUrl;
  try {
    pathname = new URL(pathOrUrl).pathname;
  } catch {
    // Not an absolute URL; treat input as a path directly.
  }

  const langSegment = pathname.split('/').find((segment) => isAppLanguage(segment));
  return getAppLanguage(langSegment);
}

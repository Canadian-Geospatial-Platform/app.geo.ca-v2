import type { AppLanguage } from '#lib/utils/language.js';

/**
 * Formats a number using the application's locale for grouping and decimal separators.
 *
 * @param num - The number to format.
 * @param appLang - Normalized application language, independent of the runtime's default locale.
 * @returns The formatted number as a string.
 */
export const formatNumber = function (num: string | number, appLang: AppLanguage): string {
  return (typeof num === 'number' ? num : Number.parseFloat(num)).toLocaleString(appLang);
};

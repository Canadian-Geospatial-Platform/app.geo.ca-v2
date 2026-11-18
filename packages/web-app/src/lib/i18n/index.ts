import en from './en-ca.json';
import fr from './fr-ca.json';
import { pickByLanguage, type AppLanguage } from '#lib/utils/language.js';

export type Translations = typeof en;

/**
 * Selects the shared catalogue without changing a global active language.
 *
 * @param appLang - Normalized application language; normalize raw input with getAppLanguage.
 * @returns The selected catalogue. Treat it and its nested configuration as immutable.
 */
export function getTranslations(appLang: AppLanguage): Translations {
  return pickByLanguage<Translations>(appLang, en, fr);
}

/**
 * Replaces {name} placeholders with literal text, including repeated placeholders.
 *
 * @param template - Localized sentence containing named placeholders.
 * @param values - String or numeric values keyed by placeholder name; extra keys are ignored.
 * @returns Interpolated text, not escaped HTML. Render as text, never with {@html}.
 * @throws {Error} If a placeholder has no corresponding value.
 */
export function formatTranslation(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!Object.hasOwn(values, key)) throw new Error(`Missing translation parameter: ${key}`);
    return String(values[key]);
  });
}

import en from './en-ca.json';
import fr from './fr-ca.json';
import { pickByLanguage, type AppLanguage } from '#lib/utils/language.js';

export type Translations = typeof en;
type LabelComponent = {
  [K in keyof Translations['components']]: Translations['components'][K] extends { labels: object } ? K : never;
}[keyof Translations['components']];

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
 * Combines shared phrases with a component's labels.
 *
 * @param appLang - Normalized application language.
 * @param component - Key under components whose section contains a labels object.
 * @returns A new label map, with component labels taking precedence over general phrases.
 */
export function getComponentLabels<K extends LabelComponent>(
  appLang: AppLanguage,
  component: K
): Translations['general'] & Translations['components'][K]['labels'] {
  const translations = getTranslations(appLang);
  return { ...translations.general, ...translations.components[component].labels };
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

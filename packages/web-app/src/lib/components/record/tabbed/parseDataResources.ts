import type { DistributionOption } from '$lib/db/db-types';

/**
 * Parsed representation of a distribution option row.
 */
export type ParsedDataResource = {
  id: string;
  name: string;
  type: string;
  format: string;
  languages: string;
  url: string;
};

/**
 * Parses raw data resources from a metadata record into a structured array.
 *
 * @param dataResourcesRaw - Raw data resources array from the metadata record.
 * @param lang - Language code ('en' or 'fr').
 * @returns Parsed data resources array.
 */
export function parseDataResources(dataResourcesRaw: DistributionOption[], lang: 'en' | 'fr'): ParsedDataResource[] {
  type Translation = {
    en: string;
    fr: string;
  };

  type LanguageReplacements = {
    eng: Translation;
    fra: Translation;
    zxx: Translation;
  };

  const languageReplacements: LanguageReplacements = {
    eng: { en: 'English', fr: 'Anglais' },
    fra: { en: 'French', fr: 'Français' },
    zxx: { en: 'Not available', fr: 'Pas disponible' },
  };

  const translationLang: keyof Translation = lang === 'fr' ? 'fr' : 'en';
  const dataResources: ParsedDataResource[] = [];

  for (const resource of dataResourcesRaw) {
    // Some entries have the string 'null' (i.e. not the value null)
    // for all values in the resource object. In these cases, we can skip the resource.
    if (!resource.url) {
      continue;
    }

    const description = (resource.description?.[lang] ?? '').split(';');
    const name = resource.name?.[lang] ?? '';
    const url = resource.url;

    const type = description[0] ?? '';
    const format = description[1] ?? '';
    const languageRaw = (description[2] ?? '').replaceAll(',', ', ');
    const language = languageRaw.replaceAll(/eng|fra|zxx/gi, (x: string) => {
      const key = x.toLowerCase() as keyof LanguageReplacements;
      return languageReplacements[key]?.[translationLang] ?? x;
    });

    dataResources.push({
      id: url,
      name: name,
      type: type,
      format: format,
      languages: language,
      url: url,
    });
  }

  return dataResources;
}

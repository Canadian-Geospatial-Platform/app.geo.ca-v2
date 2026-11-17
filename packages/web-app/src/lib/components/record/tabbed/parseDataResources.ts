import type { DistributionOption } from '#lib/db/db-types.js';
import { getTranslations } from '#lib/i18n/index.js';
import { getAppLanguage } from '#lib/utils/language.js';

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
 * @param contentLang - Short language code ('en' or 'fr') used to select external bilingual fields.
 * @returns Rows with external names/URLs and localized ENG, FRA, and ZXX language labels.
 */
export function parseDataResources(dataResourcesRaw: DistributionOption[], contentLang: 'en' | 'fr'): ParsedDataResource[] {
  const t = getTranslations(getAppLanguage(contentLang));
  const languageReplacements: Record<string, string> = {
    eng: t.general.english,
    fra: t.general.french,
    zxx: t.general.notAvailable,
  };

  const dataResources: ParsedDataResource[] = [];

  for (const resource of dataResourcesRaw) {
    if (!resource.url) {
      continue;
    }

    const description = (resource.description?.[contentLang] ?? '').split(';');
    const name = resource.name?.[contentLang] ?? '';
    const url = resource.url;

    const type = description[0] ?? '';
    const format = description[1] ?? '';
    const languageRaw = (description[2] ?? '').replaceAll(',', ', ');
    const language = languageRaw.replaceAll(/eng|fra|zxx/gi, (x: string) => {
      return languageReplacements[x.toLowerCase()] ?? x;
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

import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import en from '#lib/i18n/en-ca.json';
import fr from '#lib/i18n/fr-ca.json';
import { formatTranslation, getComponentLabels, getTranslations } from '#lib/i18n/index.js';
import { getAppLanguage } from '#lib/utils/language.js';
import { formatNumber } from '#lib/utils/format-number.js';
import { load as loadSearch } from '../../routes/[lang]/map-browser/+page';
import { parseDataResources } from '#lib/components/record/tabbed/parseDataResources.js';

const { page } = vi.hoisted(() => ({ page: { data: { lang: 'en-ca' }, params: { lang: 'en-ca' } } }));
vi.mock('$app/state', () => ({ page }));

import Feedback from '#lib/components/feedback/feedback.svelte';

/** Describes catalogue structure and placeholder names without including translated text. */
function catalogueShape(value: unknown, path = ''): Record<string, string> {
  if (typeof value === 'string') {
    const parameters = [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    return { [path]: `string:${parameters.join(',')}` };
  }
  if (value === null || typeof value !== 'object') return { [path]: typeof value };
  return Object.assign(
    { [path]: Array.isArray(value) ? 'array' : 'object' },
    ...Object.entries(value).map(([key, child]) => catalogueShape(child, `${path}.${key}`))
  );
}

describe('centralized translations', () => {
  it('keeps every key, array entry, value type and placeholder in sync between languages', () => {
    expect(catalogueShape(fr)).toEqual(catalogueShape(en));
  });

  it('combines shared phrases and component-specific labels without English fallbacks', () => {
    const labels = getComponentLabels(getAppLanguage('FR'), 'favourites');
    expect(labels.cancel).toBe('Annuler');
    expect(labels.chooseSavedMap).toBe('Choisir une carte enregistrée');
    expect(getTranslations(getAppLanguage(null)).general.cancel).toBe('Cancel');
    expect(getComponentLabels('en-ca', 'favourites').cancel).toBe('Cancel');
    expect(labels.cancel).toBe('Annuler');
  });

  it('interpolates repeated parameters literally and rejects missing parameters', () => {
    expect(formatTranslation('{name} / {count} / {name}', { name: '$& <b>{count}</b>', count: 2 })).toBe(
      '$& <b>{count}</b> / 2 / $& <b>{count}</b>'
    );
    expect(() => formatTranslation('Page {page} of {pages}', { page: 1 })).toThrow('Missing translation parameter: pages');
  });

  it.each([
    ['en-ca', 'Tell us what you think!', 'Please send us your feedback'],
    ['fr-ca', 'Dites-nous ce que vous pensez!', 'Faites-nous part de vos commentaires'],
  ])('server-renders %s content using the request language', (appLang, heading, link) => {
    page.data.lang = appLang;
    page.params.lang = appLang;
    const { body } = render(Feedback);
    expect(body).toContain(heading);
    expect(body).toContain(link);
  });

  it('localizes resource language codes without changing external resource names or URLs', () => {
    const resources = [
      {
        name: { en: 'Water', fr: 'Eau' },
        description: { en: 'Dataset;JSON;ENG,fra,zxx', fr: 'Données;JSON;ENG,fra,zxx' },
        url: 'https://example.test/data',
        protocol: 'HTTPS',
      },
    ];
    expect(parseDataResources(resources, 'fr')).toMatchObject([
      { name: 'Eau', languages: 'Anglais, Français, Pas disponible', url: 'https://example.test/data' },
    ]);
  });
});

describe('localized search messages', () => {
  it.each([
    ['en-ca', 1234.5, '1,234.5'],
    ['en-ca', '1234.5', '1,234.5'],
    ['fr-ca', 1234.5, '1\u00a0234,5'],
    ['fr-ca', '1234.5', '1\u00a0234,5'],
  ] as const)('formats %s numbers independently of the runtime locale (%s)', (appLang, value, expected) => {
    expect(formatNumber(value, appLang)).toBe(expected);
  });

  it.each([
    ['en-ca', 0, '0 Datasets', '0 datasets'],
    ['en-ca', 1, '1 Dataset, Page 2 of 1', '1 dataset'],
    ['en-ca', 21, '21 Datasets, Page 2 of 3', '21 datasets'],
    ['en-ca', 12340, '12,340 Datasets, Page 2 of 1,234', '12,340 datasets'],
    ['fr-ca', 0, '0 Ensembles de données', '0 ensembles de données'],
    ['fr-ca', 1, '1 Ensemble de données, Page 2 sur 1', '1 ensemble de données'],
    ['fr-ca', 21, '21 Ensembles de données, Page 2 sur 3', '21 ensembles de données'],
    ['fr-ca', 12340, '12\u00a0340 Ensembles de données, Page 2 sur 1\u00a0234', '12\u00a0340 ensembles de données'],
  ] as const)('renders %s with %s results', async (appLang, count, pagination, resultCount) => {
    const event = {
      params: { lang: appLang },
      data: { totalHits: count, searchMode: 'classic' },
      url: new URL(`https://example.test/${appLang}/map-browser?page-number=1`),
    } as Parameters<typeof loadSearch>[0];
    const result = await loadSearch(event);
    expect(result?.numPageText).toBe(pagination);
    expect(result?.resultMessage).toContain(resultCount);
    expect(result?.sortOptions).toEqual(getTranslations(appLang).components.searchResults.sorting.classic);
    expect(result).not.toHaveProperty('t');
    expect(result).not.toHaveProperty('filters');
    expect(result).not.toHaveProperty('categories');
  });

  it.each(['en-ca', 'fr-ca'] as const)('preserves search input as text in %s keyword messages', async (appLang) => {
    const url = new URL(`https://example.test/${appLang}/map-browser`);
    const term = '<b>{count}</b> $&';
    url.searchParams.set('search-terms', term);
    const result = await loadSearch({
      params: { lang: appLang },
      data: { totalHits: 1, searchMode: 'semantic' },
      url,
    } as Parameters<typeof loadSearch>[0]);
    expect(result?.resultMessage).toContain(term);
    expect(result?.sortOptions).toEqual(getTranslations(appLang).components.searchResults.sorting.semantic);
  });
});

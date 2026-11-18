import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppLanguage } from '#lib/utils/language.js';

const mocks = vi.hoisted(() => ({
  setLanguage: vi.fn<(appLang: AppLanguage) => void>(),
  url: new URL('https://example.test/en-ca/map-browser'),
}));

vi.mock('$app/state', async () => {
  const { fromStore, writable } = await import('svelte/store');
  const language = writable<AppLanguage>('en-ca');
  const current = fromStore(language);
  mocks.setLanguage.mockImplementation((appLang) => language.set(appLang));
  return {
    page: {
      get url() {
        return mocks.url;
      },
      get data() {
        return { lang: current.current };
      },
      get params() {
        return { lang: current.current };
      },
    },
  };
});

import Feedback from '#lib/components/feedback/feedback.svelte';
import SelectCustomized from '#lib/components/select-customized/select-customized.svelte';
import CategoryOfInterest from '#lib/components/search-results/filters/category-of-interest.svelte';
import { tempCategoryOfInterest, updateTempCategoryOfInterest } from '#lib/components/search-results/store.js';
import { getTranslations } from '#lib/i18n/index.js';

afterEach(() => {
  cleanup();
  mocks.setLanguage('en-ca');
  mocks.url = new URL('https://example.test/en-ca/map-browser');
  updateTempCategoryOfInterest(null);
  vi.restoreAllMocks();
});

describe('category selection lifecycle', () => {
  const categoriesTranslations = getTranslations('en-ca').components.searchResults.categories;

  it.each(['', '?category-of-interest=invalid'])('clears stale store selections for URL suffix %s', async (query) => {
    updateTempCategoryOfInterest(categoriesTranslations[0].value);
    mocks.url = new URL(`https://example.test/en-ca/map-browser${query}`);
    const { component } = render(CategoryOfInterest);

    await waitFor(() => expect(component.getValue()).toBeNull());
    expect(screen.getByText(getTranslations('en-ca').components.searchResults.labels.categorySelectDefault)).toBeTruthy();
  });

  it('updates the displayed selection for store changes, clearing and URL resets', async () => {
    mocks.url.searchParams.set('category-of-interest', categoriesTranslations[0].value);
    const { component } = render(CategoryOfInterest);
    expect(screen.getByText(categoriesTranslations[0].label)).toBeTruthy();

    updateTempCategoryOfInterest(categoriesTranslations[1].value);
    expect(await screen.findByText(categoriesTranslations[1].label)).toBeTruthy();
    expect(component.getValue()).toBe(categoriesTranslations[1].value);

    updateTempCategoryOfInterest(null);
    await waitFor(() => expect(screen.queryByText(categoriesTranslations[1].label)).toBeNull());
    expect(component.getValue()).toBeNull();

    component.resetFilters();
    expect(await screen.findByText(categoriesTranslations[0].label)).toBeTruthy();
    expect(component.getValue()).toBe(categoriesTranslations[0].value);
  });

  it('unsubscribes from the shared store when unmounted', () => {
    const subscribe = tempCategoryOfInterest.subscribe;
    const unsubscribe = vi.fn<() => void>();
    vi.spyOn(tempCategoryOfInterest, 'subscribe').mockImplementation((...args) => {
      const stop = subscribe(...args);
      unsubscribe.mockImplementation(stop);
      return unsubscribe;
    });
    const { unmount } = render(CategoryOfInterest);
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

describe('reactive translations', () => {
  it('updates heading, paragraph and link when the route language changes without remounting', async () => {
    render(Feedback);
    expect(screen.getByRole('heading', { name: 'Tell us what you think!' })).toBeTruthy();

    mocks.setLanguage('fr-ca');
    expect(await screen.findByRole('heading', { name: 'Dites-nous ce que vous pensez!' })).toBeTruthy();
    expect(screen.getByText(/GEO.ca s’engage/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Faites-nous part de vos commentaires' }).getAttribute('href')).toBe(
      'mailto:geoinfo@nrcan-rncan.gc.ca?subject=app.geo.ca'
    );
    expect(screen.queryByText('Please send us your feedback')).toBeNull();

    mocks.setLanguage('en-ca');
    expect(await screen.findByRole('heading', { name: 'Tell us what you think!' })).toBeTruthy();
  });

  it('updates a selected option label without changing the selected value', async () => {
    const selected = { value: 'cancel', label: 'Cancel' };
    const selectedChange = vi.fn();
    const { rerender } = render(SelectCustomized, { optionsData: [selected], selected, selectedChange });
    expect(screen.getByText('Cancel')).toBeTruthy();

    mocks.setLanguage('fr-ca');
    await rerender({ optionsData: [{ value: 'cancel', label: 'Annuler' }], selected, selectedChange });

    expect(screen.getByText('Annuler')).toBeTruthy();
    expect(screen.queryByText('Cancel')).toBeNull();
    expect(screen.getByRole('button', { name: 'Selectionner une option' })).toBeTruthy();
    expect(selectedChange).not.toHaveBeenCalled();
  });
});

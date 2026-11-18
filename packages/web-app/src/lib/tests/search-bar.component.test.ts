import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  page: {
    data: { lang: 'en-ca' },
    params: { lang: 'en-ca' },
    url: new URL('https://example.test/en-ca/map-browser'),
  },
  goto: vi.fn(),
}));

vi.mock('$app/state', () => ({ page: mocks.page, navigating: { type: null } }));
vi.mock('$app/navigation', () => ({ goto: mocks.goto }));

import SearchBar from '#lib/components/search-results/search-bar.svelte';

afterEach(() => {
  cleanup();
  mocks.goto.mockReset();
  vi.unstubAllGlobals();
});

describe('search bar', () => {
  it('uses the normalized language for the filter close button label', () => {
    mocks.page.data.lang = 'FR-CA';
    mocks.page.params.lang = 'fr-ca';
    mocks.page.url = new URL('https://example.test/fr-ca/map-browser');
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    );
    render(SearchBar);

    expect(screen.getByRole('button', { name: 'Fermer', hidden: true })).toBeTruthy();
  });

  describe.each(['en-ca', 'fr-ca'])('%s', (appLang) => {
    it.each(['Enter', 'button'])('submits using %s with supported navigation options', async (trigger) => {
      mocks.page.data.lang = appLang;
      mocks.page.params.lang = appLang;
      mocks.page.url = new URL(
        `https://example.test/${appLang}/map-browser?search-terms=old&page-number=3&org=NRCan&type=dataset&sort=relevancy`
      );
      mocks.goto.mockResolvedValue(undefined);
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: false }))
      );
      render(SearchBar);
      const input = screen.getByRole('textbox');
      await fireEvent.input(input, { target: { value: 'water & ice' } });

      if (trigger === 'Enter') {
        await fireEvent.keyDown(input, { key: 'Enter' });
      } else {
        await fireEvent.click(screen.getByRole('button', { name: appLang === 'fr-ca' ? 'Recherche' : 'Search' }));
      }

      const expected = new URL(mocks.page.url);
      expected.searchParams.set('search-terms', 'water & ice');
      expected.searchParams.set('page-number', '0');
      expect(mocks.goto).toHaveBeenCalledExactlyOnceWith(`${expected.pathname}${expected.search}`, { replace: true, reset: false });
    });
  });
});

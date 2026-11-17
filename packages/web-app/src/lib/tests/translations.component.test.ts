import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppLanguage } from '#lib/utils/language.js';

const mocks = vi.hoisted(() => ({ setLanguage: vi.fn<(appLang: AppLanguage) => void>() }));

vi.mock('$app/state', async () => {
  const { fromStore, writable } = await import('svelte/store');
  const language = writable<AppLanguage>('en-ca');
  const current = fromStore(language);
  mocks.setLanguage.mockImplementation((appLang) => language.set(appLang));
  return {
    page: {
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

afterEach(() => {
  cleanup();
  mocks.setLanguage('en-ca');
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

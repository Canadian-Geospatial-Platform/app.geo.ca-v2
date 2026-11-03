import { describe, expect, it } from 'vitest';
import { load } from '../../routes/[lang]/+page.server';

function expectRedirect(lang: string, location: string): void {
  try {
    load({ params: { lang } } as unknown as Parameters<typeof load>[0]);
    throw new Error('Expected redirect');
  } catch (error) {
    expect(error).toMatchObject({ status: 307, location });
  }
}

describe('GET /[lang]', () => {
  it('redirects English root to its map browser', () => {
    expectRedirect('en-ca', '/en-ca/map-browser');
  });

  it('redirects French root to its map browser', () => {
    expectRedirect('fr-ca', '/fr-ca/map-browser');
  });
});

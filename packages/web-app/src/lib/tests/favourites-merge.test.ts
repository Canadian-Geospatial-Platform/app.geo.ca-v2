/**
 * Test coverage: Unit tests for merging guest-captured favourites into the signed-in profile after sign-in.
 */
import type { Cookies } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/db/user', () => ({
  getUserData: vi.fn(),
  putUserData: vi.fn(),
}));

import { getUserData, putUserData } from '$lib/db/user';
import { mergeGuestFavourites } from '$lib/db/favourites';

const mockedGetUserData = vi.mocked(getUserData);
const mockedPutUserData = vi.mocked(putUserData);

type CookieHarness = {
  cookies: Cookies;
  deletedNames: string[];
};

/**
 * Creates a cookie test harness that records deleted cookie names.
 *
 * @param initialValues - Initial cookie values.
 * @returns Cookie harness with cookies test double and deletion log.
 */
function createCookieHarness(initialValues: Record<string, string> = {}): CookieHarness {
  const values = new Map<string, string>(Object.entries(initialValues));
  const deletedNames: string[] = [];

  const cookies = {
    get(name: string): string | undefined {
      return values.get(name);
    },
    set(name: string, value: string): void {
      values.set(name, value);
    },
    delete(name: string): void {
      deletedNames.push(name);
      values.delete(name);
    },
  } as unknown as Cookies;

  return { cookies, deletedNames };
}

describe('mergeGuestFavourites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges guest favourites with server favourites and clears cookie when persisted', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-123',
        favourites: ['dataset-a', 'dataset-b'],
        mapConfigs: [],
      },
    });
    mockedPutUserData.mockResolvedValue({ ok: true });

    const { cookies, deletedNames } = createCookieHarness({
      guest_favourites: encodeURIComponent('dataset-b, dataset-c, dataset-d, dataset-c'),
    });

    await mergeGuestFavourites(cookies);

    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
    expect(mockedPutUserData.mock.calls[0][0]).toEqual({
      uuid: 'user-123',
      favourites: ['dataset-a', 'dataset-b', 'dataset-c', 'dataset-d'],
      mapConfigs: [],
    });
    expect(deletedNames).toContain('guest_favourites');
  });

  it('does not clear guest favourites cookie when persistence fails', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-123',
        favourites: ['dataset-a'],
        mapConfigs: [],
      },
    });
    mockedPutUserData.mockResolvedValue({ ok: false });

    const { cookies, deletedNames } = createCookieHarness({
      guest_favourites: 'dataset-z',
    });

    await mergeGuestFavourites(cookies);

    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
    expect(deletedNames).not.toContain('guest_favourites');
  });

  it('does nothing when there is no guest favourites cookie', async () => {
    const { cookies } = createCookieHarness();

    await mergeGuestFavourites(cookies);

    expect(mockedGetUserData).not.toHaveBeenCalled();
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('deletes the cookie without a user lookup when the guest list is empty after normalization', async () => {
    const { cookies, deletedNames } = createCookieHarness({
      guest_favourites: ' , , ',
    });

    await mergeGuestFavourites(cookies);

    expect(mockedGetUserData).not.toHaveBeenCalled();
    expect(mockedPutUserData).not.toHaveBeenCalled();
    expect(deletedNames).toContain('guest_favourites');
  });

  it('leaves the guest cookie in place when the user has no uuid', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'missing',
      Item: {
        uuid: null,
        favourites: [],
        mapConfigs: [],
      },
    });

    const { cookies, deletedNames } = createCookieHarness({
      guest_favourites: 'dataset-a',
    });

    await mergeGuestFavourites(cookies);

    expect(mockedPutUserData).not.toHaveBeenCalled();
    expect(deletedNames).not.toContain('guest_favourites');
  });

  it('falls back to the raw cookie value when it fails to decode', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-123',
        favourites: [],
        mapConfigs: [],
      },
    });
    mockedPutUserData.mockResolvedValue({ ok: true });

    // "%zz" is not a valid escape sequence, so decodeURIComponent throws and the raw value is used.
    const { cookies } = createCookieHarness({
      guest_favourites: 'dataset-a,50%zzoff',
    });

    await mergeGuestFavourites(cookies);

    expect(mockedPutUserData.mock.calls[0][0]).toEqual({
      uuid: 'user-123',
      favourites: ['dataset-a', '50%zzoff'],
      mapConfigs: [],
    });
  });

  it('persists the guest list unchanged when there are no existing server favourites', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-123',
        favourites: [],
        mapConfigs: [],
      },
    });
    mockedPutUserData.mockResolvedValue({ ok: true });

    const { cookies, deletedNames } = createCookieHarness({
      guest_favourites: 'dataset-a,dataset-b',
    });

    await mergeGuestFavourites(cookies);

    expect(mockedPutUserData.mock.calls[0][0]).toEqual({
      uuid: 'user-123',
      favourites: ['dataset-a', 'dataset-b'],
      mapConfigs: [],
    });
    expect(deletedNames).toContain('guest_favourites');
  });
});

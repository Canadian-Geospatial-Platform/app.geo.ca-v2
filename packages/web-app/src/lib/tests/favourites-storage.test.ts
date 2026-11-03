/**
 * Test coverage: Unit tests for local favourites storage and initial source resolution.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  FAVOURITES_STORAGE_KEY,
  getStoredFavourites,
  normalizeFavourites,
  resolveInitialFavourites,
} from '#lib/utils/favourites-storage.js';

describe('normalizeFavourites', () => {
  it('trims IDs, removes empty values, and preserves only the first occurrence', () => {
    expect(normalizeFavourites([' dataset-a ', '', 'dataset-b', 'dataset-a', '   '])).toEqual(['dataset-a', 'dataset-b']);
  });
});

describe('getStoredFavourites', () => {
  it.each([null, ''])('returns an empty list when storage contains %s', (storedValue) => {
    const getItem = vi.fn().mockReturnValue(storedValue);

    expect(getStoredFavourites({ getItem } as unknown as Storage)).toEqual([]);
    expect(getItem).toHaveBeenCalledWith(FAVOURITES_STORAGE_KEY);
  });

  it('normalizes comma-separated IDs from storage', () => {
    const getItem = vi.fn().mockReturnValue(' dataset-a, ,dataset-b,dataset-a ');

    expect(getStoredFavourites({ getItem } as unknown as Storage)).toEqual(['dataset-a', 'dataset-b']);
  });
});

describe('resolveInitialFavourites', () => {
  it('prefers normalized server favourites for signed-in users and syncs storage', () => {
    expect(resolveInitialFavourites(true, [' server-a ', '', 'server-a'], ['local-a'])).toEqual({
      favourites: ['server-a'],
      shouldSyncLocalStorage: true,
    });
  });

  it('falls back to local favourites when a signed-in user has no server favourites', () => {
    expect(resolveInitialFavourites(true, [], [' local-a ', 'local-a'])).toEqual({
      favourites: ['local-a'],
      shouldSyncLocalStorage: false,
    });
  });

  it('synchronizes an empty list when a signed-in user has no favourites in either source', () => {
    expect(resolveInitialFavourites(true, [], [])).toEqual({ favourites: [], shouldSyncLocalStorage: true });
  });

  it('uses local favourites for guests without requesting a storage sync', () => {
    expect(resolveInitialFavourites(false, [], [' local-a ', 'local-a'])).toEqual({
      favourites: ['local-a'],
      shouldSyncLocalStorage: false,
    });
  });

  it('keeps the empty guest state when local storage has no favourites', () => {
    expect(resolveInitialFavourites(false, [], [])).toEqual({ favourites: [], shouldSyncLocalStorage: false });
  });
});

export const FAVOURITES_STORAGE_KEY = 'FavouritesResources';

/**
 * Normalizes favourite IDs by trimming, removing empties, and deduplicating.
 *
 * @param values - Candidate favourite IDs.
 * @returns Cleaned list of favourite IDs.
 */
function normalizeFavourites(values: string[]): string[] {
  return Array.from(new Set(values.map((id) => id.trim()).filter((id) => id.length > 0)));
}

/**
 * Reads favourites from browser storage.
 *
 * @param storage - Browser storage implementation.
 * @returns Normalized favourite IDs from storage.
 */
export function getStoredFavourites(storage: Storage): string[] {
  const stored = storage.getItem(FAVOURITES_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  return normalizeFavourites(stored.split(','));
}

/**
 * Resolves initial favourites source for a page.
 *
 * Signed-in users prefer server favourites. If server favourites are empty,
 * local storage is used as a fallback to prevent losing locally captured data.
 *
 * @param signedIn - Whether user is currently signed in.
 * @param serverFavourites - Favourites loaded from server-rendered data.
 * @param storedFavourites - Favourites read from local storage.
 * @returns Chosen favourites and whether local storage should be synchronized.
 */
export function resolveInitialFavourites(
  signedIn: boolean,
  serverFavourites: string[],
  storedFavourites: string[]
): { favourites: string[]; shouldSyncLocalStorage: boolean } {
  const normalizedServerFavourites = normalizeFavourites(serverFavourites);
  const normalizedStoredFavourites = normalizeFavourites(storedFavourites);
  let favourites = normalizedServerFavourites;
  let shouldSyncLocalStorage = false;

  if (signedIn) {
    if (normalizedServerFavourites.length > 0) {
      favourites = normalizedServerFavourites;
      shouldSyncLocalStorage = true;
    } else if (normalizedStoredFavourites.length > 0) {
      favourites = normalizedStoredFavourites;
      shouldSyncLocalStorage = false;
    } else {
      favourites = [];
      shouldSyncLocalStorage = true;
    }
  } else if (normalizedStoredFavourites.length > 0) {
    favourites = normalizedStoredFavourites;
  }

  return { favourites, shouldSyncLocalStorage };
}

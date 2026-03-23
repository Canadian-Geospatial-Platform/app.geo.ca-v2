import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CategoryOfInterest } from '$lib/components/search-results/filters/filter-types';

export const tempCategoryOfInterest: Writable<CategoryOfInterest | null> = writable(null);

/**
 * Updates the temporary category of interest.
 *
 * @param category - The interest category.
 */
export function updateTempCategoryOfInterest(category: CategoryOfInterest | null): void {
  tempCategoryOfInterest.set(category);
}

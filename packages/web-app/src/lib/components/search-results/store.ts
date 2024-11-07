import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CategoryOfInterest } from '$lib/components/search-results/filters/filter-types';

export const paginationNumber: Writable<number> = writable(0);
export const tempCategoryOfInterest: Writable<CategoryOfInterest|null> = writable(null);

export function updatePaginationNumber(pageNumber) {
  paginationNumber.set(pageNumber);
}

export function updateTempCategoryOfInterest(category: CategoryOfInterest|null) {
  tempCategoryOfInterest.set(category);
}

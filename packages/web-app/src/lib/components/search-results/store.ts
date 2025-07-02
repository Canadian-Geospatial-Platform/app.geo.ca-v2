import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { CategoryOfInterest } from '$lib/components/search-results/filters/filter-types';

export const tempCategoryOfInterest: Writable<CategoryOfInterest | null> = writable(null);

export function updateTempCategoryOfInterest(category: CategoryOfInterest | null) {
	tempCategoryOfInterest.set(category);
}

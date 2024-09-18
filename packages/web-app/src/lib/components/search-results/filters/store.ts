import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type { BoundingCoordinates, TimeRange } from '$lib/components/search-results/filters/filter-types';

export const boundingBox: Writable<BoundingCoordinates|null> = writable(null);
export const categoryOfInterest: Writable<string|null> = writable(null);
export const dateRange: Writable<TimeRange|null> = writable(null);

export function updateCategoryOfInterest(category: string|null) {
	categoryOfInterest.set(category);
}
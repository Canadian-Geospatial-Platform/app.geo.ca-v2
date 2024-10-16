import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import type {
  BoundingCoordinates,
  CategoryOfInterest,
  DateRange,
  Foundational,
  Org,
  Theme,
  TypeFilter
} from '$lib/components/search-results/filters/filter-types';

export const boundingBox: Writable<BoundingCoordinates|null> = writable(null);
export const categoryOfInterest: Writable<CategoryOfInterest|null> = writable(null);
export const dateRange: Writable<DateRange|null> = writable(null);
export const foundational: Writable<Foundational|null> = writable(null);
export const org: Writable<Org|null> = writable(null);
export const theme: Writable<Theme|null> = writable(null);
export const typeFilter: Writable<TypeFilter|null> = writable(null);

export const tempCategoryOfInterest: Writable<CategoryOfInterest|null> = writable(null);

export function updateBoundingBox(bbox: BoundingCoordinates|null) {
  boundingBox.set(bbox);
}

export function updateCategoryOfInterest(category: CategoryOfInterest|null) {
  categoryOfInterest.set(category);
}

export function updateDateRange(dates: DateRange|null) {
  dateRange.set(dates);
}

export function updateFoundational(foundation: Foundational|null) {
  foundational.set(foundation);
}

export function updateOrg(organization: Org|null) {
  org.set(organization);
}

export function updateTheme(themes: Theme|null) {
  theme.set(themes);
}

export function updateTypeFilter(types: TypeFilter|null) {
  typeFilter.set(types);
}

export function updateTempCategoryOfInterest(category: CategoryOfInterest|null) {
  tempCategoryOfInterest.set(category);
}

export function clearAll() {
  updateBoundingBox(null);
  updateCategoryOfInterest(null);
  updateDateRange(null);
  updateFoundational(null);
  updateOrg(null);
  updateTheme(null);
  updateTypeFilter(null);
  updateTempCategoryOfInterest(null);
}

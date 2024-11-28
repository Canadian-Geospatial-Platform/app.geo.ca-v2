import type * as Kit from '@sveltejs/kit';

export type FilterItem = {
  label: string,
  value: string,
}

export type Filter = {
  section: string,
  label: string,
  filterList: Array<FilterItem>,
};

/********* Types for the filter store **********/

export type CategoryOfInterest = string | null;

import type * as Kit from '@sveltejs/kit';

export type FilterItem = {
  label: string,
  value: string
}

export type Filter = {
  section: string,
  label: string,
  filterList: Array<FilterItem>
};

export type BoundingCoordinates = {
  north: number,
  east: number,
  south: number,
  west: number
}

export type TimeRange = {
  start: string,
  end: string
}
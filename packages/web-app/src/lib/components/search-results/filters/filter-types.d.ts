export type FilterItem = {
  label: string;
  value: string;
  subCategory?: string;
};

export type Filter = {
  section: string;
  label: string;
  filterList: Array<FilterItem>;
};

export type BBox = {
  north: string;
  east: string;
  south: string;
  west: string;
};

export type DateRangeItem = {
  begin: string;
  end: string;
};

/********* Types for the filter store **********/

export type CategoryOfInterest = string | null;

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

export type BoundingCoordinates = {
  north: number,
  east: number,
  south: number,
  west: number,
};

export type CategoryOfInterest = string | null;

export type DateRange = {
  begin: string,
  end: string,
};

export type Foundational = {
  foundational: boolean,
};

export type Org = {
  "agriculture-and-agri-food-canada": boolean,
  "canadian-geospatial-data-infrastructure-web-harvester": boolean,
  "canadian-heritage": boolean,
  "canadian-northern-economic-development-agency": boolean,
  "canadian-nuclear-safety-commission": boolean,
  "canadian-space-agency": boolean,
  "elections-canada": boolean,
  "employment-and-social-development-canada": boolean,
  "environment-and-climate-change-canada": boolean,
  "fisheries-and-oceans-canada": boolean,
  "government-and-municipalities-of-québec": boolean,
  "government-of-alberta": boolean,
  "government-of-british-columbia": boolean,
  "government-of-manitoba": boolean,
  "government-of-new-brunswick": boolean,
  "government-of-newfoundland-and-labrador": boolean,
  "government-of-northwest-territories": boolean,
  "government-of-nova-scotia": boolean,
  "government-of-nunavut": boolean,
  "government-of-ontario": boolean,
  "government-of-prince-edward-island": boolean,
  "government-of-saskatchewan": boolean,
  "government-of-yukon": boolean,
  "impact-assessment-agency-of-canada": boolean,
  "indigenous-services-canada": boolean,
  "national-defence": boolean,
  "natural-resources-canada": boolean,
  "parks-canada": boolean,
  "public-health-agency-of-canada": boolean,
  "statistics-canada": boolean,
  "transport-canada": boolean,
};

export type Theme = {
  administration: boolean,
  economy: boolean,
  emergency: boolean,
  environment: boolean,
  imagery: boolean,
  infrastructure: boolean,
  legal: boolean,
  science: boolean,
  society: boolean,
};

export type TypeFilter = {
  api: boolean,
  application: boolean,
  collection: boolean,
  community: boolean,
  dataset: boolean,
  service: boolean,
};

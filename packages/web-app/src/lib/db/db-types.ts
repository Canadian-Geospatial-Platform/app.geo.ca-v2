// Bilingual text type
export interface BilingualText {
  en: string | null;
  fr: string | null;
}

// Temporal extent
export interface TemporalExtent {
  begin: string;
  end: string;
}

// Locale information
export interface Locale {
  language: string;
  country: string;
  encoding: string;
}

// Graphic overview
export interface GraphicOverview {
  overviewFileName: string | null;
  overviewFileDescription: string | null;
  overviewFileTupe: string | null; // Note: typo in source data "Tupe" instead of "Type"
  overviewFileType?: string | null; // Correctly spelled variant
}

// Online resource
export interface OnlineResource {
  onlineresource: string | null;
  onlineresource_name: string | null;
  onlineresource_protocol: string | null;
  onlineresource_description: string | null;
}

// Alternative online resource (with different casing)
export interface OnlineResourceAlt {
  onlineResource: string | null;
  onlineResource_Name: string | null;
  onlineResource_Protocol: string | null;
  onlineResource_Description: string | null;
}

// Contact information (used for contact, distributor, cited)
export interface ContactInfo {
  individual: string | null;
  position: BilingualText;
  organisation: BilingualText;
  telephone: BilingualText;
  fax: string | null;
  address: BilingualText;
  city: string | null;
  pt: BilingualText;
  postalcode: string | null;
  country: BilingualText;
  email: BilingualText;
  onlineresource?: OnlineResource;
  onlineResource?: OnlineResourceAlt;
  hoursOfService: string | null;
  role: string;
}

// Distribution option
export interface DistributionOption {
  url: string | null;
  protocol: string | null;
  name: BilingualText;
  description: BilingualText;
}

// Similarity record
export interface SimilarityRecord {
  sim: string;
  features_properties_id: string;
  features_properties_title_en: string;
  features_properties_title_fr: string;
}

// Main record type
export interface GeospatialRecord {
  id: string;
  coordinates: string; // JSON-encoded coordinate array
  title_en: string;
  title_fr: string;
  title?: string | null; // Optional, not in all records
  description: string;
  published: string | null; // ISO date string or null (null for collection-type records)
  keywords: string;
  topicCategory: string;
  created: string | null; // ISO date string or null (null for collection-type records)
  spatialRepresentation: string;
  type: string;
  temporalExtent: TemporalExtent;
  refSys: string | null;
  refSys_version: string | null;
  status: string;
  maintenance: string;
  metadataStandard: string | null;
  metadataStandardVersion: string | null;
  distributionFormat_name: string | null;
  distributionFormat_format: string | null;
  useLimits: string;
  accessConstraints: string | null;
  otherConstraints: string | null;
  dateStamp: string | null; // ISO date string or null
  dataSetURI: string | null;
  locale: Locale | null;
  language: string | null;
  characterSet: string | null;
  environmentDescription: string | null;
  supplementalInformation: string | null;
  graphicOverview: GraphicOverview[];
  contact: ContactInfo[];
  distributor: (ContactInfo | null)[];
  credits: any[]; // Can include null values
  cited: (ContactInfo | null)[];
  plugins: string; // JSON-encoded array
  options: DistributionOption[];
  similarity: SimilarityRecord[];
  sourceSystemName: string | null;
  eoCollection: string | null;
  eoFilters: any[]; // Can include null values
  formats?: string[]; // Optional, added post-fetch
  hasMapLayer?: boolean; // Optional, added post-fetch
  features?: any; // Optional, added for collection-type records
}

// JWT Token payload
export interface TokenPayload {
  username: string;
  [key: string]: any; // Allow other JWT claims
}

// JWT Token result
export interface TokenResponse {
  ok: boolean;
  value?: TokenPayload | null;
}

// User data structure
export interface UserData {
  uuid: string | null;
  favourites: string[]; // Array of record UUIDs
}

// User info
export interface UserInfo {
  Item: UserData;
}

export type FavouritesRow = {
  id: string;
  name: string;
  url: string;
};

// GeospatialRecord with additional fields added by the API endpoint
export type FavouritesRecord = GeospatialRecord & {
  formats: string[];
  hasMapLayer: boolean;
  [key: `title_${string}`]: string;
};

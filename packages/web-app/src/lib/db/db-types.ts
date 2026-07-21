/**
 * Bilingual text value used across record fields.
 */
export interface BilingualText {
  en: string | null;
  fr: string | null;
}

/**
 * Temporal range for a record.
 */
export interface TemporalExtent {
  begin: string;
  end: string;
}

/**
 * Locale metadata for a record.
 */
export interface Locale {
  language: string;
  country: string;
  encoding: string;
}

/**
 * Graphic overview metadata.
 */
export interface GraphicOverview {
  overviewFileName: string | null;
  overviewFileDescription: string | null;
  overviewFileTupe: string | null; // Note: typo in source data "Tupe" instead of "Type"
  overviewFileType?: string | null; // Correctly spelled variant
}

/**
 * Online resource metadata variant with lowercase keys.
 */
export interface OnlineResource {
  onlineresource: string | null;
  onlineresource_name: string | null;
  onlineresource_protocol: string | null;
  onlineresource_description: string | null;
}

/**
 * Online resource metadata variant with mixed-case keys.
 */
export interface OnlineResourceAlt {
  onlineResource: string | null;
  onlineResource_Name: string | null;
  onlineResource_Protocol: string | null;
  onlineResource_Description: string | null;
}

/**
 * Contact metadata used in contact, distributor, and cited sections.
 */
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

/**
 * Distribution option metadata.
 */
export interface DistributionOption {
  url: string | null;
  protocol: string | null;
  name: BilingualText;
  description: BilingualText;
}

/**
 * Similarity result entry returned by the source system.
 */
export interface SimilarityRecord {
  sim: string;
  features_properties_id: string;
  features_properties_title_en: string;
  features_properties_title_fr: string;
}

/**
 * Primary geospatial record shape consumed by the application.
 */
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
  credits: unknown[]; // Can include null values
  cited: (ContactInfo | null)[];
  plugins: string; // JSON-encoded array
  options: DistributionOption[];
  similarity: SimilarityRecord[];
  sourceSystemName: string | null;
  eoCollection: string | null;
  eoFilters: unknown[]; // Can include null values
  formats?: string[]; // Optional, added post-fetch
  hasMapLayer?: boolean; // Optional, added post-fetch
  features?: Record<string, unknown>; // Optional, added for collection-type records
}

/**
 * Minimal verified JWT payload claims used by auth and user lookups.
 */
export interface TokenPayload {
  sub?: string;
  username?: string;
  sid?: string;
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown; // Allow other JWT claims
}

/**
 * Result of parsing and verifying an ID token from cookies.
 */
export interface TokenResponse {
  ok: boolean;
  value?: TokenPayload | null;
  /** True when stale auth cookies were detected and cleared (e.g. id_token expired but refresh_token remained). */
  staleCleared?: boolean;
}

/**
 * Persisted user profile data stored in DynamoDB.
 */
export interface UserData {
  uuid: string | null;
  favourites: string[]; // Array of record UUIDs
  mapConfigs?: MapConfigFavourite[];
  authRevokedAt?: number | null;
  lastBackChannelLogoutJti?: string | null;
  lastBackChannelLogoutJtiSeenAt?: number | null;
}

/**
 * Status returned alongside user data reads.
 *
 * - `anonymous`: no authenticated user context is available.
 * - `ok`: data was loaded from storage.
 * - `missing`: authenticated user exists but no row exists yet.
 * - `unavailable`: user row could not be read (storage/config/runtime issue).
 */
export type UserDataLoadStatus = 'anonymous' | 'ok' | 'missing' | 'unavailable';

/**
 * Named saved map configuration linked to a user.
 */
export interface MapConfigFavourite {
  id: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
}

/**
 * Wrapper used by DynamoDB document responses.
 */
export interface UserInfo {
  Item: UserData;
  status: UserDataLoadStatus;
  /** True when the user had stale auth cookies that were cleared during this request (session expired). */
  sessionExpired?: boolean;
}

/**
 * Row shape used by favourites table rendering.
 */
export type FavouritesRow = Record<string, string | boolean> & {
  id: string;
  name: string;
  url?: string;
  disableCheckbox?: boolean;
};

/**
 * Geospatial record extended with fields added by favourites endpoints.
 */
export type FavouritesRecord = GeospatialRecord & {
  formats: string[];
  hasMapLayer: boolean;
  [key: `title_${string}`]: string;
};

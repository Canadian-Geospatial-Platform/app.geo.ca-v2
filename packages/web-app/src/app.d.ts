// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Filter } from '$lib/components/search-results/filters/filter-types';
import type { ContactInfo, GeospatialRecord, SimilarityRecord } from '$lib/db/db-types';

// SemanticSearch results have coordinates as number[][] instead of string
type SemanticResultWithCoordinates = Omit<GeospatialRecord, 'coordinates'> & {
  coordinates: number[][];
};

type LinkItem = {
  title: string;
  href: string;
};

type FooterSection = {
  title?: string;
  links?: LinkItem[];
};

type FooterLinksData = Record<string, FooterSection>;

type HeaderMenuOption = {
  colTitle?: string;
  links: HeaderNavItem[];
};

type HeaderNavItem = {
  title?: string;
  href?: string;
  options?: HeaderMenuOption[];
  [key: string]: unknown;
};

type HeaderNavItems = Record<string, HeaderNavItem>;

type TranslationMap = Record<string, string>;

type CategoryOption = {
  value: string;
  label: string;
};

type SortOption = {
  value: string;
  label: string;
};

type FiltersPayload = {
  filters: Filter[];
};

type AnalyticsSummary = {
  total?: string;
  organization?: string;
  '30'?: string;
  [key: string]: string | undefined;
};

type RelatedRecord = {
  id: string;
  description_en: string;
  description_fr: string;
  type: string;
};

type RecordDetail = Omit<GeospatialRecord, 'coordinates' | 'keywords' | 'topicCategory'> & {
  coordinates: number[][];
  keywords: string[];
  topicCategory: string[];
  distributor: (ContactInfo | null)[];
  bbox?: {
    north: number;
    east: number;
    south: number;
    west: number;
  };
  [key: string]: unknown;
};

type AnalyticResponse = {
  '30'?: string;
  all?: string;
};

declare global {
  namespace App {
    interface Error {
      message: string;
      status?: number;
    }
    // interface Locals {}
    interface PageData {
      // Common properties (from layout.server.ts)
      lang: 'en-ca' | 'fr-ca';
      footerLinks: FooterLinksData;
      legalData: { [key: string]: string };
      navitems: HeaderNavItems;
      headerTranslations: TranslationMap;
      shareTranslations: TranslationMap;

      // User data
      userData?: {
        uuid: string | null;
        favourites?: string[];
        mapCart?: string[];
      };

      // SEO/Meta properties
      canonicalUrl?: string;
      alternateUrl?: string;
      alternateLang?: string;
      metaDescription?: string;

      // Translation properties
      t?: TranslationMap; // Component translations
      t_title_1?: { text: string; href: string };
      t_title_2?: { text: string; href: string };
      t_title_3?: { text: string; href: string };

      // Search/Browse properties (map-browser)
      results?: GeospatialRecord[] | SemanticResultWithCoordinates[];
      total?: number;
      start?: number;
      end?: number;
      analytics?: AnalyticsSummary;
      searchMode?: 'semantic' | 'classic';
      totalHits?: number;
      filters?: FiltersPayload;
      categories?: CategoryOption[];
      sortOptions?: SortOption[];
      numPageText?: string;
      resultMessage?: string;

      // Record detail properties (record/[uuid])
      uuid?: string;
      item_v2?: RecordDetail;
      similar?: SimilarityRecord[];
      related?: RelatedRecord[];
      analyticRes?: AnalyticResponse;
      coordinates?: number[][]; // Normalized coordinates for map display
    }
    // interface Platform {}
  }
}

export {};

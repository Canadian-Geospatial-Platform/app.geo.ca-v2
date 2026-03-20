// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
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
      footerLinks?: any;
      legalData?: { [key: string]: string };
      navitems?: any;
      headerTranslations?: any;
      shareTranslations?: any;

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
      t?: any; // Component translations
      t_title_1?: { text: string; href: string };
      t_title_2?: { text: string; href: string };
      t_title_3?: { text: string; href: string };

      // Search/Browse properties (map-browser)
      results?: any[];
      total?: number;
      start?: number;
      end?: number;
      analytics?: any;
      searchMode?: 'semantic' | 'classic';
      totalHits?: number;
      filters?: any;
      categories?: any;
      sortOptions?: any;
      numPageText?: string;
      resultMessage?: string;

      // Record detail properties (record/[uuid])
      uuid?: string;
      item_v2?: any;
      similar?: any[];
      related?: {
        id: string;
        description_en: string;
        description_fr: string;
        type: string;
      }[];
      analyticRes?: { '30'?: string; all?: string };
    }
    interface PageState {}
    // interface Platform {}
  }
}

export {};

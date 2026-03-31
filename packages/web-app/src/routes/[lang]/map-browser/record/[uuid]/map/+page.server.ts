import type { PageServerLoad } from './$types';
import { getRecord } from '$lib/db/record';
import { normalizeCoordinates } from '$lib/utils/normalize-coordinates';

type FeatureLike = {
  properties?: { title?: string };
  geometry?: { coordinates?: unknown };
};

function getFirstFeature(features: unknown): FeatureLike | null {
  if (!Array.isArray(features) || features.length === 0) {
    return null;
  }

  const first = features[0];
  if (!first || typeof first !== 'object') {
    return null;
  }

  return first as FeatureLike;
}

export const load: PageServerLoad = async ({ params, url }) => {
  let title = '';
  let coordinates: number[][] | null = null;
  try {
    const record = await getRecord(params.uuid);
    const feature = getFirstFeature(record?.features);

    title = feature?.properties?.title ?? '';
    coordinates = normalizeCoordinates(feature?.geometry?.coordinates, true) || null;
  } catch (e) {
    console.warn('error fetching record for microdata:\n', e);
  }

  return {
    tTitle1: {
      text: params.lang === 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
      href: `${url.origin}/${params.lang}/map-browser`,
    },
    tTitle2: {
      text: params.lang === 'en-ca' ? 'Metadata' : 'Métadonnées',
      href: `${url.origin}/${params.lang}/map-browser/record/${params.uuid}`,
    },
    tTitle3: {
      text: title,
      href: url.href,
    },
    lang: params.lang,
    uuid: params.uuid,
    coordinates,
  };
};

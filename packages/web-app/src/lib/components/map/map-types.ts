// Define the types of maps that can be used in different components
export type MapTypes = 'record' | 'resultList' | null;

// TODO: Look into importing type from geoview weekly
// Define the configuration structure for a Geoview map
export type GeoviewConfig = {
  map: {
    interaction: 'dynamic' | 'static';
    viewSettings: {
      projection: number;
      initialView: { layerIds?: string[]; zoomAndCenter?: [number, number[]] };
      maxExtent?: number[];
      minZoom?: number;
      maxZoom?: number;
    };
    basemapOptions: {
      basemapId: string;
      shaded: boolean;
      labeled: boolean;
    };
    listOfGeoviewLayerConfig?: Array<{
      geoviewLayerType: string;
      geoviewLayerId: string;
    }>;
  };
  theme?: string;
  components: string[];
  corePackages?: unknown[];
  appBar?: {
    tabs: {
      core: string[];
    };
  };
  footerBar?: {
    tabs: {
      core: string[];
    };
    collapsed?: boolean;
  };
  navBar?: string[];
};

<script module lang="ts">
  // Declare cgpv as a global variable
  // TODO: Find a way to import the cgpv types from geoview here so we don't have to use 'any'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare const cgpv: any;
</script>

<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { loadCGPVScript } from '$lib/components/map/loadCGPVScript';
  import type { GeoviewConfig, MapTypes } from '$lib/components/map/map-types';

  interface Props {
    coordinates: number[][];
    id: string;
    dynamic?: boolean;
    width?: string;
    height?: string;
    mapProjection?: number;
    mapType?: MapTypes;
    footer?: boolean;
    timeSlider?: boolean;
    chart?: boolean;
  }

  let {
    coordinates,
    id,
    dynamic = false,
    mapProjection = 3978,
    mapType = null,
    footer = false,
    timeSlider = false,
    chart = false,
  }: Props = $props();

  let mapId = $derived(`map-${mapType}-${id}`);
  let mapLang = page.data.lang === 'fr-ca' ? 'fr' : 'en';

  // TODO: extract to use one config for this and favourites map.
  let config: GeoviewConfig = $derived.by(() => ({
    map: {
      interaction: dynamic ? 'dynamic' : 'static',
      viewSettings: {
        projection: mapProjection,
        initialView: { layerIds: [] },
      },
      basemapOptions: {
        basemapId: 'transport',
        shaded: false,
        labeled: true,
      },
    },
    theme: 'geo.ca',
    components: ['north-arrow', 'overview-map'],
    corePackages: [],
    appBar: {
      tabs: {
        core: ['geolocator', 'legend', 'details', 'export'],
      },
    },
    ...(buildFooterBar() && { footerBar: buildFooterBar() }),
  }));

  function buildFooterBar(): GeoviewConfig['footerBar'] | undefined {
    const coreTabs: string[] = [];

    if (timeSlider) coreTabs.push('time-slider');
    if (chart) coreTabs.push('geochart');
    if (footer) coreTabs.push('layers', 'data-table');

    if (coreTabs.length > 0) {
      return {
        tabs: { core: coreTabs },
      };
    }

    return undefined;
  }

  let sConfig = $derived(JSON.stringify(config));

  /**
   * Gets the bounding box from the provided coordinates.
   *
   * @param coordinates - The coordinates to extract the bounding box from.
   * @returns The bounding box coordinates.
   */
  function getBbox(coordinates: number[][]): number[][] {
    // This is the bounding coordinates of Canada
    const defaultValue = [
      [-140.99778, 41.6751050889],
      [-140.99778, 83.23324],
      [-52.6480987209, 83.23324],
      [-52.6480987209, 41.6751050889],
    ];

    if (!coordinates) {
      console.warn('invalid coordinates, returing default value: \n', coordinates);
      return defaultValue;
    }

    let bbox = coordinates;

    // If first and last points are the same, remove the redundant one
    if (bbox[0][0] === bbox[bbox.length - 1][0] && bbox[0][1] === bbox[bbox.length - 1][1]) {
      bbox = bbox.slice(0, -1);
    }

    // For the Lambert projection (3978), we can add extra points along the top and bottom
    // edge of the bbox to get it to approximate the curve of the latitude lines.
    if (mapProjection === 3978 && bbox.length === 4) {
      // Find which vertices belong to the top and bottom edges.
      // To do this, we can sort the vertices based on the latitude,
      // to determine the top and bottom vertices, then find which which
      // longitude is larger to determine the east and west vertices.
      const sortByLatitude = bbox.sort((a, b) => a[1] - b[1]);
      const bottomPoints = [sortByLatitude[0], sortByLatitude[1]];
      const topPoints = [sortByLatitude[2], sortByLatitude[3]];

      const [bottomWest, bottomEast] = bottomPoints.sort((a, b) => a[0] - b[0]);
      const [topWest, topEast] = topPoints.sort((a, b) => a[0] - b[0]);

      // Add extra points to the north and south edges to aproximate the curve
      const northEdge = addVertices(topWest, topEast, 20);
      const southEdge = addVertices(bottomWest, bottomEast, 20);
      bbox = southEdge.concat(northEdge.reverse());
    }

    for (const coord of bbox) {
      // Check to make sure coordinates are valid
      if (
        coord.length !== 2 ||
        isNaN(coord[0]) ||
        isNaN(coord[1]) ||
        coord[0] > 180 ||
        coord[0] < -180 ||
        coord[1] > 90 ||
        coord[1] < -90
      ) {
        return defaultValue;
      }
    }

    return bbox;
  }

  /**
   * Gets the extent from the provided coordinates.
   *
   * @param coordinates - The coordinates to extract the extent from.
   * @returns The extent coordinates.
   */
  function getExtentFromCoordinates(coordinates: number[][]): number[] {
    const lons = coordinates.map((coord) => coord[0]);
    const lats = coordinates.map((coord) => coord[1]);
    return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  }

  /**
   * Adds additional vertices to a latitudinal edge.
   *
   * @param west - The western coordinate [longitude, latitude].
   * @param east - The eastern coordinate [longitude, latitude].
   * @param numVerticesToAdd - The number of vertices to add between west and east.
   * @returns The array of vertices added between west and east.
   */
  function addVertices(west: number[], east: number[], numVerticesToAdd: number): number[][] {
    const fraction = (east[0] - west[0]) / numVerticesToAdd;
    const latitude = west[1];

    let vertices: number[][] = [];
    let newLongitude;

    for (let i = 0; i <= numVerticesToAdd; i++) {
      newLongitude = west[0] + i * fraction;
      vertices.push([newLongitude, latitude]);
    }

    return vertices;
  }

  onMount(async (): Promise<void> => {
    // The loadCGPVScript function ensures the external cgpv library is fully loaded before
    // trying to use the geocore code, otherwise it sometimes fails
    await loadCGPVScript();

    try {
      // Destroy the old map if it exists. This ensures that when the map is toggled
      // on and off multiple time, it always has visible layers.
      if (cgpv.api.hasMapViewer(mapId)) {
        await cgpv.api.deleteMapViewer(mapId, false);
      }

      // Create the layer config to check if the geocore record has a map. It is undefined if no map exists.
      let geoviewLayerConfig;
      try {
        // Try to create the layer config to check if the geocore record has a map
        geoviewLayerConfig = await cgpv.api.config.createInitConfigFromType('geoCore', id, '', id);
      } catch {
        // If an error is thrown, it means the geocore record has no map
        geoviewLayerConfig = undefined;
      }

      // Add the geocore layer to the map config if it exists
      if (geoviewLayerConfig) {
        config.map.listOfGeoviewLayerConfig = [
          {
            geoviewLayerType: 'geoCore',
            geoviewLayerId: id,
          },
        ];
      } else {
        // Don't want to zoom to layers if there are none.
        delete config.map.viewSettings.initialView.layerIds;
      }

      // Sometimes, when going to a record page from the search results page
      // geoview attemps to build the map using the config from the search page.
      // To stop this, we can assign the map id based on the type of map
      // (i.e., resultList vs record), then check to make sure the map div exists.
      // Note: We can safely use document here since it is inside onMount.
      if (document.getElementById(mapId)) {
        // Build the map from the config
        await cgpv.api.createMapFromConfig(mapId, JSON.stringify(config));
      }

      // Add bounding box when no map is available
      if (!geoviewLayerConfig) {
        let bbox = getBbox(coordinates);

        // Sometimes, the map's vector layer hasn't finished loading when we try
        // to add the bbox polygon. We need to wait for the layer, so we can wrap
        // the following code in a handler to catch the mapLayersLoaded event before
        // triggering addPolygon.
        cgpv.api.getMapViewer(mapId)?.onMapLayersLoaded(() => {
          cgpv.api.getMapViewer(mapId).layer.geometry.addPolygon([bbox], {
            style: {
              strokeColor: '#535aa4',
              strokeWidth: 3,
              fillColor: '#535aa4',
              fillOpacity: 0.2,
            },
          });

          // Zoom to the extent of the coordinates.
          const extent = getExtentFromCoordinates(coordinates);
          cgpv.api.getMapViewer(mapId).zoomToLonLatExtentOrCoordinate(extent);
        });
      }
    } catch (e) {
      console.error(e);
    }
  });
</script>

<div id={mapId} class="bg-blue-500/5 w-full aspect-video" data-config={sConfig} data-lang={mapLang}></div>

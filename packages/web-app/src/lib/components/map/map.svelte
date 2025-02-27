<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';

  interface Props {
    coordinates: any;
    id: any;
    dynamic?: boolean;
    width?: string;
    height?: string;
    mapProjection?: number;
    useMap?: boolean; // When false, the map's bounding box is used instead
    mapType?: any;
    footer?: boolean;
    timeSlider?: boolean;
  }

  let {
    coordinates,
    id,
    dynamic = false,
    width = '100%',
    height = '32rem',
    mapProjection = 3857,
    useMap = true,
    mapType = null,
    footer = false,
    timeSlider = false
  }: Props = $props();

  let mapId = 'map-' + id;
  let mapLang = $page.data.lang == 'fr-ca' ? 'fr' : 'en';

  let center = calculateCenter(coordinates[0]);
  let zoom = calculateZoom(coordinates[0]);

  let config = $state({
    map: {
      interaction: dynamic ? 'dynamic' : 'static',
      viewSettings: {
        initialView: { zoomAndCenter: [zoom, center] },
        projection: mapProjection
      },
      basemapOptions: {
        basemapId: 'transport',
        shaded: false,
        labeled: true
      },
    },
    theme: 'geo.ca',
    components: [],
    corePackages: []
  });

  if (useMap) {
    config.map.listOfGeoviewLayerConfig = [{
      geoviewLayerType: 'geoCore',
      geoviewLayerId: id
    }]
  }

  if (footer) {
    config.footerBar = {
      tabs: {
        core: ["legend", "data-table"]
      },
      collapsed: true
    }
  }

  if (timeSlider) {
    if (footer) {
      config.footerBar.tabs.core.push("time-slider");
    } else {
      config.footerBar = {
        tabs: {
          core: ["time-slider"]
        },
        collapsed: true
      }
    }
  }

  let sConfig = $derived(JSON.stringify(config));

  // todo: this currently errors due to receiving [..., [String, String]] as coordinates. This data quality issue needs to be fixed on import. Coordinates should be floats instead of Strings.
  function calculateCenter(coordinates) {
    const defaultValue = [0, 60];
    if (!coordinates) {
      console.warn('invalid coordinates, returing default value: \n', coordinates);
      return defaultValue;
    }
    let i = 0;
    let xAccumulator = 0;
    let yAccumulator = 0;
    try {
      // we slice the array to prevent counting the initial value twice.
      coordinates.slice(0, -1).forEach((e) => {
        if (isNaN(e[0]) || isNaN(e[1])) {
          throw new Error('Coordinate is not a number!');
        }
        xAccumulator += e[0];
        yAccumulator += e[1];
        i++;
      });
    } catch (e) {
      console.warn('error iterating coordinates, returing default value2', coordinates, '\n', e);
      return defaultValue;
    }
    return [xAccumulator / i, yAccumulator / i];
  }

  function calculatePolygonArea(vertices) {
    var total = 0;

    for (var i = 0, l = vertices.length; i < l; i++) {
      var addX = vertices[i][0];
      var addY = vertices[i == vertices.length - 1 ? 0 : i + 1][1];
      var subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
      var subY = vertices[i][1];

      total += addX * addY * 0.5;
      total -= subX * subY * 0.5;
    }

    return Math.abs(total);
  }

  function calculateZoom(coordinates) {
    let area = calculatePolygonArea(coordinates);
    if (area > 100) {
      return 3.2;
    }
    if (area > 50) {
      return 4;
    }
    if (area < 2.5) {
      return 8;
    }
    return 5;
  }

  function getBbox(coordinates) {
    // This is the bounding coordinates of Canada
    const defaultValue = [
      [-140.99778, 41.6751050889],
      [-140.99778, 83.23324],
      [-52.6480987209, 83.23324],
      [-52.6480987209, 41.6751050889]
    ];

    if (!coordinates) {
      console.warn('invalid coordinates, returing default value: \n', coordinates);
      return defaultValue;
    }

    let bbox = coordinates;

    // If first and last points are the same, remove the redundant one
    if (bbox[0][0][0] == bbox[0][bbox.length - 1][0] &&
      bbox[0][0][1] == bbox[0][bbox.length - 1][1]
    ) {
      bbox = bbox[0].slice(0, -1);
    }

    for (const coord of bbox) {
      // Check to make sure coordinates are valid
      if (coord.length != 2 || isNaN(coord[0]) || isNaN(coord[1]) ||
        coord[0] > 180 || coord[0] < -180 || coord[1] > 90 || coord[1] < -90
      ) {
        return defaultValue;
      }
    }

    return bbox;
  }

  onMount(async () => {
    await tick();
    // Remove any old copies of the map
    cgpv.api.maps[mapId]?.remove(true);

    try {
      await cgpv.api.createMapFromConfig(
        mapId,
        sConfig
      );

      // Add bounding box when no map is available
      if (!useMap) {
        let bbox = getBbox(coordinates);
        cgpv.api.maps[mapId]?.layer.geometry.addPolygon(
          [bbox],
          {
            style: {
              strokeColor: '#535aa4',
              strokeWidth: 3,
              fillColor: '#535aa4',
              fillOpacity: 0.2,
            },
          },
          undefined,
          'static'
        );
      }
    } catch (e) {
      console.error(e);
    }
  });
</script>

<svelte:head>
  <!-- TODO: switch back to old link after geoview pull request with modifyDragged event accepted -->
  <script src="https://lbercovitch.github.io/geoview-leah/cgpv-main.js"></script>
  <!--<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>-->
</svelte:head>

{#if mapType === 'resultList'}
  <div
    id={mapId}
    class="bg-blue-500/5 w-full h-64 md:h-80 lg:h-96 xl:h-[28rem] 2xl:h-[32rem]"
    data-config={sConfig}
    data-lang={mapLang}
  ></div>
{:else if mapType === 'record'}
  <div
    id={mapId}
    class="bg-blue-500/5"
    style={`height: ${height}; width: ${width};`}
    data-config={sConfig}
    data-lang={mapLang}
  ></div>
{:else}
  <div
    id={mapId}
    class="bg-blue-500/5"
    style={`height: ${height}; width: ${width};`}
    data-config={sConfig}
    data-lang={mapLang}
  ></div>
{/if}

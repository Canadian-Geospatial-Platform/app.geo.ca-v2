<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount, tick } from 'svelte';

  interface Props {
    layerIds: any;
  }

  let {layerIds}: Props = $props();

  let mapId = 'map-mymap-resources';
  let mapLang = $page.data.lang == 'fr-ca' ? 'fr' : 'en';

  /***************** Map config *****************/
  const interaction = 'dynamic';
  const center = [-100, 68];
  const zoom = 2;
  const maxExtent = [-180, -90, 180, 90];
  const mapProjection = 3978;

  const basemapId = 'transport';
  const basemapShaded = false;
  const basemapLabeled = true;

  const theme = 'geo.ca';
  const components = ['north-arrow', 'overview-map'];
  const appBarTabs = ['geolocator', 'legend'];
  const footerBarTabs = ['layers', 'details', 'data-table', 'time-slider', 'geochart'];
  const footerBarCollapsed = true;

  let config = $state({
    map: {
      interaction: interaction,
      viewSettings: {
        initialView: { zoomAndCenter: [zoom, center] },
        projection: mapProjection
      },
      basemapOptions: {
        basemapId: basemapId,
        shaded: basemapShaded,
        labeled: basemapLabeled
      },
    },
    theme: theme,
    components: components,
    appBar: {
      tabs: {
        core: appBarTabs
      }
    },
    footerBar: {
      tabs: {
        core: footerBarTabs
      },
      collapsed: footerBarCollapsed
    }
  });

  let sConfig = $derived(JSON.stringify(config));

  /***************** Create map *****************/
  onMount(async () => {
    await tick();

    try {
      // Destroy the old map if it exists. This ensures that when the map is toggled
      // on and off multiple time, it always has visible layers.
      if (cgpv.api.hasMapViewer(mapId)) {
        await cgpv.api.deleteMapViewer(mapId, false)
      }

      // Build the map from the config
      await cgpv.api.createMapFromConfig(
        mapId,
        sConfig
      );

      // Add map layers for each id
      layerIds.forEach((layer) => {
        cgpv.api.getMapViewer(mapId).layer.addGeoviewLayerByGeoCoreUUID(layer);
      });
    } catch (e) {
      console.error(e);
    }
  });
</script>

<div
  id={mapId}
  class="bg-blue-500/5"
  style={`height: 32rem; width: 100%;`}
  data-config={sConfig}
  data-lang={mapLang}
></div>

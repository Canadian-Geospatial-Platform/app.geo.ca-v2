<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { loadCGPVScript } from '$lib/components/map/loadCGPVScript.ts';

	interface Props {
		layerIds: any;
	}

	let { layerIds }: Props = $props();

	let mapId = 'map-favourites-resources';
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
	const appBarTabs = ['geolocator', 'legend', 'export'];
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
			}
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

	// Allow for the map to be destroyed by the parent component
	export function destroyMapViewer() {
		try {
			if (cgpv.api.hasMapViewer(mapId)) {
				cgpv.api.deleteMapViewer(mapId, false);
			}
		} catch (error) {
			console.error('Error while removing map:', error);
		}
	}

	/***************** Create map *****************/
	onMount(async () => {
		// The loadCGPVScript function ensures the external cgpv library is fully loaded before
		// trying to use the geocore code, otherwise it sometimes fails
		await loadCGPVScript();

		try {
			// Destroy the old map if it exists. This ensures that when the map is toggled
			// on and off multiple time, it always has visible layers.
			if (cgpv.api.hasMapViewer(mapId)) {
				await cgpv.api.deleteMapViewer(mapId, false);
			}

			// Build the map from the config
			await cgpv.api.createMapFromConfig(mapId, sConfig);

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
	class="bg-blue-500/5 w-full aspect-video"
	data-config={sConfig}
	data-lang={mapLang}
></div>

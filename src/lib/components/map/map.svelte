<script lang="ts">
	import { onMount } from 'svelte';
	let config = {
		map: {
			interaction: 'dynamic',
			viewSettings: {
				zoom: 4,
				center: [60, -100],
				projection: 3978
			},
			basemapOptions: {
				basemapId: 'transport',
				shaded: true,
				labeled: true
			},
			listOfGeoviewLayerConfig: [
				{
					geoviewLayerId: 'esriDynamicLYR2',
					geoviewLayerName: {
						en: 'Energy',
						fr: 'Energy'
					},
					metadataAccessPath: {
						en: 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer',
						fr: 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer'
					},
					geoviewLayerType: 'esriDynamic',
					listOfLayerEntryConfig: [{ layerId: '0' }, { layerId: '6' }]
				}
			]
		},
		theme: 'dark',
		components: ['north-arrow', 'overview-map'],
		corePackages: [],
		suportedLanguages: ['en']
	};

	// function refresh() {
	//    cgpv.api.map('mapOne').loadConfig({
	//        map: {
	//            interaction: 'dynamic',
	//            viewSettings: {
	//                zoom: 12,
	//                center: [45, 75],
	//                projection: 3978
	//            },
	//            basemapOptions: {
	//                basemapId: 'transport',
	//                shaded: true,
	//                labeled: true,
	//            },
	//            listOfGeoviewLayerConfig: [],
	//        },
	//        theme: 'dark',
	//        components: ['north-arrow', 'overview-map'],
	//        corePackages: ['basemap-panel', 'layers-panel', 'details-panel'],
	//        externalPackages: [],
	//        suportedLanguages: ['en', 'fr'],
	//    });
	// }
	onMount(async () => {
		cgpv.init();
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>
<div id="mapOne" class="llwp-map" style="height: 100vh;" data-lang="en" data-config={config} />

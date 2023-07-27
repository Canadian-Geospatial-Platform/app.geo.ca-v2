<script lang="ts">
	import { onMount } from 'svelte';
	let config = {
		map: {
			interaction: 'dynamic',
			viewSettings: {
				zoom: 4,
				center: [100, 60],
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
	$: sConfig = JSON.stringify(config);

	onMount(async () => {
		cgpv.init();
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>

<!--for now, we pass data config in the html as javascript configuration is more bug prone.-->
<div id="mapTwo" class="llwp-map" style="height: 100vh;" data-lang="en" data-config={sConfig} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	export let center: number[];
	export let zoom: number;
	export let coordinates: [][][];

	export let config = {
		map: {
			interaction: 'static',
			viewSettings: {
				zoom: zoom,
				center: center,
				projection: 3857
			},
			basemapOptions: {
				basemapId: 'transport',
				shaded: true,
				labeled: true
			},
			listOfGeoviewLayerConfig: []
		},
		theme: 'dark',
		components: [],
		corePackages: [],
		suportedLanguages: ['en']
	};
	$: sConfig = JSON.stringify(config);
	onMount(() => {
		console.log($page.url);
		try {
			cgpv.init(function () {
				const mapInstance = cgpv.api.maps['metadata'];
				console.log(mapInstance);
				if (mapInstance)
					mapInstance.layer.geometry.addPolygon(coordinates, {
						style: {
							strokeColor: 'blue'
						}
					});
			});
		} catch (e) {
			console.log('Error initialising cgpv.', e);
		}
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>
<!--for now, we pass data config in the html as javascript configuration is more bug prone.-->
<div
	id="metadata"
	class="llwp-map bg-purple-100 rounded-lg"
	style="min-height: 20em; width: 100%; height: 300px"
	data-lang="en"
	data-config={sConfig}
/>

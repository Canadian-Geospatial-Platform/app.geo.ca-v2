<script lang="ts">
	import { onMount } from 'svelte';
	let config = {
		map: {
			interaction: 'dynamic',
			viewSettings: {
				zoom: 4,
				center: [-100, 60],
				projection: 3978
			},
			basemapOptions: {
				basemapId: 'transport',
				shaded: true,
				labeled: true
			},
			listOfGeoviewLayerConfig: []
		},
		theme: 'dark',
		components: ['north-arrow', 'overview-map'],
		corePackages: [],
		suportedLanguages: ['en']
	};
	$: sConfig = JSON.stringify(config);

	function addPolyline() {
		console.log(cgpv);
		console.log(cgpv.api.maps);
		console.log(cgpv.api.map('mapTwo'));
		cgpv.api.map('mapTwo').layer.vector.addPolyline(
			[
				[-120, 50],
				[-125, 55]
			],
			undefined
		);
	}

	onMount(async () => {
		cgpv.init();
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>
<button on:click={addPolyline}>fdasf</button>
<!--for now, we pass data config in the html as javascript configuration is more bug prone.-->
<div id="mapTwo" class="llwp-map" style="height: 100vh;" data-lang="en" data-config={sConfig} />

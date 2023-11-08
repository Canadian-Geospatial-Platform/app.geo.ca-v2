<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	export let coordinates;
	export let id;
	export let config = {
		map: {
			interaction: 'static',
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
		components: [],
		corePackages: [],
		suportedLanguages: ['en']
	};
	$: sConfig = JSON.stringify(config);
</script>

<!--for now, we pass data config in the html as javascript configuration is more bug prone.-->
<div
	{id}
	class="llwp-map bg-purple-100 rounded-lg w-full h-96 xl:h-full"
	data-lang="en"
	data-config={sConfig}
/>

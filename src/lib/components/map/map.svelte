<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

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
	class="llwp-map bg-purple-100 rounded-lg"
	style="min-height: 20em; width: 100%;"
	data-lang="en"
	data-config={sConfig}
/>

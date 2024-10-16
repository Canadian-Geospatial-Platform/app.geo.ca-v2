<script lang="ts">
	import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import SearchResult from './search-result.svelte';

	$: noResults = $page.data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	export let results = [];

	afterNavigate(async () => {
		try {
			await tick();
			cgpv.init();
		} catch (e) {
			console.warn('Error initialising cgpv.', e);
		}
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>
<div class="grow">
	<ol>
		{#each results as x}
			<SearchResult
				title={x.title}
				description={x.description}
				date={x.created}
				organization={x.organisation}
				coordinates={x.coordinates}
				id={x.id}
			/>
		{:else}
			<li class="p-4 bg-red-100 rounded-lg drop-shadow-lg">{noResults}</li>
		{/each}
	</ol>
</div>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import SearchResult from './search-result.svelte';

	$: noResults = $page.data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	export let results = [];

	onMount(async () => {
		try {
			await tick();
			cgpv.init(() => {
				results.forEach((e) => {
					console.log('eis:', e.coordinates);
					cgpv.api.maps[e.id + '-map'].layer.geometry.addPolygon(e.coordinates, {
						style: {
							strokeColor: 'blue'
						}
					});
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
		<li class="p-4 m-4 bg-red-100 rounded-lg drop-shadow-lg">{noResults}</li>
	{/each}
</ol>

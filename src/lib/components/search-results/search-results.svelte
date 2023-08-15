<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SearchResult from './search-result.svelte';

	$: noResults = $page.data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	export let results = [];

	onMount(() => {
		try {
			cgpv.init();
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
			date={x.date}
			organization={x.organisation}
			id={x.id}
		/>
	{:else}
		<li class="p-4 m-4 bg-red-100 rounded-lg drop-shadow-lg">{noResults}</li>
	{/each}
</ol>

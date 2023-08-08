<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SearchResult from './search-result.svelte';

	$: noResults = $page.data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	export let results = [];

	onMount(async () => {
		cgpv.init();
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>

{#each results as x}
	<ol>
		<SearchResult
			title={x.title}
			description={x.description}
			date={x.date}
			organization={x.organisation}
			id={x.id}
		/>
	</ol>
{:else}
	<p>{noResults}</p>
{/each}

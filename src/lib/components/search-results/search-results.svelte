<script lang="ts">
	import { page } from '$app/stores';
	import SearchResult from './search-result.svelte';

	$: noResults = $page.data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	export let results = [
		{ id: 'xxxx', title: 'abc', description: 'def', date: '2025-03-22', organization: 'dddd' }
	];
</script>

{#each results as x}
	<ol>
		<SearchResult
			title={x.title}
			description={x.description}
			date={x.date}
			organization={x.organisation}
			id={x.id}
			on:viewFootPrintEvent
		/>
	</ol>
{:else}
	<p>{noResults}</p>
{/each}

<script lang="ts">
	import SearchResult from './search-result.svelte';

	export let results = [
		{ id: 'xxxx', title: 'abc', description: 'def', date: '2025-03-22', organization: 'dddd' }
	];
</script>

<ol>
	{#each results as x}
		<SearchResult
			title={x.title}
			description={x.description}
			date={x.date}
			organization={x.organisation}
			id={x.id}
			on:viewFootPrintEvent
		/>
	{/each}
</ol>

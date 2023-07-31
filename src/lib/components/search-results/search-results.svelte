<script lang="ts">
	import SearchResult from './search-result.svelte';

	export let results = [
		{ title: 'abc', description: 'def', date: '2025-03-22', organization: 'dddd' }
	];
</script>

{#each results as x}
	<SearchResult />
{/each}

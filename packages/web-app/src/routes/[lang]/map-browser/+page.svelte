<script lang="ts">
	import { page } from '$app/stores';
	import SearchResults from '$lib/components/search-results/search-results.svelte';

	$: results = $page.data.results ? $page.data.results : [];
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>

<div class="flex flex-wrap lg:flex-nowrap items-start gap-4 py-4">
	<div class="grow flex flex-col gap-4">
		<SearchResults />
	</div>
</div>

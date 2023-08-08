<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Filters from '$lib/components/filters/filters.svelte';
	import SearchResults from '$lib/components/search-results/search-results.svelte';

	$: results = $page.data.results.Items;
	let mapComponentAddPolyline;

	function addPolyline(polyline) {
		mapComponentAddPolyline(polyline);
	}

	function handleViewFootprintEvent(event) {
		let coords = results.find((x) => {
			return x.id == event.detail.id;
		}).coordinates;
		let c = JSON.parse(coords);
		addPolyline(c[0]);
	}
</script>

<h1 class="p-4 m-4 rounded-lg drop-shadow-lg text-3xl font-bold underline bg-red-100">
	This page will contain the map based search.
</h1>
<div class="flex flex-wrap lg:flex-nowrap">
	<Filters />
	<div class="grow">
		<SearchResults {results} on:viewFootPrintEvent={handleViewFootprintEvent} />
	</div>
</div>

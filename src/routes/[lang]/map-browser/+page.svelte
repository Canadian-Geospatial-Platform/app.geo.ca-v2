<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Filters from '$lib/components/filters/filters.svelte';
	import Map from '$lib/components/map/map.svelte';
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

<h1 class="text-3xl font-bold underline bg-red-100">
	This page will contain the map based search.
</h1>
<Filters />
<button on:click|preventDefault={addPolyline}>Draw polygon.</button>
<SearchResults {results} on:viewFootPrintEvent={handleViewFootprintEvent} />
<Map bind:addPolyline={mapComponentAddPolyline} />

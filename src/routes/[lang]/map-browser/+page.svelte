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

	function handleViewFootpringEvent(event) {
		console.log('receiving..');
		console.log('event is:\n', event);
		let coords = results.find((x) => {
			return x.id == event.detail.id;
		}).coordinates;
		let c = JSON.parse(coords);
		addPolyline(c[0]);
		console.log(c);
	}

	onMount(async () => {
		// await new Promise((r) => setTimeout(r, 2000));
		// 	results.forEach((e) => {
		// 		console.log('eis:\n:', e.coordinates);
		// 		let c = JSON.parse(e.coordinates);
		// 		console.log(c[0]);
		// 		addPolyline(c[0]);
		// 	});
	});
</script>

<h1>This page will contain the map based search.</h1>
<Filters />
<button on:click={addPolyline}>Draw polygon.</button>
<SearchResults {results} on:viewFootPrintEvent={handleViewFootpringEvent} />
<Map bind:addPolyline={mapComponentAddPolyline} />

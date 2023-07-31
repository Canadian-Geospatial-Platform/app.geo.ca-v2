<script lang="ts">
	import { onMount } from 'svelte';
	import Filters from '$lib/components/filters/filters.svelte';
	import Map from '$lib/components/map/map.svelte';

	let mapComponentAddPolyline;

	function addPolyline(polyline) {
		mapComponentAddPolyline(polyline);
	}

	onMount(async () => {
		let response = await fetch(
			'https://geocore.api.geo.ca/geo?north=69.8698915662856&east=44.6484375&south=46.01222384063236&west=-180&keyword=&lang=fr&min=1&max=10&sort=title'
		);
		const jsonResponse = await response.json();
		console.log(jsonResponse.Items);
		jsonResponse.Items.forEach((e) => {
			let c = JSON.parse(e.coordinates);
			console.log(c[0]);
			addPolyline(c[0]);
		});
	});
</script>

<h1>This page will contain the map based search.</h1>
<Filters />
<button on:click={addPolyline}>Draw polygon.</button>
<Map bind:addPolyline={mapComponentAddPolyline} />

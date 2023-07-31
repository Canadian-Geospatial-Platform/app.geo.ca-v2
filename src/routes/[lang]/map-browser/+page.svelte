<script lang="ts">
	import { onMount } from 'svelte';
	import Filters from '$lib/components/filters/filters.svelte';
	import Map from '$lib/components/map/map.svelte';

	let testMap;
	onMount(async () => {
		let response = await fetch(
			'https://geocore.api.geo.ca/geo?north=69.8698915662856&east=44.6484375&south=46.01222384063236&west=-180&keyword=&lang=fr&min=1&max=10&sort=title'
		);
		const jsonResponse = await response.json();
		console.log(jsonResponse);
	});

	function testM() {
		testMap();
	}
</script>

<h1>This page will contain the map based search.</h1>
<Filters />
<button on:click={testM}>Draw polygon.</button>
<Map bind:addPolyline={testMap} />

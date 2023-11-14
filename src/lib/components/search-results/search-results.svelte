<script lang="ts">
	import { tick } from 'svelte';
	import { page } from '$app/stores';
	import SearchResult from './search-result.svelte';
	import { afterNavigate } from '$app/navigation';

	$: noResults = $page.data.lang == 'en-ca' ? 'No results found!' : 'Aucun résultat trouvé';
	export let results = [];

	afterNavigate(async () => {
		try {
			await tick();
			cgpv.init(() => {
				let i = 0;
				results.forEach((e) => {
					if (cgpv.api.maps[i + '-map']) {
						cgpv.api.maps[i + '-map'].layer.geometry.addPolygon(e.coordinates, {
							style: {
								strokeColor: 'blue'
							}
						});
					} else {
						console.warn('Unable to find map in cgpv.api.maps[' + i + " + '-map']");
					}
					++i;
				});
			});
		} catch (e) {
			console.log('Error initialising cgpv.', e);
		}
	});
</script>

<svelte:head>
	<script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>

<ol>
	{#each results as x, index}
		<SearchResult
			title={x.title}
			description={x.description}
			date={x.created}
			organization={x.organisation}
			coordinates={x.coordinates}
			id={index}
		/>
	{:else}
		<li class="p-4 m-4 bg-red-100 rounded-lg drop-shadow-lg">{noResults}</li>
	{/each}
</ol>

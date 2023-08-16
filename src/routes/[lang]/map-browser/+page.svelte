<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Filters from '$lib/components/filters/filters.svelte';
	import SearchResults from '$lib/components/search-results/search-results.svelte';
	import Offset from '$lib/components/filters/offset.svelte';

	$: results = $page.data.results?.['Items'] ? $page.data.results.Items : [];

	onMount(async () => {
		console.log($page);
	});
</script>

<div class="p-4 m-4 rounded-lg drop-shadow-lg bg-custom-5 text-justify">
	<h1 class="text-3xl font-bold pb-4">{$page.data.t_title}</h1>
	<p>{$page.data.t_description}</p>
</div>
<div class="flex flex-wrap lg:flex-nowrap items-start">
	<Filters class="shrink" />
	<div class="grow">
		<SearchResults {results} />
		<Offset />
	</div>
</div>

<script lang="ts">
	import { page } from '$app/stores';
	import Filters from '$lib/components/filters/filters.svelte';
	import SearchResults from '$lib/components/search-results/search-results.svelte';
	import Offset from '$lib/components/filters/offset.svelte';

	$: results = $page.data.results ? $page.data.results : [];
</script>

<div class="p-4 m-4 rounded-lg drop-shadow-lg bg-custom-5">
	<h1 class="text-3xl font-bold pb-4">{$page.data.t_title_1.text}</h1>
	<p class="text-justify">{$page.data.t_description}</p>
</div>
<div class="flex flex-wrap lg:flex-nowrap items-start">
	<div class="grow sm:shrink"><Filters /></div>
	<div class="grow">
		<SearchResults {results} />
		<Offset />
	</div>
</div>

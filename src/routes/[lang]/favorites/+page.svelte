<script lang="ts">
	import { page } from '$app/stores';
	import SearchResults from '$lib/components/search-results/search-results.svelte';

	$: results = $page.data.results ? $page.data.results : [];
</script>

<h1 class="text-3xl p-2 m-2">{$page.data.t_title}</h1>
<SearchResults {results} />

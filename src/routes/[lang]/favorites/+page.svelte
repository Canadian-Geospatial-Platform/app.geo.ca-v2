<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import SearchResults from '$lib/components/search-results/search-results.svelte';

	$: favoritesArr = [];

	$: results = $page.data.results ? $page.data.results : [];
	console.log($page.data.results);
</script>

<h1 class="text-3xl p-2 m-2">{$page.data.t_title}</h1>
{#if $page.data.jwt}
	<div class="grid grid-cols-12">
		<div class="col-span-4 bg-yellow-100" />
		<div class="col-span-8 bg-green-100">
			<SearchResults {results} />
		</div>
	</div>
{:else}
	<p class="p-2 m-2">Please sign in to view favorites</p>
{/if}

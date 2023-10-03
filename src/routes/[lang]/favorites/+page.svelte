<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { requireLogin, getToken } from '$lib/APIs/authorization.js';
	import { favorites, addFavorite, removeFavorite } from '$stores/favorites.ts';
	import SearchResults from '$lib/components/search-results/search-results.svelte';

	$: favoritesArr = [];

	$: results = $page.data.results ? $page.data.results : [];

	onMount(async () => {
		await requireLogin(getToken(), $page.url.origin + '/sign-in', $page.url.href);

		favorites.subscribe((value) => {
			favoritesArr = value;
		});
		let url = new URL($page.url.origin);
		url.pathname = $page.url.pathname;
		console.log($page.url);
		console.log(url);

		for (const x of favoritesArr) {
			console.log(x);
			url.searchParams.append('id', x);
		}
		// this is a hack that allows me to shift most of the data loading to the server. this should simplify switching to server side favorites instead of a store.
		goto(url, { invalidateAll: true });
	});
</script>

<h1 class="text-3xl p-2 m-2">{$page.data.t_title}</h1>
<<<<<<< Updated upstream
<SearchResults {results} />
=======
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
>>>>>>> Stashed changes

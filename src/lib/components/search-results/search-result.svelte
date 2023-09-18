<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { favorites, addFavorite, removeFavorite } from '$stores/favorites.ts';
	import Map from '$lib/components/map/map.svelte';

	$: viewRecord = $page.data.lang == 'en-ca' ? 'VIEW RECORD' : "AFFICHER L'ENREGISTREMENT";

	export let title;
	export let organization;
	export let date;
	export let description;
	export let id;
	$: favoritesArr = [];
	$: isFavorite = favoritesArr.includes(id);

	function favorite() {
		if (isFavorite) {
			removeFavorite(id);
		} else {
			addFavorite(id);
		}
	}
	onMount(() => {
		favorites.subscribe((value) => {
			favoritesArr = value;
		});
	});
</script>

<li class="bg-custom-6 rounded-lg p-4 m-4 grid xl:grid-cols-2 gap-4">
	<Map id={id + '-map'} />
	<div class="bg-custom-5 rounded-lg p-2">
		<h2 class="text-2xl">{title}</h2>
		<p>{organization ?? ''}</p>
		<p>{date}</p>
		<br />
		<p class="overflow-hidden text-ellipsis h-48">{description}</p>
		<div class="flex p-2 m-2 gap-2">
			<div class="grow" />
			<button class="button-2 text-xl font-bold" on:click={favorite}
				>{isFavorite ? '♥' : '♡'}</button
			>
			<a class="button-1 truncate overflow-hidden" href={'record/' + id}>{viewRecord}</a>
		</div>
	</div>
</li>

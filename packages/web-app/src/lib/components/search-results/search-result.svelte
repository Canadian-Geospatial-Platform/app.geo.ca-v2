<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import Map from '$lib/components/map/map.svelte';

	$: viewRecord = $page.data.lang == 'en-ca' ? 'VIEW RECORD' : "AFFICHER L'ENREGISTREMENT";

	export let title;
	export let organization;
	export let date;
	export let description;
	export let coordinates;
	export let id;
	$: favoritesArr = $page.data?.userData?.mapCart ?? []; // default to empty array to prevent errors when user is not logged in.
	$: isFavorite = favoritesArr.includes(id);
</script>

<li class="bg-custom-6 rounded-lg p-4 m-4 grid xl:grid-cols-2 gap-4">
	<div class="min-h-64">
		<Map {id} {coordinates} />
	</div>
	<div class="bg-custom-5 rounded-lg p-2">
		<h2 class="text-2xl">{title}</h2>
		<p>{organization ?? ''}</p>
		<p>{date}</p>
		<br />
		<p class="overflow-hidden text-ellipsis h-48">{description}</p>
		<div class="flex p-2 m-2 gap-2">
			<div class="grow" />
			{#if $page.data.FEATURE_SIGN_IN}
				{#if isFavorite}
					<form method="POST" action="?/removeFromMapCart" use:enhance>
						<input type="text" name="id" value={id} class="hidden" />
						<button class="button-2 text-xl font-bold" type="submit">♥</button>
					</form>
				{:else}
					<form method="POST" action="?/addToMapCart" use:enhance>
						<input type="text" name="id" value={id} class="hidden" />
						<button
							class="button-2 text-xl font-bold"
							type="submit"
							disabled={!$page.data.signedIn}
							title={$page.data.signedIn ? 'Add to favorites' : 'Please sign in to use favorites.'}
							>♡</button
						>
					</form>
				{/if}
			{/if}
			<a class="button-1 truncate overflow-hidden" href={$page.url.pathname + '/record/' + id}
				>{viewRecord}</a
			>
		</div>
	</div>
</li>

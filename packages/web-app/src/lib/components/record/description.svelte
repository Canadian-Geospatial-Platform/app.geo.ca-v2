<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { updateLocalStorage } from '$lib/utils/event-dispatchers/local-storage-changed.js';
	import Heart from '$lib/components/icons/heart.svelte';
	import HeartFilled from '$lib/components/icons/heart-filled.svelte';

	const data = $page.data;
	const translations = data.t;
	const lang = data.lang;
	const items = data.item_v2;
	const properties = items;

	const title = properties.title;
	const description = properties.description;
	const addToFavourites = translations?.addToFavourites
		? translations.addToFavourites
		: 'Add to Favourites';
	const removeFromFavourites = translations?.removeFromFavourites
		? translations.removeFromFavourites
		: 'Remove from Favourites';

	/****************** Favourites Resources ******************/
	let favouriteRecordList = $state(
		data?.userData?.favourites ? [...data?.userData?.favourites] : []
	);

	async function handleFavouriteClick(recordId) {
		if (!favouriteRecordList.includes(recordId)) {
			// Add to list of ids
			favouriteRecordList.push(recordId);

			if (data.signedIn) {
				// TODO: Add item to the favourites when login system has been approved
			}
		} else {
			// Remove from list of ids
			let index = favouriteRecordList.indexOf(recordId);
			if (index > -1) {
				favouriteRecordList.splice(index, 1);
			}

			if (data.signedIn) {
				// TODO: Remove item from the favourites when login system has been approved
			}
		}

		// Update localStorage and dispatch localstorage_updated event
		updateLocalStorage('FavouritesResources', favouriteRecordList);
	}

	// Local storage is only accessible from the client side, so we need to get
	// the FavouritesResources array inside onMount
	onMount(() => {
		if (!data.signedIn) {
			let stored = localStorage.getItem('FavouritesResources');

			if (stored) {
				// local storage is always a string, so we need to convert to an array
				stored = stored.split(',');
				favouriteRecordList = [...stored];
			}
		}
	});
</script>

<div>
	<h1 class="font-custom-style-h1 mb-8 mt-12 mx-5 md:mx-0 leading-tight">
		{title}
	</h1>
	<p class="font-custom-style-body-1 mx-5 md:mx-0">
		{@html description}
	</p>

	{#if favouriteRecordList.includes(properties.id)}
		<button
			class="text-custom-1 font-custom-style-body-5 bg-custom-16 border-custom-16 border-2
        rounded-md shadow-[0_0.1875rem_0.375rem_#00000029] mx-5 md:mx-0 mt-5 py-1 px-6 w-fit
        hover:border-custom-23 hover:bg-custom-23"
			onclick={() => handleFavouriteClick(properties.id)}
		>
			<HeartFilled classes="h-6 inline my-2 mr-1" />
			{removeFromFavourites}
		</button>
	{:else}
		<button
			class="text-custom-16 font-custom-style-body-3 border-custom-16 border-2
        rounded-md shadow-[0_0.1875rem_0.375rem_#00000029] mx-5 md:mx-0 mt-5 py-1 px-6 w-fit
        hover:text-custom-1 hover:border-custom-23 hover:bg-custom-23"
			onclick={() => handleFavouriteClick(properties.id)}
		>
			<Heart classes="h-6 inline my-2 mr-1" />
			{addToFavourites}
		</button>
	{/if}
</div>

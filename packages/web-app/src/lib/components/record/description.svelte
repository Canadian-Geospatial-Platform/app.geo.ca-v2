<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { updateLocalStorage } from '$lib/utils/event-dispatchers/local-storage-changed';
  import { FAVOURITES_STORAGE_KEY } from '$lib/utils/favourites-storage';
  import Heart from '$lib/components/icons/heart.svelte';
  import HeartFilled from '$lib/components/icons/heart-filled.svelte';

  const data = page.data;
  const translations = data.t;
  const items = data.item_v2!;
  const properties = items;

  const title = properties.title;
  const description = properties.description;
  const addToFavourites = translations?.addToFavourites ? translations.addToFavourites : 'Add to Favourites';
  const removeFromFavourites = translations?.removeFromFavourites ? translations.removeFromFavourites : 'Remove from Favourites';
  const signedIn = Boolean(data?.signedIn);

  /****************** Favourites Resources ******************/
  let favouriteRecordList = $state<string[]>(data?.userData?.favourites ? [...data.userData.favourites] : []);

  /**
   * Handles the favourite click event.
   *
   * @param recordId - The ID of the record to toggle in favourites.
   * @returns A promise that resolves when the operation is complete.
   */
  async function handleFavouriteClick(recordId: string): Promise<void> {
    const exists = favouriteRecordList.includes(recordId);

    // Update server-side favourites for signed-in users
    if (signedIn) {
      const response = await fetch(`/${data.lang}/api/favourites`, {
        method: exists ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId }),
      });

      // If the server update fails, do not update the local state
      if (!response.ok) {
        return;
      }
    }

    if (!favouriteRecordList.includes(recordId)) {
      // Add to list of ids
      favouriteRecordList.push(recordId);
    } else {
      // Remove from list of ids
      let index = favouriteRecordList.indexOf(recordId);
      if (index > -1) {
        favouriteRecordList.splice(index, 1);
      }
    }

    // Update localStorage and dispatch localstorage_updated event
    updateLocalStorage(FAVOURITES_STORAGE_KEY, favouriteRecordList);

    // For signed-in users, re-run the layout load so the nav favourites count updates
    if (signedIn) {
      await invalidate('app:favourites');
    }
  }

  // Local storage is only accessible from the client side, so we initialize
  // favourites inside onMount.
  onMount((): void => {
    // For signed-in users, the source of truth is the server, so we initialize
    if (signedIn) {
      updateLocalStorage(FAVOURITES_STORAGE_KEY, favouriteRecordList);
      return;
    }

    // For guest users, we initialize from localStorage in case they have favourited items before signing in
    let stored = localStorage.getItem(FAVOURITES_STORAGE_KEY);

    // If there are any favourites stored in localStorage, we use those as the source of truth
    if (stored) {
      favouriteRecordList = stored.split(',');
    }
  });
</script>

<div>
  <h1 class="font-custom-style-h1 mb-8 mt-12 mx-5 md:mx-0 leading-tight">
    {title}
  </h1>
  <p class="font-custom-style-body-1 mx-5 md:mx-0">
    <!-- These are our descriptions, no injection risk -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html description}
  </p>

  {#if favouriteRecordList.includes(properties.id)}
    <button class="button-utility-dark button-favourite" onclick={() => handleFavouriteClick(properties.id)}>
      <HeartFilled classes="h-6 inline my-2 mr-1" />
      {removeFromFavourites}
    </button>
  {:else}
    <button class="button-utility-light button-favourite" onclick={() => handleFavouriteClick(properties.id)}>
      <Heart classes="h-6 inline my-2 mr-1" />
      {addToFavourites}
    </button>
  {/if}
</div>

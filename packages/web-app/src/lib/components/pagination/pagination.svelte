<!------------------------------------------------------------
  This component consits of a set of buttons used to control
  any table with multiple pages of results.
  
  When one of the page buttons is clicked, a custom 'pageChange'
  event is dispatched, along with the new page number as the
  event's detail value. This event indicates when a page needs
  to be changed, but doesn't fetch any data. So, it
  is up to the parent component to handle the actual page
  change like this:
  
  <Pagination
    ...
    on:pageChange={myHandler}
  />

  <script>
    ...

    function myHandler(event) {
      currentPage = event.detail;
      ... /* get page data */
    }
  </script>
------------------------------------------------------------->

<script lang="ts">
  import Chevronleft from "$lib/components/icons/chevronleft.svelte";
  import Chevronright from "$lib/components/icons/chevronright.svelte";
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';

	const dispatch = createEventDispatcher();

  export let totalItems = 0;
  export let itemsPerPage = 10;
  export let currentPage;
  export let numPageButtons = 5;

  // Add 1 since page number from url starts at 0 while page buttons start at 1
  $: currentPage = parseInt($page.url.searchParams.get('page-number') || '0', 10) + 1;
  $: totalItems = $page.data.total ?? 0;

  let halfNumPageButtons = Math.floor(numPageButtons / 2);
  $: numPages = Math.ceil(totalItems / itemsPerPage);
  $: pageButtons = pageRange(currentPage);

  function pageRange(current: number) {
    if (numPages > numPageButtons) {
      let startPage;
      if (current <= halfNumPageButtons) {
        startPage = 1
      } else if (current > numPages - halfNumPageButtons) {
        startPage = numPages - numPageButtons + 1;
      } else {
        startPage = current - halfNumPageButtons;
      }
      return Array.from({ length: numPageButtons }, (_, i) => startPage + i);
    }

    return Array.from({ length: numPages }, (_, i) => i + 1);
  }

  function handlePageClick(page: number) {
    // Go to the top of the page with new page load
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    currentPage = page;
    dispatch('pageChange', page);
  }
</script>

<div class="bg-custom-16 flex flex-row w-fit p-1.5 rounded shadow-[0_3px_6px_#00000029]" class:hidden={totalItems == 0}>
  <button
    class="arrows mr-2 text-custom-16 disabled:text-custom-19"
    on:click={() => handlePageClick(currentPage - 1)}
    disabled={currentPage == 1 || totalItems == 0}
  >
    <Chevronleft classes="h-6" />
  </button>
  {#each pageButtons as page}
    <button
      class="font-custom-style-button-1 h-7 w-7"
      class:current-page={page == currentPage}
      on:click={() => handlePageClick(page)}
    >
      {page}
    </button>
  {/each}
  <button
    class="arrows ml-2 text-custom-16 disabled:text-custom-19"
    on:click={() => handlePageClick(currentPage + 1)}
    disabled={currentPage == numPages || totalItems == 0}
  >
    <Chevronright classes="h-6" />
  </button>
</div>

<style>
  .arrows {
    @apply bg-custom-1;
    @apply h-7;
    @apply w-7;
    @apply rounded;
  }

  .current-page {
    @apply bg-custom-1;
    @apply text-custom-7;
    @apply rounded;
  }
</style>
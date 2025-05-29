<!------------------------------------------------------------
  This component consits of a set of buttons used to control
  any table with multiple pages of results.
  
  When one of the page buttons is clicked, a custom 'pageChange'
  event is dispatched, along with the new page number as the
  event's value. This event indicates when a page needs
  to be changed, but doesn't fetch any data. So, it
  is up to the parent component to handle the actual page
  change like this:
  
  <Pagination
    ...
    pageChange={myHandler}
  />

  <script>
    ...

    function myHandler(event) {
      currentPage = event;
      ... /* get page data */
    }
  </script>
------------------------------------------------------------->

<script lang="ts">
  import Chevronleft from "$lib/components/icons/chevronleft.svelte";
  import Chevronright from "$lib/components/icons/chevronright.svelte";
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { formatNumber } from '$lib/utils/format-number.ts';

  interface Props {
    totalItems?: number;
    itemsPerPage?: number;
    currentPage: number;
    numPageButtons?: number;
    pageChange: CustomEvent
  }

  let {
    totalItems = $bindable($page.data.total ?? 0),
    itemsPerPage = $bindable(parseInt($page.url.searchParams.get('per-page') || 10, 10)),
    currentPage = $bindable(parseInt($page.url.searchParams.get('page-number') || '0', 10) + 1),
    numPageButtons = 5,
    pageChange
  }: Props = $props();

  let urlPageNumber = $derived(parseInt($page.url.searchParams.get('page-number') || '0', 10) + 1);
  let numPages = $derived(Math.ceil(totalItems / itemsPerPage));
  let halfNumPageButtons = $derived(Math.floor(numPageButtons / 2));
  let pageButtons = $derived(pageRange(currentPage, numPages, numPageButtons));

  $effect(() => {
    currentPage = urlPageNumber;
  });

  function pageRange(current: number, totalPages: number, numButtons: number) {
    if (totalPages > numButtons) {
      let startPage;
      if (current <= halfNumPageButtons) {
        startPage = 1
      } else if (current > totalPages - halfNumPageButtons) {
        startPage = totalPages - numButtons + 1;
      } else {
        startPage = current - halfNumPageButtons;
      }
      return Array.from({ length: numButtons }, (_, i) => startPage + i);
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  function handlePageClick(page: number) {
    currentPage = page;
    pageChange(page);
  }
</script>

<div
  class={[
    "flex flex-row justify-between items-center pagination-width",
    "rounded shadow-[0_0.1875rem_0.375rem_#00000029] bg-custom-16",
    (numPages < 2) && "hidden"
  ]}
>
  <button
    class="arrows mr-2 text-custom-16 disabled:text-custom-19"
    onclick={() => handlePageClick(currentPage - 1)}
    disabled={currentPage == 1 || totalItems == 0}
  >
    <Chevronleft classes="h-6" />
  </button>
  {#each pageButtons as page}
    <button
      class={[
        "font-custom-style-button-1 h-7 min-w-7 px-1 mx-1",
        (page == currentPage) && "current-page",
        (page != currentPage) && "page-button",
      ]}
      onclick={() => handlePageClick(page)}
    >
      {formatNumber(page)}
    </button>
  {/each}
  <button
    class="arrows ml-2 text-custom-16 disabled:text-custom-19"
    onclick={() => handlePageClick(currentPage + 1)}
    disabled={currentPage == numPages || totalItems == 0}
  >
    <Chevronright classes="h-6" />
  </button>
</div>

<style>
  .arrows {
    @apply flex;
    @apply items-center;
    @apply justify-center;
    @apply bg-custom-1;
    @apply h-7;
    @apply w-7;
    @apply rounded;
    @apply hover:bg-custom-23;
    @apply hover:text-custom-1;
    @apply disabled:hover:text-custom-19;
    @apply disabled:hover:bg-custom-1;
  }

  .current-page {
    @apply bg-custom-1;
    @apply text-custom-7;
    @apply rounded;
    @apply hover:bg-custom-23;
    @apply hover:text-custom-1;
  }

  .page-button {
    @apply rounded;
    @apply hover:bg-custom-23;
  }
  
  .pagination-width {
    @apply box-border;
    @apply sm:box-content;
    @apply w-full;
    @apply sm:w-fit;
    @apply py-2.5;
    @apply sm:py-1.5;
    @apply px-5;
    @apply sm:px-1.5;
  }
</style>

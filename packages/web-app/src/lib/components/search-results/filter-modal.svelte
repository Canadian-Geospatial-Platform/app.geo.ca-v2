<script lang="ts">
  import { page } from '$app/stores';
  import { updateCategoryOfInterest } from '$lib/components/search-results/filters/store';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import Close from '$lib/components/icons/close.svelte';
	import Search from '$lib/components/icons/search.svelte';
	import CategoryOfInterest from '$lib/components/search-results/filters/category-of-interest.svelte';
	import Organizations from '$lib/components/search-results/filters/organizations.svelte';
	import Types from '$lib/components/search-results/filters/types.svelte';
	import Themes from '$lib/components/search-results/filters/themes.svelte';
	import OtherFilters from '$lib/components/search-results/filters/other-filters.svelte';
	import SpatioTemporal from '$lib/components/search-results/filters/spatio-temporal.svelte';

  // TODO: Fix tab sequence for keyboard navigation i.e. disable content below mask

  export let active = false;
  export let numFilters = 0;

  /************* Translations ***************/
  const translations = $page.data.t;

  const filterByText = translations?.filterBy ? translations["filterBy"] : "Filter By";
  // TODO: update description text
  const filterDescriptionText = translations?.filterDescription ?
    translations["filterDescription"] : "";
  const clearAllText = translations?.clearAll ? translations["clearAll"] : "Clear All";
  const searchText = translations?.search ? translations["search"] : "Search";

  /************* Filter Data ***************/
  $: tempNumFilters = numFilters;
  let temporalActive = false;
  let spatialActive = false;

  /************* Handlers ***************/
  function handleCloseButtonClick(event: Event) {
    active = false;
    toggleScroll(active);
  }

  function handleClearAllClick(event: Event) {
    tempNumFilters = 0;
    numFilters = 0;
    temporalActive = false;
    spatialActive = false;
    updateCategoryOfInterest(null);
  }

  function handleSubmit(event: Event) {
    numFilters = tempNumFilters;
  }
</script>

<div
  class="fixed flex justify-center z-30 inset-0 bg-custom-7/75 overflow-y-scroll hide-scroll pb-4"
  class:hidden={!active}
>
  <form
    class="grid grid-cols-6 bg-custom-1 border border-custom-21 w-2/3 h-fit mt-2"
    on:submit|preventDefault={handleSubmit}
  >
    <div class="col-span-5 flex flex-col gap-5 px-5 pb-5 pt-8 font-custom-style-body-1">
      <div>
        <h1 class="font-custom-style-h1-2">{filterByText}</h1>
        <p>{filterDescriptionText}</p>
      </div>
      <div class="flex flex-col gap-y-5">
        <CategoryOfInterest
          bind:tempNumFilters={tempNumFilters}
        />
        <SpatioTemporal
          bind:tempNumFilters={tempNumFilters}
          bind:temporalActive={temporalActive}
          bind:spatialActive={spatialActive}
        />
        <Organizations bind:tempNumFilters={tempNumFilters} />
        <Types bind:tempNumFilters={tempNumFilters} />
        <Themes bind:tempNumFilters={tempNumFilters} />
        <OtherFilters bind:tempNumFilters={tempNumFilters} />
      </div>
    </div>
    <div class="col-span-1 px-5 pt-8 justify-self-end">
      <button
        type="button"
        class="flex justify-center items-center border border-custom-16 rounded-[50%] h-[49px] w-[49px]"
        on:click={handleCloseButtonClick}
      >
        <Close classes="text-custom-16 h-[21px]"/>
      </button>
    </div>
    <div class="grid grid-cols-2 col-span-6 bg-custom-5 border-t border-custom-21 px-5 py-[18px]">
      <button
        type="reset" class="justify-self-start button-3"
        on:click={handleClearAllClick}
      >
        {clearAllText}
      </button>
      <button type="submit" class="justify-self-end button-5 shadow-[0px_3px_6px_#00000029]">
        <Search classes="inline" height="18px"/>
        {searchText}
      </button>
    </div>
  </form>
</div>

<style>
  .hide-scroll {
    -ms-overflow-style: none;  /* Edge */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scroll::-webkit-scrollbar {
    @apply hidden; /* Chrome */
  }
</style>

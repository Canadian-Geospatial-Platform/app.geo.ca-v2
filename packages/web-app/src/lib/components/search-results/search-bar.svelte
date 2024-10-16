<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
  import Card from '$lib/components/card/card.svelte';
  import Search from '$lib/components/icons/search.svelte';
	import FilterModal from '$lib/components/search-results/filter-modal.svelte';

  /************* Translations ***************/
  const translations = $page.data.t;

  const filtersText = translations?.filters ? translations["filters"] : "Filters";
  const searchText = translations?.search ? translations["search"] : "Search";
  const searchProductsText = translations?.searchProducts ?
    translations["searchProducts"] : "Search Products";

  const datasetsText = translations?.datasets ? translations["datasets"] : "Datasets";
  const contributorsText = translations?.contributors ?
    translations["contributors"] : "Contributors";
  const applicationsText = translations?.applications ?
    translations["applications"] : "Applications";
  const apisText = translations?.apis ? translations["apis"] : "APIs";
  const collectionsText = translations?.collections ?
    translations["collections"] : "Collections";

  /***************** Data ******************/
  let searchTextInput: HTMLInputElement;
  let analytics = $page.data.analytics;
  $: numFilters = 0;

  // TODO: Get actual numbers for all data variables
  let datasets = analytics?.total ?? 0;
  let contributors = analytics?.organization ?? 0;
  let applications = 0;
  let apis = 0;
  let collections = 0;

  $: modalActive = false;

  function handleFilterButtonClick(event: Event) {
    modalActive = true;
    toggleScroll(modalActive);
  };

  function handleSearchClick(event: Event) {
    let searchTerm = searchTextInput?.value;
    if (searchTerm && searchTerm.length > 0) {
      applyKeywordSearch(searchTerm);
    }
  }

  function handleSearchEnterKeyDown(event: KeyboardEvent) {
    let key = event.key;
    if (key == "Enter") {
      let searchTerm = searchTextInput?.value;
      if (searchTerm && searchTerm.length > 0) {
        applyKeywordSearch(searchTerm);
      }
    }
  }

  function applyKeywordSearch(keyword: string) {
    let url = $page.url;
    url.searchParams.set('search-terms', keyword);
    // TODO: return to first page of results. Note: this requires resetting the pagination element too.
    goto(url, { invalidateAll: true });
  }
</script>

<FilterModal bind:active={modalActive} bind:numFilters={numFilters}/>
<Card>
  <div class="flex flex-row">
    <button 
      class="text-nowrap h-12 button-3 shadow-[0px_3px_6px_#00000029]"
      on:click={handleFilterButtonClick}
    >
      <span class="px-1 bg-custom-16 rounded-md font-custom-style-button-2 leading-[14px]">
        {numFilters}
      </span>
      {filtersText}
    </button>
    <input
      type="text"
      placeholder={searchProductsText}
      class="w-full h-12 ml-5 px-5 rounded-s-[5px] font-custom-style-placeholder
        shadow-[inset_0px_3px_6px_#00000029]"
      bind:this={searchTextInput}
      on:keydown={handleSearchEnterKeyDown}
    />
    <button
      class="text-nowrap h-12 px-5 rounded-e-[5px] bg-custom-16
        font-custom-style-button-3 shadow-[0px_3px_6px_#00000029]"
      on:click={handleSearchClick}
    >
      <Search classes="inline" height="18px"/>
      {searchText}
    </button>
  </div>
  <div class="flex flex-row gap-7 font-custom-style-body-8">
    <div>{datasetsText}: {datasets}</div>
    <div>{contributorsText}: {contributors}</div>
    <div>{applicationsText}: {applications}</div>
    <div>{apisText}: {apis}</div>
    <div>{collectionsText}: {collections}</div>
  </div>
</Card>


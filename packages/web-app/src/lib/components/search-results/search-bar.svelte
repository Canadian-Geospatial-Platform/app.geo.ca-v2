<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { page, navigating } from '$app/state';
  import { goto } from '$app/navigation';
  import { toggleScroll } from '#lib/components/component-utils/toggleScroll.js';
  import Card from '#lib/components/card/card.svelte';
  import Search from '#lib/components/icons/search.svelte';
  import FilterModal from '#lib/components/search-results/filter-modal.svelte';
  import Filter from '#lib/components/icons/filter.svelte';

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));

  // Search key for URL parameters
  const searchKey = 'search-terms';

  let searchTextInput: HTMLInputElement | undefined = $state();
  const analytics = page.data.analytics;
  let numFilters = $state(0);

  let keywordFromUrl = $derived(page.url.searchParams.get(searchKey));

  // TODO: Get actual numbers for all data variables
  const datasets = $derived(analytics?.total ?? translations.general.notApplicable);
  const contributors = $derived(analytics?.organization ?? translations.general.notApplicable);

  /***************** Handlers ******************/
  let modalActive: boolean = $state(false);
  let filterModal: FilterModal | undefined = $state();

  /**
   * Handles the filter button click event.
   */
  function handleFilterButtonClick(): void {
    modalActive = true;
    toggleScroll(modalActive);
    filterModal?.setFiltersFromURL();
  }

  /**
   * Handles the search button click event.
   */
  function handleSearchClick(): void {
    let searchTerm = searchTextInput?.value;
    if (searchTerm) applyKeywordSearch(searchTerm);
  }

  /**
   * Handles the keydown event for the search input.
   *
   * @param event - The keyboard event.
   */
  function handleSearchEnterKeyDown(event: KeyboardEvent): void {
    let key = event.key;
    if (key === 'Enter') {
      let searchTerm = searchTextInput?.value;
      if (searchTerm) applyKeywordSearch(searchTerm);
    }
  }

  /**
   * Applies the keyword search by updating the URL parameters and navigating to the search page.
   *
   * @param keyword - The keyword to search for.
   */
  function applyKeywordSearch(keyword: string): void {
    let query = new SvelteURLSearchParams(page.url.searchParams.toString());
    if (keyword) {
      query.set('search-terms', keyword);
    } else {
      query.delete('search-terms');
    }
    query.set('page-number', '0');

    // We need to preserve the current localized search-results route.
    // Using resolve('/?...') here sends the user to the site root instead of updating the current search page.
    goto(`${page.url.pathname}?${query.toString()}`, { replace: true, reset: false });
  }
</script>

<FilterModal bind:active={modalActive} bind:numFilters bind:this={filterModal} />
<Card type="searchBar">
  <div class="flex flex-row gap-y-5 flex-wrap md:flex-nowrap">
    <button
      class={`text-nowrap
        button-action-light disabled:cursor-default`}
      onclick={handleFilterButtonClick}
      disabled={navigating.type !== null}
    >
      {#if numFilters > 0}
        <span
          class={`px-1 rounded-md font-custom-style-button-2 leading-[0.875rem]
            ${navigating.type !== null ? 'bg-custom-17' : 'bg-custom-16'}`}
        >
          {numFilters}
        </span>
      {:else}
        <Filter classes="inline h-5" />
      {/if}
      {translations.components.searchResults.labels.filters}
    </button>
    <div class="flex flex-nowrap w-full">
      <input
        type="text"
        placeholder={translations.general.searchProducts}
        class={`w-full md:ml-5 search-input-shell md:border-0
          ${navigating.type !== null ? 'border-custom-17' : 'border-custom-16'}`}
        bind:this={searchTextInput}
        onkeydown={handleSearchEnterKeyDown}
        disabled={navigating.type !== null}
        value={keywordFromUrl}
      />
      <button
        class={`search-submit-shell
          button-search-dark
          ${navigating.type !== null ? 'bg-custom-17 border-custom-17' : ''}`}
        onclick={handleSearchClick}
        disabled={navigating.type !== null}
      >
        <Search classes="inline" height="1.125rem" />
        <span class="hidden md:inline">
          {translations.general.search}
        </span>
      </button>
    </div>
  </div>
  <div class="flex flex-row flex-wrap lg:flex-nowrap gap-x-4 gap-y-1 lg:gap-x-7 font-custom-style-body-8">
    <div>{translations.components.searchResults.labels.datasets}: {datasets}</div>
    <div>{translations.components.searchResults.labels.contributors}: {contributors}</div>
    <!--
      TODO: Uncomment when we have a query to get this data.
      Application, API, and collection counts are not yet available.
    -->
    <!--<div>{applicationsText}: {applications}</div>-->
    <!--<div>{apisText}: {apis}</div>-->
    <!--<div>{collectionsText}: {collections}</div>-->
  </div>
</Card>

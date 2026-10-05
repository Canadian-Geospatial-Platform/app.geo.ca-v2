<!-----------------------------------
  This version of the search bar is a component meant for pages other than the main
  search results page. It only takes a keyword, instead of providing the full list of
  filters, and sends the user back to the search page when the search button is clicked.
----------------------------------->
<script lang="ts">
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { page, navigating } from '$app/state';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import Search from '$lib/components/icons/search.svelte';

  /************* Translations ***************/
  const translations = page.data.t;

  const searchText = translations?.search ? translations['search'] : 'Search';
  const searchProductsText = translations?.searchProducts ? translations['searchProducts'] : 'Search Products';

  /***************** Data ******************/
  let searchTextInput: HTMLInputElement | undefined = $state();

  /***************** Handlers ******************/
  /**
   * Handles the search button click event.
   */
  function handleSearchClick(): void {
    const searchTerm = searchTextInput?.value;
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
      const searchTerm = searchTextInput?.value;
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

    let opts = {
      replaceState: true,
      keepfocus: true,
    };
    // This component is used outside the search page, so it must navigate to map-browser explicitly.
    // Navigating to '/?...' hits root redirect and can drop query params.
    goto(resolve(`/${page.data.lang}/map-browser?${query.toString()}`), opts);
  }
</script>

<div class="flex flex-nowrap w-full drop-shadow-[0_0.1875rem_0.375rem_#00000029] rounded-[0.3125rem]">
  <input
    type="text"
    placeholder={searchProductsText}
    class={`w-full lg:w-1/2 search-input-shell
      ${navigating.type !== null ? 'border-custom-17' : 'border-custom-16'}`}
    bind:this={searchTextInput}
    onkeydown={handleSearchEnterKeyDown}
    disabled={navigating.type !== null}
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
      {searchText}
    </span>
  </button>
</div>

<!-----------------------------------
  This version of the search bar is a component meant for pages other than the main
  search results page. It only takes a keyword, instead of providing the full list of
  filters, and sends the user back to the search page when the search button is clicked.
----------------------------------->
<script lang="ts">
  import { page, navigating } from '$app/state';
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
    let url = new URL(page.url.origin + '/' + page.data.lang + '/map-browser');
    let query = new URLSearchParams(url.searchParams.toString());

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
    goto(`${url}?${query.toString()}`, opts);
  }
</script>

<div class="flex flex-nowrap w-full">
  <input
    type="text"
    placeholder={searchProductsText}
    class={`w-full lg:w-1/2 h-12 px-5 rounded-s-[0.3125rem] font-custom-style-placeholder
      shadow-[inset_0rem_0.1875rem_0.375rem_#00000029] border-y-2 border-l-2
      ${navigating.type !== null ? 'border-custom-17' : 'border-custom-16'}`}
    bind:this={searchTextInput}
    onkeydown={handleSearchEnterKeyDown}
    disabled={navigating.type !== null}
  />

  <button
    class={`text-nowrap h-12 px-5 rounded-e-[0.3125rem]
      font-custom-style-button-3 shadow-[0rem_0.1875rem_0.375rem_#00000029]
      hover:bg-custom-23
      ${navigating.type !== null ? 'bg-custom-17' : 'bg-custom-16'}`}
    onclick={handleSearchClick}
    disabled={navigating.type !== null}
  >
    <Search classes="inline" height="1.125rem" />
    <span class="hidden md:inline">
      {searchText}
    </span>
  </button>
</div>

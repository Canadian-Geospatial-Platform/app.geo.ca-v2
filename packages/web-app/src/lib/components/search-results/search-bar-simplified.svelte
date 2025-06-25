<!-----------------------------------
  This version of the search bar is a component meant for pages other than the main
  search results page. It only takes a keyword, instead of providing the full list of
  filters, and sends the user back to the search page when the search button is clicked.
----------------------------------->
<script lang="ts">
  import { page, navigating } from '$app/stores';
  import { goto } from '$app/navigation';
  import Search from '$lib/components/icons/search.svelte';

  /************* Translations ***************/
  const translations = $page.data.t;

  const searchText = translations?.search ? translations["search"] : "Search";
  const searchProductsText = translations?.searchProducts ?
    translations["searchProducts"] : "Search Products";

  /***************** Data ******************/
  const searchKey = 'search-terms';

  let searchTextInput: HTMLInputElement = $state();

  /***************** Handlers ******************/
  function handleSearchClick(event: Event) {
    let searchTerm = searchTextInput?.value;
    applyKeywordSearch(searchTerm);
  }

  function handleSearchEnterKeyDown(event: KeyboardEvent) {
    let key = event.key;
    if (key == "Enter") {
      let searchTerm = searchTextInput?.value;
      applyKeywordSearch(searchTerm);
    }
  }

  function applyKeywordSearch(keyword: string) {
    let url = new URL($page.url.origin + '/' + $page.data.lang + '/map-browser');
    let query = new URLSearchParams(url.searchParams.toString());

    if (keyword) {
      query.set('search-terms', keyword);
    } else {
      query.delete('search-terms');
    }
    query.set('page-number', '0');

    let opts = {
			replaceState: true,
			keepfocus: true
		};
    goto(`${url}?${query.toString()}`, opts);
  }
</script>

<div class='flex flex-nowrap w-full'>
  <input
    type="text"
    placeholder={searchProductsText}
    class={`w-full lg:w-1/2 h-12 px-5 rounded-s-[0.3125rem] font-custom-style-placeholder
      shadow-[inset_0rem_0.1875rem_0.375rem_#00000029] border-y-2 border-l-2
      ${$navigating ? 'border-custom-17' : 'border-custom-16'}`}
    bind:this={searchTextInput}
    onkeydown={handleSearchEnterKeyDown}
    disabled={$navigating}
  />

  <button
    class={`text-nowrap h-12 px-5 rounded-e-[0.3125rem]
      font-custom-style-button-3 shadow-[0rem_0.1875rem_0.375rem_#00000029]
      hover:bg-custom-23
      ${$navigating ? 'bg-custom-17' : 'bg-custom-16'}`}
    onclick={handleSearchClick}
    disabled={$navigating}
  >
    <Search classes="inline" height="1.125rem"/>
    <span class="hidden md:inline">
      {searchText}
    </span>
  </button>
</div>

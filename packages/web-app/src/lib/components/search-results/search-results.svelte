<script lang="ts">
  import { page } from '$app/stores';
	import ResultList from '$lib/components/search-results/result-list.svelte';
  import SearchBar from '$lib/components/search-results/search-bar.svelte';

  /************* Translations ***************/
  const translations = $page.data.t;

  const listViewText = translations?.listView ? translations["listView"] : "List View";
  const searchResultsText = translations?.searchResults ?
    translations["searchResults"] : "Search Results";
  const youMayText = translations?.youMay ? translations["youMay"] : "You may also like";

  $: resultMessage = $page.data.resultMessage;
</script>

<h1 class="font-custom-style-h1 px-5 md:px-0">
  {searchResultsText}
</h1>
<p class="mb-2 mt-[-0.75em] font-open-sans px-5 md:px-0">
  {resultMessage}
</p>
<SearchBar />
<h2 class="font-custom-style-h2 px-5 md:px-0">
  {listViewText}
</h2>
<ResultList />
<!--<h2 class="font-custom-style-h2">-->
<!--  {youMayText}-->
<!--</h2>-->

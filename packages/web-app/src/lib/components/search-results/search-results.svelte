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

  let numResults = $page.data.total;
</script>

<h1 class="font-custom-style-h1">
  {searchResultsText}
</h1>
<!--<p>-->
<!--  We have found {numResults} datasets for the keywords...-->
<!--</p>-->
<SearchBar />
<h2 class="font-custom-style-h2">
  {listViewText}
</h2>
<ResultList />
<!--<h2 class="font-custom-style-h2">-->
<!--  {youMayText}-->
<!--</h2>-->

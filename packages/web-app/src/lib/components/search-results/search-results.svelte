<script lang="ts">
  import { page } from '$app/stores';
	import ResultList from '$lib/components/search-results/result-list.svelte';
  import SearchBar from '$lib/components/search-results/search-bar.svelte';

  /************* Translations ***************/
  const translations = $page.data.t;

  const searchDatasets = translations?.searchDatasets ? translations["searchDatasets"] : "Search datasets";
  const searchResultsText = translations?.searchResults ? translations["searchResults"] : "Search results";

  let resultMessage = $derived($page.data.resultMessage);
</script>

<h1 class="font-custom-style-h1 mt-8 px-5 md:px-0">
  {searchDatasets}
</h1>
<p class="mb-2 mt-3 font-open-sans px-5 md:px-0">
  {resultMessage}
</p>
<SearchBar />
<h2 class="font-custom-style-h2 mt-5 px-5 md:px-0">
  {searchResultsText}
</h2>
<ResultList />

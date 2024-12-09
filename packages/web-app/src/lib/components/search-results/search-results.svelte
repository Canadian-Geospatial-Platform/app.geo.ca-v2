<script lang="ts">
  import { page } from '$app/stores';
	import ResultList from '$lib/components/search-results/result-list.svelte';
  import SearchBar from '$lib/components/search-results/search-bar.svelte';

  $: numResults = $page.data.total;
  $: searchTerm = $page.url.searchParams.get('search-terms');

  /************* Translations ***************/
  const translations = $page.data.t;

  const listViewText = translations?.listView ? translations["listView"] : "List View";
  const searchResultsText = translations?.searchResults ?
    translations["searchResults"] : "Search Results";
  const youMayText = translations?.youMay ? translations["youMay"] : "You may also like";

  $: messageSearchTerm = translations?.messageSearchTerm ?
    parseMessageText(translations["messageSearchTerm"], numResults, searchTerm) : "";
  $: messageNoSearchTerm = translations?.messageNoSearchTerm ?
    parseMessageText(translations["messageNoSearchTerm"], numResults, searchTerm) : "";

  function parseMessageText(message, numDatasets, term) {
    let lang = $page.data.lang;
    let datasets;

    if (lang == 'fr-ca') {
      datasets = numDatasets > 1 ? 'ensembles de données' : 'ensemble de données';
    } else {
      datasets = numDatasets > 1 ? 'datasets' : 'dataset';
    }

    message = message.replaceAll('{{datasets}}', datasets);
    message = message.replaceAll('{{numResults}}', numDatasets);
    message = message.replaceAll('{{searchTerm}}', term);

    return message;
  }
</script>

<h1 class="font-custom-style-h1 px-5 md:px-0">
  {searchResultsText}
</h1>
<p class="mb-2 mt-[-0.75em] font-open-sans px-5 md:px-0">
  {#if searchTerm}
    {messageSearchTerm}
  {:else}
    {messageNoSearchTerm}
  {/if}
</p>
<SearchBar />
<h2 class="font-custom-style-h2 px-5 md:px-0">
  {listViewText}
</h2>
<ResultList />
<!--<h2 class="font-custom-style-h2">-->
<!--  {youMayText}-->
<!--</h2>-->

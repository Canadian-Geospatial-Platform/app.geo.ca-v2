<script lang="ts">
  import { getComponentLabels } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import ResultList from '#lib/components/search-results/result-list.svelte';
  import SearchBar from '#lib/components/search-results/search-bar.svelte';

  /************* Translations ***************/
  const translations = $derived(getComponentLabels(getAppLanguage(page.data.lang ?? page.params.lang), 'searchResults'));

  let resultMessage = $derived(page.data.resultMessage);
</script>

<h1 class="font-custom-style-h1 mt-8 px-5 md:px-0 leading-tight">
  {translations.searchDatasets}
</h1>
<p class="mb-2 mt-3 font-open-sans px-5 md:px-0">
  {resultMessage}
</p>
<SearchBar />
<h2 class="font-custom-style-h2 mt-5 px-5 md:px-0">
  {translations.searchResults}
</h2>
<ResultList />

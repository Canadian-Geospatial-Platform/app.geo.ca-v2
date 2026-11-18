<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import ResultList from '#lib/components/search-results/result-list.svelte';
  import SearchBar from '#lib/components/search-results/search-bar.svelte';

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));

  let resultMessage = $derived(page.data.resultMessage);
</script>

<h1 class="font-custom-style-h1 mt-8 px-5 md:px-0 leading-tight">
  {translations.components.searchResults.labels.searchDatasets}
</h1>
<p class="mb-2 mt-3 font-open-sans px-5 md:px-0">
  {resultMessage}
</p>
<SearchBar />
<h2 class="font-custom-style-h2 mt-5 px-5 md:px-0">
  {translations.components.searchResults.labels.searchResults}
</h2>
<ResultList />

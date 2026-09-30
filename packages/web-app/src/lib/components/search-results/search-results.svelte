<script lang="ts">
  import { page, navigating } from '$app/state';
  import ResultList from '$lib/components/search-results/result-list.svelte';
  import SearchBar from '$lib/components/search-results/search-bar.svelte';
  import OverviewSection from '$lib/components/search-results/overview-section.svelte';

  /************* Translations ***************/
  const translations = page.data.t;

  const searchDatasets = translations?.searchDatasets ? translations['searchDatasets'] : 'Search datasets';

  const searchResultsText = translations?.searchResults ? translations['searchResults'] : 'Search results';

  let resultMessage = $derived(page.data.resultMessage);

  let { overviewData } = $props();

  // reacts when overviewData changes
  let currentOverview = $state();

  $effect(() => {
    if (overviewData) {
      currentOverview = overviewData;
    }
  });
</script>

<h1 class="font-custom-style-h1 mt-8 px-5 md:px-0 leading-tight">
  {searchDatasets}
</h1>

<p class="mb-2 mt-3 font-open-sans px-5 md:px-0">
  {resultMessage}
</p>

<SearchBar />

<!-- OVERVIEW
  Show the skeleton immediately when a new Overview will be loaded.
  During pagination, preserve the existing Overview and skip the skeleton.
-->
{#if navigating.to && navigating.type !== null && parseInt(navigating.to.url.searchParams.get('page-number') || '0', 10) === 0}
  <!-- Overview will be loaded -->
  <OverviewSection {overviewData} isLoading={true} />
{:else if currentOverview}
  {#await currentOverview}
    <OverviewSection overviewData={currentOverview} isLoading={true} />
  {:then data}
    <OverviewSection overviewData={data} isLoading={false} />
  {/await}
{/if}

<h2 class="font-custom-style-h2 mt-5 px-5 md:px-0">
  {searchResultsText}
</h2>

<ResultList />

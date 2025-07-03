<script lang="ts">
	import { page, navigating } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import Card from '$lib/components/card/card.svelte';
	import Search from '$lib/components/icons/search.svelte';
	import FilterModal from '$lib/components/search-results/filter-modal.svelte';
	import Filter from '$lib/components/icons/filter.svelte';

	/************* Translations ***************/
	const translations = $page.data.t;

	const filtersText = translations?.filters ? translations['filters'] : 'Filters';
	const searchText = translations?.search ? translations['search'] : 'Search';
	const searchProductsText = translations?.searchProducts
		? translations['searchProducts']
		: 'Search Products';

	const datasetsText = translations?.datasets ? translations['datasets'] : 'Datasets';
	const contributorsText = translations?.contributors
		? translations['contributors']
		: 'Contributors';
	const applicationsText = translations?.applications
		? translations['applications']
		: 'Applications';
	const apisText = translations?.apis ? translations['apis'] : 'APIs';
	const collectionsText = translations?.collections ? translations['collections'] : 'Collections';

	/***************** Data ******************/
	const searchKey = 'search-terms';

	let searchTextInput: HTMLInputElement = $state();
	let analytics = $page.data.analytics;
	let numFilters = $state(0);

	let keywordFromUrl = $derived($page.url.searchParams.get(searchKey));

	// TODO: Get actual numbers for all data variables
	let notApplicable = 'N/A';
	let datasets = analytics?.total ?? notApplicable;
	let contributors = analytics?.organization ?? notApplicable;
	let applications = notApplicable;
	let apis = notApplicable;
	let collections = notApplicable;

	/***************** Handlers ******************/
	let modalActive = $state(false);
	let filterModal = $state();

	function handleFilterButtonClick(event: Event) {
		modalActive = true;
		toggleScroll(modalActive);
		filterModal.setFiltersFromURL();
	}

	function handleSearchClick(event: Event) {
		let searchTerm = searchTextInput?.value;
		applyKeywordSearch(searchTerm);
	}

	function handleSearchEnterKeyDown(event: KeyboardEvent) {
		let key = event.key;
		if (key == 'Enter') {
			let searchTerm = searchTextInput?.value;
			applyKeywordSearch(searchTerm);
		}
	}

	function applyKeywordSearch(keyword: string) {
		let query = new URLSearchParams($page.url.searchParams.toString());
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
		goto(`?${query.toString()}`, opts);
	}
</script>

<FilterModal bind:active={modalActive} bind:numFilters bind:this={filterModal} />
<Card type="searchBar">
	<div class="flex flex-row gap-y-5 flex-wrap md:flex-nowrap">
		<button
			class={`text-nowrap shadow-[0rem_0.1875rem_0.375rem_#00000029]
        ${$navigating ? 'button-3-disabled' : 'button-3'}`}
			onclick={handleFilterButtonClick}
			disabled={$navigating}
		>
			{#if numFilters > 0}
				<span
					class={`px-1 rounded-md font-custom-style-button-2 leading-[0.875rem]
            ${$navigating ? 'bg-custom-17' : 'bg-custom-16'}`}
				>
					{numFilters}
				</span>
			{:else}
				<Filter classes="inline h-5" />
			{/if}
			{filtersText}
		</button>
		<div class="flex flex-nowrap w-full">
			<input
				type="text"
				placeholder={searchProductsText}
				class={`w-full h-12 md:ml-5 px-5 rounded-s-[0.3125rem] font-custom-style-placeholder
          shadow-[inset_0rem_0.1875rem_0.375rem_#00000029] border-y-2 border-l-2 md:border-0
          ${$navigating ? 'border-custom-17' : 'border-custom-16'}`}
				bind:this={searchTextInput}
				onkeydown={handleSearchEnterKeyDown}
				disabled={$navigating}
				value={keywordFromUrl}
			/>
			<button
				class={`text-nowrap h-12 px-5 rounded-e-[0.3125rem]
          font-custom-style-button-3 shadow-[0rem_0.1875rem_0.375rem_#00000029]
          hover:bg-custom-23
          ${$navigating ? 'bg-custom-17' : 'bg-custom-16'}`}
				onclick={handleSearchClick}
				disabled={$navigating}
			>
				<Search classes="inline" height="1.125rem" />
				<span class="hidden md:inline">
					{searchText}
				</span>
			</button>
		</div>
	</div>
	<div
		class="flex flex-row flex-wrap lg:flex-nowrap gap-x-4 gap-y-1 lg:gap-x-7 font-custom-style-body-8"
	>
		<div>{datasetsText}: {datasets}</div>
		<div>{contributorsText}: {contributors}</div>
		<!--
      TODO: Uncomment when we have a query to get this data.
      For now it is always 'N/A' so we don't need to display it.
    -->
		<!--<div>{applicationsText}: {applications}</div>-->
		<!--<div>{apisText}: {apis}</div>-->
		<!--<div>{collectionsText}: {collections}</div>-->
	</div>
</Card>

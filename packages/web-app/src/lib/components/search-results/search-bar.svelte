<script lang="ts">
	import { page, navigating } from '$app/state';
	import { goto } from '$app/navigation';
	import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import Card from '$lib/components/card/card.svelte';
	import Search from '$lib/components/icons/search.svelte';
	import FilterModal from '$lib/components/search-results/filter-modal.svelte';
	import Filter from '$lib/components/icons/filter.svelte';

	/************* Translations ***************/
	const translations = page.data.t;

	const filtersText = translations?.filters ? translations['filters'] : 'Filters';
	const searchText = translations?.search ? translations['search'] : 'Search';
	const searchProductsText = translations?.searchProducts
		? translations['searchProducts']
		: 'Search Products';

	const datasetsText = translations?.datasets ? translations['datasets'] : 'Datasets';
	const contributorsText = translations?.contributors
		? translations['contributors']
		: 'Contributors';

	/***************** Data ******************/
	const searchKey = 'search-terms';

	let searchTextInput: HTMLInputElement | undefined = $state();
	const analytics = page.data.analytics;
	let numFilters = $state(0);

	let keywordFromUrl = $derived(page.url.searchParams.get(searchKey));

	// TODO: Get actual numbers for all data variables
	const notApplicable = 'N/A';
	const datasets = analytics?.total ?? notApplicable;
	const contributors = analytics?.organization ?? notApplicable;

	/***************** Handlers ******************/
	let modalActive: boolean = $state(false);
	let filterModal: FilterModal | undefined = $state();

	/**
	 * Handles the filter button click event.
	 */
	function handleFilterButtonClick(): void {
		modalActive = true;
		toggleScroll(modalActive);
		filterModal?.setFiltersFromURL();
	}

	/**
	 * Handles the search button click event.
	*/
	function handleSearchClick(): void {
		let searchTerm = searchTextInput?.value;
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
			let searchTerm = searchTextInput?.value;
			if (searchTerm) applyKeywordSearch(searchTerm);
		}
	}

	/**
	 * Applies the keyword search by updating the URL parameters and navigating to the search page.
	 * 
	 * @param keyword - The keyword to search for.
	*/
	function applyKeywordSearch(keyword: string): void {
		let query = new URLSearchParams(page.url.searchParams.toString());
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
        ${navigating.type !== null ? 'button-3-disabled' : 'button-3'}`}
			onclick={handleFilterButtonClick}
			disabled={navigating.type !== null}
		>
			{#if numFilters > 0}
				<span
					class={`px-1 rounded-md font-custom-style-button-2 leading-[0.875rem]
            ${navigating.type !== null ? 'bg-custom-17' : 'bg-custom-16'}`}
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
          ${navigating.type !== null ? 'border-custom-17' : 'border-custom-16'}`}
				bind:this={searchTextInput}
				onkeydown={handleSearchEnterKeyDown}
				disabled={navigating.type !== null}
				value={keywordFromUrl}
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

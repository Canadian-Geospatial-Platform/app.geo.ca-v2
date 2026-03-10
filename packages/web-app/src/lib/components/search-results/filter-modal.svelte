<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { updateTempCategoryOfInterest } from '$lib/components/search-results/store';
	import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import { clickOutside } from '$lib/components/component-utils/clickOutside';
	import Close from '$lib/components/icons/close.svelte';
	import Search from '$lib/components/icons/search.svelte';
	import CategoryOfInterest from '$lib/components/search-results/filters/category-of-interest.svelte';
	import Organizations from '$lib/components/search-results/filters/organizations.svelte';
	import Types from '$lib/components/search-results/filters/types.svelte';
	import Themes from '$lib/components/search-results/filters/themes.svelte';
	import EoCollections from '$lib/components/search-results/filters/eo-collections.svelte';
	import SourceSystem from '$lib/components/search-results/filters/source-system.svelte';
	import OtherFilters from '$lib/components/search-results/filters/other-filters.svelte';
	import SpatioTemporal from '$lib/components/search-results/filters/spatio-temporal.svelte';
	import type { BBox, DateRangeItem } from './filters/filter-types';

	interface Props {
		active?: boolean;
		numFilters?: number;
	}

	interface Filters {
		category: string | null;
		relation: string | null;
		bbox: { north: string; east: string; south: string; west: string } | null | undefined;
		dateRange: DateRangeItem | null | undefined;
		other: {
			foundational: boolean;
			mappable: boolean;
		};
		org: { [key: string]: boolean };
		typeFilter: { [key: string]: boolean };
		theme: { [key: string]: boolean };
		eoCollection: { [key: string]: boolean };
		sourceSystem: { [key: string]: boolean };
	}

	let { active = $bindable(false), numFilters = $bindable(0) }: Props = $props();

	const translations = page.data.t;

	const filterByText = translations?.filterBy ?? 'Filter By';
	const filterDescriptionText = translations?.filterDescription ?? '';
	const clearAllText = translations?.clearAll ?? 'Clear All';
	const searchText = translations?.search ?? 'Search';

	let temporalActive = $state(false);
	let spatialActive = $state(false);

	const categoriesKey = 'category-of-interest';
	const orgKey = 'org';
	const typeKey = 'type';
	const themeKey = 'theme';
	const foundationalKey = 'foundational';
	const mappableKey = 'mappable';
	const eoCollectionKey = 'eo_collection';
	const sourceSystemKey = 'source_system';
	const bboxKey = 'bbox';
	const dateRangeKey = 'dateRange';
	const delineator = ',';

	let categoriesComponent: CategoryOfInterest | undefined= $state();
	let othersCompontent: OtherFilters | undefined = $state();
	let orgCompontent: Organizations | undefined = $state();
	let themeCompontent: Themes | undefined = $state();
	let typeCompontent: Types | undefined = $state();
	let spatioTemporalComponent: SpatioTemporal | undefined = $state();
	let eoCollectionsComponent: EoCollections | undefined = $state();
	let sourceSystemComponent: SourceSystem | undefined = $state();

	let searchParams = $derived(page.url.searchParams);
	$effect(() => {
		setFilterCountFromUrl(searchParams);
	});

	/************* Handlers ***************/
	/**
	 * Handles close button click event to close the modal.
	 */
	function handleCloseButtonClick(): void {
		closeModal();
	}

	/**
	 * Handles clear all button click event to reset all filters.
	 */
	function handleClearAllClick(): void {
		temporalActive = false;
		spatialActive = false;
		updateTempCategoryOfInterest(null);
		clearAllChecks();
	}

	/**
	 * Handles form submission to apply filters.
	 * 
	 * @param event - The form submission event.
	 */
	function handleSubmit(event: Event): void {
		event.preventDefault();
		const formEl = event.target;
		if (!(formEl instanceof HTMLFormElement)) return;

		const formData = new FormData(formEl);
		const categoryVal = categoriesComponent?.getValue();

		const filters = {
			category: categoryVal ? categoryVal : null,
			relation:
				formData.get('spatial-relation') && formData.get('spatio-temporal-spatial-extent')
					? formData.get('spatial-relation')?.toString() || null
					: null,
			bbox: formData.get('spatio-temporal-spatial-extent') ? parseBoundingBox() : null,
			dateRange: formData.get('spatio-temporal-temporal-extent') ? parseDateRange() : null,
			other: {
				foundational: formData.has('others-foundational'),
				mappable: formData.has('others-mappable')
			},
			org: {},
			typeFilter: {},
			theme: {},
			eoCollection: {},
			sourceSystem: {}
		};

		for (let [key, value] of formData.entries()) {
			if (key.startsWith('org-')) {
				(filters.org as { [key: string]: boolean })[key.replace('org-', '')] = value === 'on';
			} else if (key.startsWith('type-')) {
				(filters.typeFilter as { [key: string]: boolean })[key.replace('type-', '')] = value === 'on';
			} else if (key.startsWith('theme-')) {
				(filters.theme as { [key: string]: boolean })[key.replace('theme-', '')] = value === 'on';
			} else if (key.startsWith('eo_collection-')) {
				(filters.eoCollection as { [key: string]: boolean })[key.replace('eo_collection-', '')] = value === 'on';
			} else if (key.startsWith('source_system-')) {
				(filters.sourceSystem as { [key: string]: boolean })[key.replace('source_system-', '')] = value === 'on';
			}
		}

		numFilters = countFilters(filters);

		const query = buildFilterParams(filters);
		goto(`?${query.toString()}`, { replaceState: true, keepFocus: true });

		closeModal();
	}

	/**
	 * Handles click outside event to close the dropdown.
	 */
	function handleClickOutside(): void {
		if (active) {
			closeModal();
		}
	}

	/************* utility methods ***************/
	/**
	 * Resets all filters based on the URL parameters.
	 */
	export function setFiltersFromURL(): void {
		if (categoriesComponent) categoriesComponent.resetFilters();
		if (orgCompontent) orgCompontent.resetFilters();
		if (othersCompontent) othersCompontent.resetFilters();
		if (typeCompontent) typeCompontent.resetFilters();
		if (themeCompontent) themeCompontent.resetFilters();
		if (spatioTemporalComponent) spatioTemporalComponent.resetFilters();
		if (eoCollectionsComponent) eoCollectionsComponent.resetFilters();
		if (sourceSystemComponent) sourceSystemComponent.resetFilters();
	}

	/**
	 * Sets the filter count based on the URL parameters.
	 * 
	 * @param searchParams - The URL search parameters.
	 */
	function setFilterCountFromUrl(searchParams: URLSearchParams): void {
		const filterLists = {
			bboxList: getList(bboxKey, false, searchParams),
			categoryList: getList(categoriesKey, false, searchParams),
			dateRangeList: getList('begin', false, searchParams),
			foundationalList: getList(foundationalKey, false, searchParams),
			mappableList: getList(mappableKey, false, searchParams),
			orgList: getList(orgKey, true, searchParams),
			typeFilterList: getList(typeKey, true, searchParams),
			themeList: getList(themeKey, true, searchParams),
			eoCollectionList: getList(eoCollectionKey, true, searchParams),
			sourceSystemList: getList(sourceSystemKey, true, searchParams)
		};

		numFilters = countFilters(filterLists);
	}

	/**
	 * Clears all filter selections in child components.
	 */
	function clearAllChecks(): void {
		if (orgCompontent) orgCompontent.clearAllFilters();
		if (othersCompontent) othersCompontent.clearAllFilters();
		if (typeCompontent) typeCompontent.clearAllFilters();
		if (themeCompontent) themeCompontent.clearAllFilters();
		if (eoCollectionsComponent) eoCollectionsComponent.clearAllFilters();
		if (sourceSystemComponent) sourceSystemComponent.clearAllFilters();
		if (spatioTemporalComponent) spatioTemporalComponent.clearAllFilters();
	}

	// TODO: get rid of null returns in the two functions below by adjusting the SpatioTemporal component methods,
	// TODOCONT: or get rid of undefined if the components must be set.

	/**
	 * Parses the bounding box from the Spatio-Temporal component.
	 * 
	 * @returns The bounding box or null/undefined if not set.
	 */
	function parseBoundingBox(): BBox | null | undefined {
		return spatioTemporalComponent?.getBBox();
	}

	/**
	 * Parses the date range from the Spatio-Temporal component.
	 * 
	 * @returns The date range or null/undefined if not set.
	 */
	function parseDateRange(): DateRangeItem | null | undefined {
		return spatioTemporalComponent?.getDateRange();
	}

	/**
	 * Counts the number of active filters.
	 * 
	 * @param filters - The filters object.
	 * @returns The count of active filters.
	 */
	function countFilters(filters: object): number {
		let filterCount = 0;

		for (const [key, value] of Object.entries(filters)) {
			if (typeof value === 'object' && value !== null && key != bboxKey && key != dateRangeKey) {
				filterCount = filterCount + countFilters(value);
			} else if (value) {
				filterCount = filterCount + 1;
			}
		}

		return filterCount;
	}

	/**
	 * Builds the URL search parameters based on the filters.
	 * 
	 * @param filters - The filters object.
	 * @returns The URL search parameters.
	 */
	function buildFilterParams(filters: Filters): URLSearchParams {
		const bbox: BBox | null | undefined = filters.bbox;
		const relation = filters.relation;
		const category = filters.category;
		const dateRange: DateRangeItem | null | undefined = filters.dateRange;
		const foundational = filters.other.foundational;
		const mappable = filters.other.mappable;
		const org = filters.org;
		const typeFilter = filters.typeFilter;
		const theme = filters.theme;
		const eoCollections = filters.eoCollection;
		const sourceSystem = filters.sourceSystem;

		const query = new URLSearchParams(page.url.searchParams.toString());

		// BBOX
		if (bbox) {
			query.set('north', bbox.north);
			query.set('east', bbox.east);
			query.set('south', bbox.south);
			query.set('west', bbox.west);
			query.set(bboxKey, `${bbox.south}|${bbox.west}|${bbox.north}|${bbox.east}`);
		} else {
			query.delete('north');
			query.delete('east');
			query.delete('south');
			query.delete('west');
			query.delete(bboxKey);
		}

		relation ? query.set('relation', relation) : query.delete('relation');

		// Date range
		if (dateRange) {
			query.set('begin', dateRange.begin);
			query.set('end', dateRange.end);
		} else {
			query.delete('begin');
			query.delete('end');
		}

		category ? query.set(categoriesKey, category) : query.delete(categoriesKey);

		foundational ? query.set(foundationalKey, String(foundational)) : query.delete(foundationalKey);
		mappable ? query.set(mappableKey, String(mappable)) : query.delete(mappableKey);

		const orgString = getFilterStringFromObj(Object.entries(org));
		orgString ? query.set(orgKey, orgString) : query.delete(orgKey);

		const typeFilterString = getFilterStringFromObj(Object.entries(typeFilter));
		typeFilterString ? query.set(typeKey, typeFilterString) : query.delete(typeKey);

		const themeString = getFilterStringFromObj(Object.entries(theme));
		themeString ? query.set(themeKey, themeString) : query.delete(themeKey);

		const eoCollectionString = getFilterStringFromObj(Object.entries(eoCollections));
		eoCollectionString
			? query.set(eoCollectionKey, eoCollectionString)
			: query.delete(eoCollectionKey);

		const sourceSystemString = getFilterStringFromObj(Object.entries(sourceSystem));
		sourceSystemString
			? query.set(sourceSystemKey, sourceSystemString)
			: query.delete(sourceSystemKey);

		// When filters change, reset the page and pagination element back to the start
		query.set('page-number', '0');

		return query;
	}

	/**
	 * Converts a filter object to a delimited string of active filter keys.
	 * 
	 * @param filterObj - The filter entries array.
	 * @returns The delimited string of active filter keys.
	 */
	function getFilterStringFromObj(filterObj: Array<[string, boolean]>): string {
		const checkedEntries = filterObj.filter(([, checked]) => checked);
		const checkedKeys = checkedEntries.map(([key]) => key);
		return checkedKeys.join(delineator);
	}

	/**
	 * Retrieves a list from the URL search parameters.
	 * 
	 * @param key - The key to retrieve.
	 * @param split - Whether to split the value into an array.
	 * @param searchParams - The URL search parameters.
	 * @returns The retrieved value or array of values.
	 */
	function getList(key: string, split: boolean, searchParams: URLSearchParams): string | string[] | null {
		const value = searchParams.getAll(key)[0];
		return split && value ? value.split(delineator) : value;
	}

	/**
	 * Closes the filter modal and toggles scroll.
	 */
	function closeModal(): void {
		active = false;
		toggleScroll(active);
	}
</script>

<!-- Note: we need the z-index to be 10020 so that it is above the header and the map loading mask (geoview has this set at 9999) -->
<div
	role="dialog"
	aria-modal="true"
	tabindex="0"
	class={[
		'fixed flex justify-center z-[10020] inset-0 bg-custom-7/75 overflow-y-scroll hide-scroll pb-4',
		!active && 'hidden'
	]}
	onkeydown={(event) => {
		if (event.key === 'Escape') closeModal();
	}}
>
	<form
		class="md:grid md:grid-cols-6 bg-custom-1 border border-custom-21 w-full md:w-2/3 h-fit md:mt-2 m-5 md:m-0"
		onsubmit={handleSubmit}
		use:clickOutside={handleClickOutside}
	>
		<div class="col-span-5 flex flex-col gap-5 px-5 pb-5 pt-8 font-custom-style-body-1">
			<div>
				<h1 class="font-custom-style-h1-2">{filterByText}</h1>
				<p>{filterDescriptionText}</p>
			</div>
			<div class="flex flex-col gap-y-5">
				<CategoryOfInterest bind:this={categoriesComponent} />
				<SpatioTemporal
					bind:temporalActive
					bind:spatialActive
					bind:this={spatioTemporalComponent}
				/>
				<Organizations bind:this={orgCompontent} />
				<Types bind:this={typeCompontent} />
				<Themes bind:this={themeCompontent} />
				<EoCollections bind:this={eoCollectionsComponent} />
				<SourceSystem bind:this={sourceSystemComponent} />
				<OtherFilters bind:this={othersCompontent} />
			</div>
		</div>
		<div class="absolute md:static top-2 right-4 col-span-1 px-5 pt-8 justify-self-end">
			<button
				type="button"
				class="flex justify-center items-center border border-custom-16 rounded-[50%]
          h-9 w-9 md:h-[3.0625rem] md:w-[3.0625rem] hover:bg-custom-16 text-custom-16
          hover:text-custom-1"
				onclick={handleCloseButtonClick}
			>
				<Close classes="h-4 md:h-[1.3125rem]" />
			</button>
		</div>
		<div
			class="grid grid-cols-1 md:grid-cols-2 col-span-6 bg-custom-5 md:border-t border-custom-21
        px-5 py-7 md:py-[1.125rem] gap-y-8"
		>
			<button
				type="button"
				class="row-start-2 md:row-start-1 w-full md:w-auto justify-self-start button-3
          h-12 md:h-auto"
				onclick={handleClearAllClick}
			>
				{clearAllText}
			</button>
			<button
				type="submit"
				class="w-full md:w-auto justify-self-end button-5 h-12 md:h-auto
          shadow-[0rem_0.1875rem_0.375rem_#00000029]"
			>
				<Search classes="inline" height="1.125rem" />
				{searchText}
			</button>
		</div>
	</form>
</div>

<style lang="postcss">
	.hide-scroll {
		-ms-overflow-style: none; /* Edge */
		scrollbar-width: none; /* Firefox */
	}

	.hide-scroll::-webkit-scrollbar {
		@apply hidden; /* Chrome */
	}
</style>

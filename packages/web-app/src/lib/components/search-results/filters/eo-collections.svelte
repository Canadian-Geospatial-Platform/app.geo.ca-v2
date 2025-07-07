<script lang="ts">
	import { page } from '$app/stores';
	import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
	import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

	/************* Filter Data ***************/
	const filters = $page.data.filters.filters;
	const eoCollections = filters.find((x: Filter) => x.section === 'eo_collection');
	let checkedStates = $state({});

	// Reset filters based on current URL search params
	export function resetFilters() {
		let eoCollectionKey = $page.url.searchParams.get('eo_collection');
		if (eoCollections) {
			eoCollections.filterList.forEach((filterListItem) => {
				const key = filterListItem.value;
				checkedStates[key] = eoCollectionKey?.includes(key) || false;
			});
		}
	}

	export function clearAllFilters() {
		checkedStates = {};
	}
</script>

<h3 class="font-custom-style-h3">
	{eoCollections?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
	{#each eoCollections.filterList as filterListItem}
		<CheckboxCustomized
			checkboxId={eoCollections.section + '-' + filterListItem.value}
			checkboxName={eoCollections.section + '-' + filterListItem.value}
			checkboxLabel={filterListItem.label}
			checked={checkedStates[filterListItem.value] || false}
			checkedStateChange={(event) => (checkedStates[filterListItem.value] = event.target.checked)}
		/>
	{/each}
</div>

<style>
	@media (min-width: 64rem) {
		.custom-grid {
			grid-template-columns: repeat(auto-fit, minmax(min(8.75rem, 100%), max-content));
		}
	}
</style>
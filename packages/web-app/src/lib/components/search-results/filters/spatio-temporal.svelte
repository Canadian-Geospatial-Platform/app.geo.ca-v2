<script lang="ts">
	import { page } from '$app/stores';
	import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
	import DateRange from '$lib/components/search-results/filters/date-range.svelte';
	import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';
	import BoundingBox from './bounding-box.svelte';

	interface Props {
		temporalActive?: boolean;
		spatialActive?: boolean;
	}

	let { temporalActive = $bindable(false), spatialActive = $bindable(false) }: Props = $props();

	/************* Filter Data ***************/
	const filters = $page.data.filters.filters;
	const spatioTemporalFilters = filters.find((x: Filter) => x.section === 'spatio-temporal');
	const section = spatioTemporalFilters.section;
	const label = spatioTemporalFilters.label;
	const filterList = spatioTemporalFilters.filterList;

	let checkedStates = $state({});
	let temporalComponent = $state();
	let spatialComponent = $state();

	export function resetFilters() {
		const spatialKey = $page.url.searchParams.get('bbox');
		const beginKey = $page.url.searchParams.get('begin');
		const endKey = $page.url.searchParams.get('end');

		// Update checkbox states
		checkedStates['spatial-extent'] = !!spatialKey;
		spatialActive = !!spatialKey;

		checkedStates['temporal-extent'] = !!(beginKey && endKey);
		temporalActive = !!(beginKey && endKey);

		// Reset child components
		spatialComponent?.resetFilters();
		temporalComponent?.resetFilters();
	}

	export function clearAllFilters() {
		checkedStates = {};
		spatialComponent?.resetFilters();
		temporalComponent?.resetFilters();
	}

	export function getBBox() {
		return spatialComponent.getBBox();
	}

	export function getDateRange() {
		return temporalComponent.getDateRange();
	}

	/************* Handlers ***************/
	function handleCheckboxClick(event: CustomEvent) {
		let checkbox = event.target as HTMLInputElement;

		if (checkbox.id == 'spatio-temporal-temporal-extent') {
			temporalActive = !temporalActive;
			checkedStates['temporal-extent'] = event.target.checked;
		} else if (checkbox.id == 'spatio-temporal-spatial-extent') {
			spatialActive = !spatialActive;
			checkedStates['spatial-extent'] = event.target.checked;
		}
	}
</script>

<h3 class="font-custom-style-h3">{label}</h3>
<div class="space-y-[1.125rem]">
	{#each filterList as filterListItem}
		<CheckboxCustomized
			checkboxId={section + '-' + filterListItem.value}
			checkboxName={section + '-' + filterListItem.value}
			checkboxLabel={filterListItem.label}
			checked={checkedStates[filterListItem.value] || false}
			checkedStateChange={handleCheckboxClick}
		/>
		{#if filterListItem.value == 'spatial-extent'}
			<div class={[!spatialActive && 'hidden']}>
				<BoundingBox
					coordinatesId={section}
					bind:active={spatialActive}
					bind:this={spatialComponent}
				/>
			</div>
		{:else if filterListItem.value == 'temporal-extent'}
			<div class={[!temporalActive && 'hidden']}>
				<DateRange dateId={section} bind:active={temporalActive} bind:this={temporalComponent} />
			</div>
		{/if}
	{/each}
</div>

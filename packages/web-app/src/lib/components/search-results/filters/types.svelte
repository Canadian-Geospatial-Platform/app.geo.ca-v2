<script lang="ts">
	import { page } from '$app/stores';
	import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
	import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

	/************* Filter Data ***************/
	const filters = $page.data.filters.filters;
	const types = filters.find((x: Filter) => x.section === 'type');
	let checkedStates = $state<Record<string, boolean>>({});

	/************* Translations ***************/
	const translations = $page.data.t;
	const conditionLabel = translations?.condition ?? 'Condition:';
	const anyLabel = translations?.anyLabel ?? 'Any (OR)';
	const allLabel = translations?.allLabel ?? 'All (AND)';

	// Type logic
	let typeLogic = $state<'any' | 'all'>('any');

	// Reset from URL (this is what restores state when reopening)
	export function resetFilters() {
		const typeKey = $page.url.searchParams.get('type');
		const logic = $page.url.searchParams.get('type_logic');

		if (logic === 'all' || logic === 'any') {
			typeLogic = logic;
		}

		if (types) {
			types.filterList.forEach((filterListItem) => {
				const key = filterListItem.value;
				checkedStates[key] = typeKey?.includes(key) || false;
			});
		}
	}

	export function clearAllFilters() {
		checkedStates = {};
		typeLogic = 'any';
	}

	// Update local state
	function onTypeLogicChange(value: 'any' | 'all') {
		typeLogic = value;
	}

	// Expose to parent
	export function getLogic() {
		return typeLogic;
	}
</script>

<h3 class="font-custom-style-h3">{types?.label}</h3>

<!-- Condition dropdown -->
<div class="mb-2 flex items-center gap-2">
	<span class="text-sm text-gray-600">{conditionLabel}</span>
	<select
		id="type-logic"
		class="border rounded px-2 py-1 text-sm"
		bind:value={typeLogic}
		onchange={(e) => onTypeLogicChange(e.target.value)}
	>
		<option value="any">{anyLabel}</option>
		<option value="all">{allLabel}</option>
	</select>
</div>

<!-- Theme checkboxes -->
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
	{#each types?.filterList ?? [] as filterListItem}
		<CheckboxCustomized
			checkboxId={types.section + '-' + filterListItem.value}
			checkboxName={types.section + '-' + filterListItem.value}
			checkboxLabel={filterListItem.label}
			checked={checkedStates[filterListItem.value] || false}
			checkedStateChange={(event) =>
				(checkedStates[filterListItem.value] = event.target.checked)
			}
		/>
	{/each}
</div>

<style>
	@media (min-width: 64rem) {
		.custom-grid {
			grid-template-columns: repeat(
				auto-fit,
				minmax(min(8.75rem, 100%), max-content)
			);
		}
	}
</style>
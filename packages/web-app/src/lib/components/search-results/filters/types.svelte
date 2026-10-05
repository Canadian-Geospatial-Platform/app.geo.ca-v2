<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
  import type { SelectOption } from '$lib/components/select-customized/selected-types.d.ts';
  import type { Filter, FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = page.data.filters?.filters;
  const types = filters?.find((filter: Filter) => filter.section === 'type');
  let checkedStates = $state<Record<string, boolean>>({});

  /************* Translations ***************/
  const translations = page.data.t;
  const conditionLabel = translations?.condition ?? 'Condition:';
  const anyLabel = translations?.anyLabel ?? 'Any (OR)';
  const allLabel = translations?.allLabel ?? 'All (AND)';
  const logicOptions: SelectOption[] = [
    { value: 'any', label: anyLabel },
    { value: 'all', label: allLabel },
  ];

  let typeLogic = $state<'any' | 'all'>('any');
  let selectedLogic = $state<SelectOption | undefined>(logicOptions[0]);

  /**
   * Resets from URL (this is what restores state when reopening)
   */
  export function resetFilters(): void {
    const typeKey = page.url.searchParams.get('type');
    const logic = page.url.searchParams.get('type_logic');

    if (logic === 'all' || logic === 'any') {
      typeLogic = logic;
      selectedLogic = logicOptions.find((option) => option.value === logic) ?? logicOptions[0];
    }

    if (types) {
      types.filterList.forEach((filterListItem: FilterItem) => {
        const key = filterListItem.value;
        checkedStates[key] = typeKey?.includes(key) || false;
      });
    }
  }

  /**
   * Clears all Type filters
   */
  export function clearAllFilters(): void {
    checkedStates = {};
    typeLogic = 'any';
    selectedLogic = logicOptions[0];
  }

  /**
   * Updates local state
   */
  function onTypeLogicChange(option: SelectOption | null): void {
    const nextLogic = option?.value === 'all' ? 'all' : 'any';
    typeLogic = nextLogic;
    selectedLogic = logicOptions.find((logicOption) => logicOption.value === nextLogic) ?? logicOptions[0];
  }

  /**
   * Exposes to parent
   */
  export function getLogic(): 'any' | 'all' {
    return typeLogic;
  }
</script>

<h3 class="font-custom-style-h3">{types?.label}</h3>

<!-- Condition dropdown -->
<div class="mb-2 flex items-center gap-2">
  <span class="text-base text-gray-600">{conditionLabel}</span>
  <div class="w-full max-w-52">
    <SelectCustomized optionsData={logicOptions} bind:selected={selectedLogic} selectedChange={onTypeLogicChange} />
  </div>
</div>

<!-- Type checkboxes -->
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each types?.filterList ?? [] as filterListItem, index (index)}
    <CheckboxCustomized
      checkboxId={`${types?.section}-${filterListItem.value}`}
      checkboxName={`${types?.section}-${filterListItem.value}`}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
      checkedStateChange={(event: Event) => (checkedStates[filterListItem.value] = (event.target as HTMLInputElement)?.checked)}
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

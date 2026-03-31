<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter, FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = page.data.filters.filters;
  const types = filters.find((filter: Filter) => filter.section === 'type');
  let checkedStates: Record<string, boolean> = $state({});

  /**
   * Resets the Type filters to match the URL parameters.
   */
  export function resetFilters(): void {
    let typeKey = page.url.searchParams.get('type');
    if (types) {
      types.filterList.forEach((filterListItem: FilterItem) => {
        const key = filterListItem.value;
        checkedStates[key] = typeKey?.includes(key) || false;
      });
    }
  }

  /**
   * Clears all Type filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {types?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each types.filterList as filterListItem (`${types.section}-${filterListItem.value}`)}
    <CheckboxCustomized
      checkboxId={`${types.section}-${filterListItem.value}`}
      checkboxName={`${types.section}-${filterListItem.value}`}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
      checkedStateChange={(event) => (checkedStates[filterListItem.value] = (event.target as HTMLInputElement).checked)}
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

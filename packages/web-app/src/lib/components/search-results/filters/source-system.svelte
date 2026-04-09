<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = page.data.filters!.filters;
  const sourceSystems: Filter = filters.find((filter: Filter) => filter.section === 'source_system')!;
  let checkedStates: Record<string, boolean | string> = $state({});

  /**
   * Resets the Source System filters to match the URL parameters.
   */
  export function resetFilters(): void {
    let sourceSystemKey = page.url.searchParams.get('source_system');
    sourceSystems.filterList.forEach((filterListItem) => {
      const key = filterListItem.value;
      checkedStates[key] = sourceSystemKey?.includes(key) || false;
    });
  }

  /**
   * Clears all Source System filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {sourceSystems.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each sourceSystems.filterList as filterListItem (`${sourceSystems.section}-${filterListItem.value}`)}
    <CheckboxCustomized
      checkboxId={`${sourceSystems.section}-${filterListItem.value}`}
      checkboxName={`${sourceSystems.section}-${filterListItem.value}`}
      checkboxLabel={filterListItem.label}
      checked={!!checkedStates[filterListItem.value] || false}
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

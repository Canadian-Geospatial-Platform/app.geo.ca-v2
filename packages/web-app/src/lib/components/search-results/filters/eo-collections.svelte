<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter, FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = page.data.filters.filters;
  const eoCollections = filters.find((filter: Filter) => filter.section === 'eo_collection');
  let checkedStates: Record<string, boolean> = $state({});

  // TODO: Extract this and clearAllFilters from here, organisations.svelte, source-system.svelte, themes.svelte, and types.svelte into a utility file
  /**
   * Resets the EO Collections filters to match the URL parameters.
   */
  export function resetFilters(): void {
    let eoCollectionKey = page.url.searchParams.get('eo_collection');
    if (eoCollections) {
      eoCollections.filterList.forEach((filterListItem: FilterItem) => {
        const key = filterListItem.value;
        checkedStates[key] = eoCollectionKey?.includes(key) || false;
      });
    }
  }

  /**
   * Clears all EO Collections filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {eoCollections?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each eoCollections.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={`${eoCollections.section}-${filterListItem.value}`}
      checkboxName={`${eoCollections.section}-${filterListItem.value}`}
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

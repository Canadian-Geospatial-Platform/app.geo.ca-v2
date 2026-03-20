<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter, FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters: Filter[] = page.data.filters.filters;
  const others = filters.find((filter: Filter) => filter.section === 'others');
  let checkedStates: Record<string, boolean | string> = $state({});

  /**
   * Resets the Other filters to match the URL parameters.
   */
  export function resetFilters(): void {
    let filterList = others?.filterList.map((filter: FilterItem) => filter.value);

    if (filterList)
      filterList.forEach((filterName: string) => {
        let filterKey = page.url.searchParams.get(filterName);
        checkedStates[filterName] = filterKey || false;
      });
  }

  /**
   * Clears all Other filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {others?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each others?.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={others?.section + '-' + filterListItem.value}
      checkboxName={others?.section + '-' + filterListItem.value}
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

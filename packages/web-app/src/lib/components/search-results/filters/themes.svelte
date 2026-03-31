<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter, FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = page.data.filters.filters;
  const themes = filters.find((filter: Filter) => filter.section === 'theme');
  let checkedStates: Record<string, boolean> = $state({});

  /**
   * Resets the Theme filters to match the URL parameters.
   */
  export function resetFilters(): void {
    let themeKey = page.url.searchParams.get('theme');
    if (themes) {
      themes.filterList.forEach((filterListItem: FilterItem) => {
        const key = filterListItem.value;
        checkedStates[key] = themeKey?.includes(key) || false;
      });
    }
  }

  /**
   * Clears all Theme filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {themes?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each themes.filterList as filterListItem (`${themes.section}-${filterListItem.value}`)}
    <CheckboxCustomized
      checkboxId={`${themes.section}-${filterListItem.value}`}
      checkboxName={`${themes.section}-${filterListItem.value}`}
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

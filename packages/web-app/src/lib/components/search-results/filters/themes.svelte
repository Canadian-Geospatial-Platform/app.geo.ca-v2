<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const themes = filters.find((x: Filter) => x.section === 'theme');
  let checkedStates: { [key: string]: boolean } = {};

  // Reset filters based on current URL search params
  export function resetFilters() {
    let themeKey = $page.url.searchParams.get('theme');
    if (themes) {
      themes.filterList.forEach((filterListItem) => {
        const key = filterListItem.value;
        checkedStates[key] = themeKey?.includes(key) || false;
      });
    }
  }

  export function clearAllFilters() {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {themes?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each themes.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={themes.section + "-" + filterListItem.value}
      checkboxName={themes.section + "-" + filterListItem.value}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
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

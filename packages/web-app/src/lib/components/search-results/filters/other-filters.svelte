<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const others = filters.find((x: Filter) => x.section === 'others');
  let checkedStates: { [key: string]: boolean } = {};

  // Reset filters based on current URL search params
  export function resetFilters() {
    let filterList = others.filterList.map((x) => x.value);

    filterList.forEach((filterName) => {
      let filterKey = $page.url.searchParams.get(filterName);
      checkedStates[filterName] = filterKey || false;
    });
  }

  export function clearAllFilters() {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {others?.label}
</h3>
<div class="grid gap-x-4 gap-y-[18px] grid-cols-1 custom-grid">
  {#each others.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={others.section + "-" + filterListItem.value}
      checkboxName={others.section + "-" + filterListItem.value}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
    />
  {/each}
</div>

<style>
  @media (min-width: 1024px) {
    .custom-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), max-content));
    }
  }
</style>

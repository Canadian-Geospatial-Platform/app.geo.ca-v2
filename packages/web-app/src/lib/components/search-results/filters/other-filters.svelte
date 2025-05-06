<script lang="ts">
  import { page } from '$app/stores';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const others = filters.find((x: Filter) => x.section === 'others');
  let checkedStates = $state({});

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
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each others.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={others.section + "-" + filterListItem.value}
      checkboxName={others.section + "-" + filterListItem.value}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
      checkedStateChange={
        (event) => checkedStates[filterListItem.value] = event.target.checked
      }
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

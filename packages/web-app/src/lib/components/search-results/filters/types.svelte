<script lang="ts">
  import { page } from '$app/stores';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const types = filters.find((x: Filter) => x.section === 'type');
  let checkedStates: { [key: string]: boolean } = {};

  export function resetFilters() {
    let typeKey = $page.url.searchParams.get('type');
    if (types) {
      types.filterList.forEach((filterListItem) => {
        const key = filterListItem.value;
        checkedStates[key] = typeKey?.includes(key) || false;
      });
    }
  }

  export function clearAllFilters() {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {types?.label}
</h3>
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each types.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={types.section + "-" + filterListItem.value}
      checkboxName={types.section + "-" + filterListItem.value}
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

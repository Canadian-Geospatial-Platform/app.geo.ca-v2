<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const organizations = filters.find((x: Filter) => x.section === 'org');
  let checkedStates: { [key: string]: boolean } = {};

  // Reset filters based on current URL search params
  export function resetFilters() {
    let orgKey = $page.url.searchParams.get('org');
    if (organizations) {
      organizations.filterList.forEach((filterListItem) => {
        const key = filterListItem.value;
        checkedStates[key] = orgKey?.includes(key) || false;
      });
    }
  }

  export function clearAllFilters() {
    checkedStates = {};
  }
</script>

<h3 class="font-custom-style-h3">
  {organizations?.label}
</h3>
<div class="space-y-[18px] lg:columns-2">
  {#each organizations.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={organizations.section + "-" + filterListItem.value}
      checkboxName={organizations.section + "-" + filterListItem.value}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
    />
  {/each}
</div>

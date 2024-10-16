<script lang="ts">
  import { page } from '$app/stores';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  export let tempNumFilters: number;

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const others = filters.find((x: Filter) => x.section == "others");

  function init(key: string) {
    return $page.url.searchParams.get(key) == 'on' ? true : false;
	}

  /************* Handlers ***************/
  function handleCheckboxClick(event: CustomEvent) {
    let detail = event.detail;
    let checkbox = detail.target as HTMLInputElement;
    if (checkbox.checked == true) {
      tempNumFilters = tempNumFilters + 1;
    } else {
      tempNumFilters = tempNumFilters - 1;
    }
  }

</script>

<h3 class="font-custom-style-h3">
  {others?.label}
</h3>
<div class="grid gap-x-4 gap-y-[18px] grid-cols-1 custom-grid">
  {#each others.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={others.section + "-" + filterListItem.value}
      checkboxName={others.section}
      checkboxLabel={filterListItem.label}
      checked={init(others.section + "-" + filterListItem.value)}
      on:checkedStateChange={handleCheckboxClick}
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

<script lang="ts">
  import { page } from '$app/stores';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  export let tempNumFilters: number;

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const organizations = filters.find((x: Filter) => x.section == "org");

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
  {organizations?.label}
</h3>
<div class="space-y-[18px] lg:columns-2">
  {#each organizations.filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={organizations.section + "-" + filterListItem.value}
      checkboxName={organizations.section}
      checkboxLabel={filterListItem.label}
      checked={init(organizations.section + "-" + filterListItem.value)}
      on:checkedStateChange={handleCheckboxClick}
    />
  {/each}
</div>

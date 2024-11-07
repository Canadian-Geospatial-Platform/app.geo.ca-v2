<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const others = filters.find((x: Filter) => x.section == "others");

  let checkedStates: { [key: string]: boolean } = {};

  export function resetFilters() {
    let filterList = others.filterList.map((x) => x.value);
    let filterKey;
    let el;
    let keyActive;

    filterList.forEach((filterName) => {
      filterKey = $page.url.searchParams.get(filterName);
      el = document.getElementById(others.section + "-" + filterName);
      if (el) {
        keyActive = filterKey ? true : false;
        el.checked = keyActive;
        checkedStates[filterName] = keyActive;
      }
    });
  }

	async function init(key: string) {
    await tick();
    let othersKey = $page.url.searchParams.get(key);
    let filterIsActive = othersKey;

    checkedStates[key] = filterIsActive;

    return filterIsActive;
	}

  onMount(() => {
    others?.filterList.forEach(async (filterListItem) => {
      await init(filterListItem.value);
    });
  });

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

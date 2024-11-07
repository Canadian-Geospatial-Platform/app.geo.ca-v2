<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const types = filters.find((x: Filter) => x.section == "type");

  let checkedStates: { [key: string]: boolean } = {};

  export function resetFilters() {
    let typeKey = $page.url.searchParams.get('type');
    let el;
    let keyActive;

    for (let [key, value] of Object.entries(checkedStates)) {
      el = document.getElementById(types.section + "-" + key);
      if (el) {
        keyActive = typeKey && typeKey.includes(key) ? true : false;
        el.checked = keyActive;
        checkedStates.key = keyActive;
      }
    }
  }

  async function init(key: string) {
    await tick();
    let typeKey = $page.url.searchParams.get('type');
    let filterIsActive = false;

    if (typeKey && typeKey.includes(key)) {
      filterIsActive = true;
    }

    checkedStates[key] = filterIsActive;

    return filterIsActive
	}

  onMount(() => {
    types?.filterList.forEach(async (filterListItem) => {
      await init(filterListItem.value);
    });
  });

</script>

<h3 class="font-custom-style-h3">
  {types?.label}
</h3>
<div class="grid gap-x-4 gap-y-[18px] grid-cols-1 custom-grid">
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
  @media (min-width: 1024px) {
    .custom-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), max-content));
    }
  }
</style>

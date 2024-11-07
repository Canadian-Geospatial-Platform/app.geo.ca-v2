<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const organizations = filters.find((x: Filter) => x.section == "org");

  let checkedStates: { [key: string]: boolean } = {};

  export function resetFilters() {
    let orgKey = $page.url.searchParams.get('org');
    let el;
    let keyActive;

    for (let [key, value] of Object.entries(checkedStates)) {
      el = document.getElementById(organizations.section + "-" + key);
      if (el) {
        keyActive = orgKey && orgKey.includes(key) ? true : false;
        el.checked = keyActive;
        checkedStates.key = keyActive;
      }
    }
  }

  async function init(key: string) {
    await tick();
    let orgKey = $page.url.searchParams.get('org');
    let filterIsActive = false;

    if (orgKey && orgKey.includes(key)) {
      filterIsActive = true;
    }

    checkedStates[key] = filterIsActive;

    return filterIsActive;
	}

  onMount(() => {
    organizations?.filterList.forEach(async (filterListItem) => {
      await init(filterListItem.value);
    });
  });

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

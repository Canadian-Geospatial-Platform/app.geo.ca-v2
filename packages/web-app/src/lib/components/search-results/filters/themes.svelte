<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const themes = filters.find((x: Filter) => x.section == "theme");

  let checkedStates: { [key: string]: boolean } = {};

  export function resetFilters() {
    let themeKey = $page.url.searchParams.get('theme');
    let el;
    let keyActive;

    for (let [key, value] of Object.entries(checkedStates)) {
      el = document.getElementById(themes.section + "-" + key);
      if (el) {
        keyActive = themeKey && themeKey.includes(key) ? true : false;
        el.checked = keyActive;
        checkedStates.key = keyActive;
      }
    }
  }

  async function init(key: string) {
    await tick();
    let themeKey = $page.url.searchParams.get('theme');
    let filterIsActive = false;

    if (themeKey && themeKey.includes(key)) {
      filterIsActive = true;
    }

    checkedStates[key] = filterIsActive;

    return filterIsActive
	}

  onMount(() => {
    themes?.filterList.forEach(async (filterListItem) => {
      await init(filterListItem.value);
    });
  });

</script>

<h3 class="font-custom-style-h3">
  {themes?.label}
</h3>
<div class="grid gap-x-4 gap-y-[18px] grid-cols-1 custom-grid">
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
  @media (min-width: 1024px) {
    .custom-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), max-content));
    }
  }
</style>

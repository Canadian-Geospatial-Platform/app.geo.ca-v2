<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import DateRange from '$lib/components/search-results/filters/date-range.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';
	import BoundingBox from './bounding-box.svelte';

  export let temporalActive: boolean = false;
  export let spatialActive: boolean = false;

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const spatioTemporalFilters = filters.find((x: Filter) => x.section == "spatio-temporal");
  const section = spatioTemporalFilters.section;
  const label = spatioTemporalFilters.label;
  const filterList = spatioTemporalFilters.filterList;

  let checkedStates: { [key: string]: boolean } = {};
  let temporalComponent;
  let spatialComponent;

  export function resetFilters() {
    let spatialKey = $page.url.searchParams.get('bbox');
    let beginKey = $page.url.searchParams.get('begin');
    let endKey = $page.url.searchParams.get('end');
    let spatialEl = document.getElementById(section + "-spatial-extent");
    let temporalEl = document.getElementById(section + "-temporal-extent");
    let keyActive;

    if (spatialEl) {
      keyActive = spatialKey ? true : false;
      spatialEl.checked = keyActive;
      checkedStates['spatial-extent'] = keyActive;
      spatialActive = keyActive;

      spatialComponent.resetFilters();
    }

    if (temporalEl) {
      keyActive = beginKey && endKey ? true : false;
      temporalEl.checked = keyActive;
      checkedStates['temporal-extent'] = keyActive;
      temporalActive = keyActive;

      temporalComponent.resetFilters();
    }
  }

  async function init(key: string) {
    await tick();
    let filterIsActive: boolean;
    if (key == 'spatial-extent') {
      let spatioTemporalKey = $page.url.searchParams.get('bbox');
      filterIsActive = spatioTemporalKey ? true : false;
      spatialActive = filterIsActive;
    } else if (key == 'temporal-extent') {
      let beginKey = $page.url.searchParams.get('begin');
      let endKey = $page.url.searchParams.get('end');
      filterIsActive = beginKey && endKey ? true : false;
      temporalActive = filterIsActive;
    }
    checkedStates[key] = filterIsActive;

    return filterIsActive;
	}

  onMount(() => {
    spatioTemporalFilters?.filterList.forEach(async (filterListItem) => {
      await init(filterListItem.value);
    });
  });

  /************* Handlers ***************/
  function handleCheckboxClick(event: CustomEvent) {
    let detail = event.detail;
    let checkbox = detail.target as HTMLInputElement;

    if (checkbox.id == 'spatio-temporal-temporal-extent') {
      temporalActive = !temporalActive;
    } else if (checkbox.id == 'spatio-temporal-spatial-extent') {
      spatialActive = !spatialActive;
    }
  }

</script>

<h3 class="font-custom-style-h3">{label}</h3>
<div class="space-y-[18px]">
  {#each filterList as filterListItem}
    <CheckboxCustomized
      checkboxId={section + "-" + filterListItem.value}
      checkboxName={section + "-" + filterListItem.value}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
      on:checkedStateChange={handleCheckboxClick}
    />
    {#if filterListItem.value == "spatial-extent"}
      <div class:hidden={!spatialActive}>
        <BoundingBox coordinatesId={section} bind:active={spatialActive} bind:this={spatialComponent} />
      </div>
    {:else if filterListItem.value == "temporal-extent"}
      <div class:hidden={!temporalActive}>
        <DateRange dateId={section} bind:active={temporalActive} bind:this={temporalComponent} />
      </div>
    {/if}
  {/each}
</div>

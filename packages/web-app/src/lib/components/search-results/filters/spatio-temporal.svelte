<script lang="ts">
  import { page } from '$app/stores';
  import CheckboxCustomized from '$lib/components/search-results/checkbox-customized.svelte';
  import DateRange from '$lib/components/search-results/filters/date-range.svelte';
  import type { Filter } from '$lib/components/search-results/filters/filter-types.d.ts';
	import BoundingBox from './bounding-box.svelte';

  export let tempNumFilters: number;
  export let temporalActive: boolean = false;
  export let spatialActive: boolean = false;

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const spatioTemporalFilters = filters.find((x: Filter) => x.section == "spatio-temporal");
  const section = spatioTemporalFilters.section;
  const label = spatioTemporalFilters.label;
  const filterList = spatioTemporalFilters.filterList;

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
      checkboxName={section}
      checkboxLabel={filterListItem.label}
      checked={init(section + "-" + filterListItem.value)}
      on:checkedStateChange={handleCheckboxClick}
    />
    {#if filterListItem.value == "spatial-extent"}
      <div class:hidden={!spatialActive}>
        <BoundingBox coordinatesId={section} coordinatesName={section} bind:active={spatialActive} />
      </div>
    {:else if filterListItem.value == "temporal-extent"}
      <div class:hidden={!temporalActive}>
        <DateRange dateId={section} dateName={section} bind:active={temporalActive} />
      </div>
    {/if}
  {/each}
</div>

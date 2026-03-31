<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import DateRange from '$lib/components/search-results/filters/date-range.svelte';
  import type { BBox, DateRangeItem, Filter } from '$lib/components/search-results/filters/filter-types.d.ts';
  import BoundingBox from './bounding-box.svelte';

  interface Props {
    temporalActive?: boolean;
    spatialActive?: boolean;
  }

  let { temporalActive = $bindable(false), spatialActive = $bindable(false) }: Props = $props();

  /************* Filter Data ***************/
  const filters = page.data.filters!.filters;
  const spatioTemporalFilters = filters.find((filter: Filter) => filter.section === 'spatio-temporal')!;
  const section = spatioTemporalFilters.section;
  const label = spatioTemporalFilters.label;
  const filterList = spatioTemporalFilters.filterList;

  let checkedStates: Record<string, boolean | string> = $state({});
  let temporalComponent: DateRange | undefined = $state();
  let spatialComponent: BoundingBox | undefined = $state();

  /**
   * Resets the Spatio-Temporal filters to match the URL parameters.
   */
  export function resetFilters(): void {
    const spatialKey = page.url.searchParams.get('bbox');
    const beginKey = page.url.searchParams.get('begin');
    const endKey = page.url.searchParams.get('end');

    // Update checkbox states
    checkedStates['spatial-extent'] = !!spatialKey;
    spatialActive = !!spatialKey;

    checkedStates['temporal-extent'] = !!(beginKey && endKey);
    temporalActive = !!(beginKey && endKey);

    // Reset child components
    spatialComponent?.resetFilters();
    temporalComponent?.resetFilters();
  }

  /**
   * Clears all Spatio-Temporal filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
    spatialComponent?.resetFilters();
    temporalComponent?.resetFilters();
  }

  /**
   * Gets the bounding box from the Spatial component.
   *
   * @returns The bounding box or undefined if not set.
   */
  export function getBBox(): BBox | null | undefined {
    return spatialComponent?.getBBox();
  }

  /**
   * Gets the date range from the Temporal component.
   *
   * @returns The date range or undefined if not set.
   */
  export function getDateRange(): DateRangeItem | null | undefined {
    return temporalComponent?.getDateRange();
  }

  /************* Handlers ***************/
  /**
   * Handles checkbox click events to toggle spatial and temporal filters.
   *
   * @param event - The checkbox click event.
   */
  function handleCheckboxClick(event: Event): void {
    let checkbox = event.target as HTMLInputElement;

    if (checkbox.id === 'spatio-temporal-temporal-extent') {
      temporalActive = !temporalActive;
      checkedStates['temporal-extent'] = checkbox?.checked;
    } else if (checkbox.id === 'spatio-temporal-spatial-extent') {
      spatialActive = !spatialActive;
      checkedStates['spatial-extent'] = checkbox?.checked;
    }
  }
</script>

<h3 class="font-custom-style-h3">{label}</h3>
<div class="space-y-[1.125rem]">
  {#each filterList as filterListItem (`${section}-${filterListItem.value}`)}
    <CheckboxCustomized
      checkboxId={`${section}-${filterListItem.value}`}
      checkboxName={`${section}-${filterListItem.value}`}
      checkboxLabel={filterListItem.label}
      checked={!!checkedStates[filterListItem.value] || false}
      checkedStateChange={handleCheckboxClick}
    />
    {#if filterListItem.value === 'spatial-extent'}
      <div class={[!spatialActive && 'hidden']}>
        <BoundingBox coordinatesId={section} bind:active={spatialActive} bind:this={spatialComponent} />
      </div>
    {:else if filterListItem.value === 'temporal-extent'}
      <div class={[!temporalActive && 'hidden']}>
        <DateRange dateId={section} bind:active={temporalActive} bind:this={temporalComponent} />
      </div>
    {/if}
  {/each}
</div>

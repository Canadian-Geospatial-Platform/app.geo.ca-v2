<script lang="ts">
  import { page } from '$app/state';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter, FilterItem } from '$lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = page.data.filters?.filters;
  const themes = filters?.find((filter: Filter) => filter.section === 'theme');
  let checkedStates = $state<Record<string, boolean>>({});

  /************* Translations ***************/
  const translations = page.data.t;
  const conditionLabel = translations?.condition ?? 'Condition:';
  const anyLabel = translations?.anyLabel ?? 'Any (OR)';
  const allLabel = translations?.allLabel ?? 'All (AND)';

  let themeLogic = $state<'any' | 'all'>('any');

  /**
   * Resets from URL (this is what restores state when reopening)
   */
  export function resetFilters(): void {
    const typeKey = page.url.searchParams.get('theme');
    const logic = page.url.searchParams.get('theme_logic');

    if (logic === 'all' || logic === 'any') {
      themeLogic = logic;
    }

    if (themes) {
      themes.filterList.forEach((filterListItem: FilterItem) => {
        const key = filterListItem.value;
        checkedStates[key] = typeKey?.includes(key) || false;
      });
    }
  }

  /**
   * Clears all Theme filters
   */
  export function clearAllFilters(): void {
    checkedStates = {};
    themeLogic = 'any';
  }

  /**
   * Updates local state
   */
  function onThemeLogicChange(value: 'any' | 'all'): void {
    themeLogic = value;
  }

  /**
   * Exposes to parent
   */
  export function getLogic(): 'any' | 'all' {
    return themeLogic;
  }
</script>

<h3 class="font-custom-style-h3">{themes?.label}</h3>

<!-- Condition dropdown -->
<div class="mb-2 flex items-center gap-2">
  <span class="text-sm text-gray-600">{conditionLabel}</span>
  <select
    id="theme-logic"
    class="border rounded px-2 py-1 text-sm"
    bind:value={themeLogic}
    onchange={(event: Event) => onThemeLogicChange((event.target as HTMLSelectElement)?.value as 'any' | 'all')}
  >
    <option value="any">{anyLabel}</option>
    <option value="all">{allLabel}</option>
  </select>
</div>

<!-- Theme checkboxes -->
<div class="grid gap-x-4 gap-y-[1.125rem] grid-cols-1 custom-grid">
  {#each themes?.filterList ?? [] as filterListItem, index (index)}
    <CheckboxCustomized
      checkboxId={`${themes?.section}-${filterListItem.value}`}
      checkboxName={`${themes?.section}-${filterListItem.value}`}
      checkboxLabel={filterListItem.label}
      checked={checkedStates[filterListItem.value] || false}
      checkedStateChange={(event: Event) => (checkedStates[filterListItem.value] = (event.target as HTMLInputElement)?.checked)}
    />
  {/each}
</div>

<style>
  @media (min-width: 64rem) {
    .custom-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(8.75rem, 100%), max-content));
    }
  }
</style>

<script lang="ts">
  import { getComponentLabels, getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import CheckboxCustomized from '#lib/components/checkbox-customized/checkbox-customized.svelte';
  import SelectCustomized from '#lib/components/select-customized/select-customized.svelte';
  import type { SelectOption } from '#lib/components/select-customized/selected-types.d.ts';
  import type { Filter, FilterItem } from '#lib/components/search-results/filters/filter-types.d.ts';

  /************* Filter Data ***************/
  const filters = $derived(getTranslations(getAppLanguage(page.data.lang ?? page.params.lang)).components.searchResults.filters.filters);
  const themes = $derived(filters?.find((filter: Filter) => filter.section === 'theme'));
  let checkedStates = $state<Record<string, boolean>>({});

  /************* Translations ***************/
  const translations = $derived(getComponentLabels(getAppLanguage(page.data.lang ?? page.params.lang), 'searchResults'));
  const logicOptions: SelectOption[] = $derived([
    { value: 'any', label: translations.anyLabel },
    { value: 'all', label: translations.allLabel },
  ]);

  let themeLogic = $state<'any' | 'all'>('any');
  let selectedLogic = $derived(logicOptions.find((option) => option.value === themeLogic));

  /**
   * Resets from URL (this is what restores state when reopening)
   */
  export function resetFilters(): void {
    const typeKey = page.url.searchParams.get('theme');
    const logic = page.url.searchParams.get('theme_logic');

    if (logic === 'all' || logic === 'any') {
      themeLogic = logic;
      selectedLogic = logicOptions.find((option) => option.value === logic) ?? logicOptions[0];
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
    selectedLogic = logicOptions[0];
  }

  /**
   * Updates local state
   */
  function onThemeLogicChange(option: SelectOption | null): void {
    const nextLogic = option?.value === 'all' ? 'all' : 'any';
    themeLogic = nextLogic;
    selectedLogic = logicOptions.find((logicOption) => logicOption.value === nextLogic) ?? logicOptions[0];
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
  <span class="text-base text-gray-600">{translations.condition}</span>
  <div class="w-full max-w-52">
    <SelectCustomized optionsData={logicOptions} bind:selected={selectedLogic} selectedChange={onThemeLogicChange} />
  </div>
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

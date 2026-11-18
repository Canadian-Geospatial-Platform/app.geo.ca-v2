<script lang="ts">
  import { getAppLanguage } from '#lib/utils/language.js';
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import CheckboxCustomized from '#lib/components/checkbox-customized/checkbox-customized.svelte';
  import type { Filter, FilterItem } from './filter-types';

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const searchResultsTranslations = $derived(getTranslations(appLang).components.searchResults);

  // Organizations filter data
  const organizations: Filter = $derived(searchResultsTranslations.filters.find((filter: Filter) => filter.section === 'org')!);
  let checkedStates: Record<string, boolean> = $state({});

  /**
   * Resets the Organizations filters to match the URL parameters.
   */
  export function resetFilters(): void {
    let orgKey = page.url.searchParams.get('org');
    organizations.filterList.forEach((filterListItem: FilterItem) => {
      const key = filterListItem.value;
      checkedStates[key] = orgKey?.includes(key) || false;
    });
  }

  /**
   * Clears all Organizations filters.
   */
  export function clearAllFilters(): void {
    checkedStates = {};
  }
</script>

<!-- Federal -->
<h3 class="font-custom-style-h3">
  {searchResultsTranslations.organizations.federal}
</h3>
<div class="space-y-[1.125rem] lg:columns-2">
  {#each organizations.filterList as filterListItem (`${organizations.section}-${filterListItem.value}`)}
    {#if filterListItem.subCategory === 'fed'}
      <div class="break-inside-avoid">
        <CheckboxCustomized
          checkboxId={`${organizations.section}-${filterListItem.value}`}
          checkboxName={`${organizations.section}-${filterListItem.value}`}
          checkboxLabel={filterListItem.label}
          checked={checkedStates[filterListItem.value] || false}
          checkedStateChange={(event) => (checkedStates[filterListItem.value] = (event.target as HTMLInputElement).checked)}
        />
      </div>
    {/if}
  {/each}
</div>

<!-- Provincial/Territorial -->
<h3 class="font-custom-style-h3">
  {searchResultsTranslations.organizations.provincial}
</h3>
<div class="space-y-[1.125rem] lg:columns-2">
  {#each organizations.filterList as filterListItem (`${organizations.section}-${filterListItem.value}`)}
    {#if filterListItem.subCategory === 'prov'}
      <div class="break-inside-avoid">
        <CheckboxCustomized
          checkboxId={`${organizations.section}-${filterListItem.value}`}
          checkboxName={`${organizations.section}-${filterListItem.value}`}
          checkboxLabel={filterListItem.label}
          checked={checkedStates[filterListItem.value] || false}
          checkedStateChange={(event) => (checkedStates[filterListItem.value] = (event.target as HTMLInputElement).checked)}
        />
      </div>
    {/if}
  {/each}
</div>

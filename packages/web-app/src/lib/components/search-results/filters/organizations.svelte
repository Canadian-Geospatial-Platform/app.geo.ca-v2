<script lang="ts">
  import { page } from '$app/stores';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const organizations = filters.find((x: Filter) => x.section === 'org');
  let checkedStates = $state({});

  // Labels
  const federal = $page.lang == 'fr-ca' ?
    'Organisations - Fédérales' : 'Organizations - Federal';
  const provincial = $page.lang == 'fr-ca' ?
    'Organisations - Provinciales/Territoriales' : 'Organizations - Provincial/Territorial';

  // Reset filters based on current URL search params
  export function resetFilters() {
    let orgKey = $page.url.searchParams.get('org');
    if (organizations) {
      organizations.filterList.forEach((filterListItem) => {
        const key = filterListItem.value;
        checkedStates[key] = orgKey?.includes(key) || false;
      });
    }
  }

  export function clearAllFilters() {
    checkedStates = {};
  }
</script>

<!-- Federal -->
<h3 class="font-custom-style-h3">
  {federal}
</h3>
<div class="space-y-[1.125rem] lg:columns-2">
  {#each organizations.filterList as filterListItem}
    {#if filterListItem.subCategory == 'fed'}
      <div class="break-inside-avoid">
        <CheckboxCustomized
          checkboxId={organizations.section + "-" + filterListItem.value}
          checkboxName={organizations.section + "-" + filterListItem.value}
          checkboxLabel={filterListItem.label}
          checked={checkedStates[filterListItem.value] || false}
          checkedStateChange={
            (event) => checkedStates[filterListItem.value] = event.target.checked
          }
        />
      </div>
    {/if}
  {/each}
</div>

<!-- Provincial/Territorial -->
<h3 class="font-custom-style-h3">
  {provincial}
</h3>
<div class="space-y-[1.125rem] lg:columns-2">
  {#each organizations.filterList as filterListItem}
    {#if filterListItem.subCategory == 'prov'}
      <div class="break-inside-avoid">
        <CheckboxCustomized
          checkboxId={organizations.section + "-" + filterListItem.value}
          checkboxName={organizations.section + "-" + filterListItem.value}
          checkboxLabel={filterListItem.label}
          checked={checkedStates[filterListItem.value] || false}
          checkedStateChange={
            (event) => checkedStates[filterListItem.value] = event.target.checked
          }
        />
      </div>
    {/if}
  {/each}
</div>

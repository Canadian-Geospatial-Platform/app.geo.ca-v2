<script lang="ts">
  import { getComponentLabels } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { getContentLanguage, getAppLanguage } from '#lib/utils/language.js';
  import { parseDataResources } from '#lib/components/record/tabbed/parseDataResources.js';
  import SortableTable from '#lib/components/sortable-table/sortable-table.svelte';

  type DataResourcesRow = {
    name: string;
    type: string;
    format: string;
    languages: string;
  };

  /******************* Translations *******************/
  const translations = $derived(getComponentLabels(getAppLanguage(page.data.lang ?? page.params.lang), 'record'));

  /******************* Data *******************/
  const data = page.data;
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const contentLang = $derived(getContentLanguage(appLang));
  const items = data.item_v2!;
  const dataResourcesRaw = items.options;

  const dataResourcesList = $derived(parseDataResources(dataResourcesRaw, contentLang));
  const uuid = items.id;

  // Translation of table column labels
  const tableLabels: DataResourcesRow = $derived({
    name: translations.name,
    type: translations.type,
    format: translations.format,
    languages: translations.languages,
  });

  /**
   * Handles the click event for the download metadata button. Opens the Geocore metadata download URL in a new window.
   */
  function handleDownloadButtonClick(): void {
    let downloadUrl = `https://geocore.metadata.geo.ca/${uuid}.geojson`;
    window.open(downloadUrl);
  }

  /**
   * Handles the click event for the view ISO1915 button. Opens the ISO1915 metadata view URL in a new window.
   */
  function handleViewISO1915ButtonClick(): void {
    let downloadUrl = `https://csw.open.canada.ca/geonetwork/srv/csw?service=CSW&version=2.0.2&request=GetRecordById&outputSchema=csw:IsoRecord&ElementSetName=full&id=${uuid}`;
    window.open(downloadUrl);
  }
</script>

{#if dataResourcesList.length > 0}
  <!-- Large screen table -->
  <div class="hidden md:block">
    <SortableTable tableContent={dataResourcesList} {tableLabels} clickableRows={true} />
  </div>

  <!-- Small - medium screen table -->
  <div class="block md:hidden mobile-list-card">
    {#each dataResourcesList as dataResource, index (`${index}-${dataResource.name}`)}
      <div class="py-5">
        <!-- Resource Name -->
        <h2 class="font-custom-style-h2-2 pb-2 hover:underline">
          <a href={dataResource.url} rel="external">
            {dataResource.name}
          </a>
        </h2>

        <!-- Resource Type -->
        <div class="block sm:inline pr-3">
          <h3 class="font-custom-style-h3-2 inline">
            {translations.type}:
          </h3>
          <p class="font-custom-style-body-9 inline">
            {dataResource.type}
          </p>
        </div>

        <!-- Resource format -->
        <div class="block sm:inline pr-3">
          <h3 class="font-custom-style-h3-2 inline">
            {translations.format}:
          </h3>
          <p class="font-custom-style-body-9 inline">
            {dataResource.format}
          </p>
        </div>

        <!-- Resource Languages -->
        <div class="block sm:inline pr-3">
          <h3 class="font-custom-style-h3-2 inline">
            {translations.languages}:
          </h3>
          <p class="font-custom-style-body-9 inline">
            {dataResource.languages}
          </p>
        </div>
      </div>
    {/each}
  </div>
{:else}
  <div>
    {translations.resourcesNotAvailable}
  </div>
{/if}

<!-- Geocore and HNAP buttons -->
<div class="flex flex-col sm:flex-row gap-4 pt-2">
  <button class="w-full sm:w-auto button-utility-dark" on:click={handleDownloadButtonClick}>
    {translations.downloadMetadata}
  </button>
  <button class="w-full sm:w-auto button-utility-light" on:click={handleViewISO1915ButtonClick}>
    {translations.viewISO1915}
  </button>
</div>

<style lang="postcss">
  @reference "../../../../app.css";
  button {
    @apply cursor-pointer;
    @apply px-6;
    @apply py-2;
    @apply border-2;
    @apply border-custom-16;
    @apply rounded;
  }
</style>

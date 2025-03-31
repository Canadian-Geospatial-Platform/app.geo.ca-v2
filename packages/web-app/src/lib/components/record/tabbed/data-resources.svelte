<script lang="ts">
  import { page } from "$app/stores";
  import { parseDataResources } from '$lib/components/record/tabbed/parseDataResources';
	import SortableTable from "$lib/components/sortable-table/sortable-table.svelte";

  type DataResourcesRow = {
    name: string;
    type: string;
    format: string;
    languages: string;
    button_3d: string;
  };

  /******************* Translations *******************/
  const translations = $page.data.t;

  // Buttons
  const downloadMetadataText = translations?.downloadMetadata ?
    translations["downloadMetadata"] : "Download Metadata";
  const viewISO1915Text = translations?.viewISO1915 ? translations["viewISO1915"] : "View ISO1915 Record";

  // Row labels
  const nameText = translations?.name ? translations["name"] : "Name";
  const typeText = translations?.type ? translations["type"] : "Type";
  const formatText = translations?.format ? translations["format"] : "Format";
  const languagesText = translations?.languages ? translations["languages"] : "Languages";
  const resourcesNotAvailable = translations?.resourcesNotAvailable ? translations["resourcesNotAvailable"] : "";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const items = data.item_v2;
  const properties = items.properties;

  const dataResourcesRaw = properties['options'];
  const dataResourcesList = parseDataResources(dataResourcesRaw, langShort);
  const uuid = properties.id;

  // Translation of table column labels
  const tableLabels: DataResourcesRow = {
    "name": nameText,
    "type": typeText,
    "format": formatText,
    "languages": languagesText,
    "button_3d": ""
  };

  function handleDownloadButtonClick() {
    let downloadUrl = "https://geocore.metadata.geo.ca/" + uuid + ".geojson";
    window.open(downloadUrl);
  };

  function handleViewISO1915ButtonClick() {
    let downloadUrl = "https://csw.open.canada.ca/geonetwork/srv/csw?service=CSW&version=2.0.2&request=GetRecordById&outputSchema=csw:IsoRecord&ElementSetName=full&id=" + uuid;
    window.open(downloadUrl);
  }
</script>

<!-- Geocore and HNAP buttons -->
<div class="flex flex-col sm:flex-row gap-4 pb-2">
  <button 
    class="w-full sm:w-auto bg-custom-16 text-custom-1 font-custom-style-body-5"
    on:click={handleDownloadButtonClick}
  >
    {downloadMetadataText}
  </button>
  <button
    class="w-full sm:w-auto bg-custom-1 text-custom-16 font-custom-style-body-3"
    on:click={handleViewISO1915ButtonClick}
  >
    {viewISO1915Text}
  </button>
</div>

{#if dataResourcesList.length > 0}
  <!-- Large screen table -->
  <div class="hidden md:block">
    <SortableTable tableContent={dataResourcesList} {tableLabels} {properties} clickableRows={true} />
  </div>

  <!-- Small - medium screen table -->
  <div class="block md:hidden rounded bg-custom-1 px-5 drop-shadow-[0_0.1875rem_0.375rem_#00000029] divide-y divide-custom-17">
    {#each dataResourcesList as dataResource, index}
      <div class="py-5">
        <!-- Resource Name -->
        <h2 class="font-custom-style-h2-2 pb-2 hover:underline">
          <a href={dataResource.url}>
            {dataResource.name}
          </a>
        </h2>

        <!-- Resource Type -->
        <div class="block sm:inline pr-3">
          <h3 class="font-custom-style-h3-2 inline">
            {typeText}:
          </h3>
          <p class="font-custom-style-body-9 inline">
            {dataResource.type}
          </p>
        </div>

        <!-- Resource format -->
        <div class="block sm:inline pr-3">
          <h3 class="font-custom-style-h3-2 inline">
            {formatText}:
          </h3>
          <p class="font-custom-style-body-9 inline">
            {dataResource.format}
          </p>
        </div>

        <!-- Resource Languages -->
        <div class="block sm:inline pr-3">
          <h3 class="font-custom-style-h3-2 inline">
            {languagesText}:
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
    {resourcesNotAvailable}
  </div>
{/if}

<style>
  button {
    @apply px-6;
    @apply py-2;
    @apply border-2;
    @apply border-custom-16;
    @apply rounded;
  }
</style>

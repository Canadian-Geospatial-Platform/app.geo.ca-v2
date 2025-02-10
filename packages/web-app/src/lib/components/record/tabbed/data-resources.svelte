<script lang="ts">
  import { page } from "$app/stores";
  import { parseDataResources } from '$lib/components/record/tabbed/parseDataResources';
  import Accordion from '$lib/components/accordion/accordion.svelte';

  type DataResourcesRow = {
    name: string;
    type: string;
    format: string;
    languages: string;
  };

  /******************* Translations *******************/
  const translations = $page.data.t;

  // Buttons
  const downloadGeoCoreText = translations?.downloadGeoCore ?
    translations["downloadGeoCore"] : "Download GeoCore";
  const viewHNAPText = translations?.viewHNAP ? translations["viewHNAP"] : "View HNAP Record";

  // Row labels
  const nameText = translations?.name ? translations["name"] : "Name";
  const typeText = translations?.type ? translations["type"] : "Type";
  const formatText = translations?.format ? translations["format"] : "Format";
  const languagesText = translations?.languages ? translations["languages"] : "Languages";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const items = data.item_v2;
  const properties = items.properties;

  const dataResourcesRaw = properties['options'];
  const dataResourcesList = parseDataResources(dataResourcesRaw, langShort);
  const uuid = properties.id;

  // TODO: check to make sure these are the up to date download links
  function handleDownloadButtonClick() {
    let downloadUrl = "https://geocore.metadata.geo.ca/" + uuid + ".geojson";
    window.open(downloadUrl);
  };

  function handleViewHNAPButtonClick() {
    let downloadUrl = "https://csw.open.canada.ca/geonetwork/srv/csw?service=CSW&version=2.0.2&request=GetRecordById&outputSchema=csw:IsoRecord&ElementSetName=full&id=" + uuid;
    window.open(downloadUrl);
  }
</script>

<!-- TODO: Commenting this section out for now since
  these buttons might be moved to the menu instead,
  waiting on changes to the wireframe -->

<!--<div class="flex flex-col md:flex-row gap-4">-->
<!--  <button -->
<!--    class="w-full md:w-auto bg-custom-16 text-custom-1 font-custom-style-body-5"-->
<!--    on:click={handleDownloadButtonClick}-->
<!--  >-->
<!--    {downloadGeoCoreText}-->
<!--  </button>-->
<!--  <button-->
<!--    class="w-full md:w-auto bg-custom-1 text-custom-16 font-custom-style-body-3"-->
<!--    on:click={handleViewHNAPButtonClick}-->
<!--  >-->
<!--    {viewHNAPText}-->
<!--  </button>-->
<!--</div>-->

{#each dataResourcesList as dataResource, index}
  <div class="rounded bg-custom-1 px-5 py-4 drop-shadow-[0_0.1875rem_0.375rem_#00000029]">
    <Accordion bind:this={accordionComponents[index]}>
      {#snippet accordionTitle()}
        <h2 class="font-custom-style-h2-2">
          <a href={dataResource.url}>
            {dataResource.name}
          </a>
        </h2>
      {/snippet}
      {#snippet accordionContent()}
        <div  class="mt-5">
          <div class="bg-custom-5 px-6 py-2.5 border-t border-x border-custom-9">
            <h3 class="font-custom-style-h3 ">
              {typeText}
            </h3>
            <p class="font-custom-style-body-4">
              {dataResource.type}
            </p>
          </div>
          <div class="bg-custom-5 px-6 py-2.5 border-t border-x border-custom-9">
            <h3 class="font-custom-style-h3">
              {formatText}
            </h3>
            <p class="font-custom-style-body-4">
              {dataResource.format}
            </p>
          </div>
          <div class="bg-custom-5 px-6 py-2.5 border border-custom-9">
            <h3 class="font-custom-style-h3">
              {languagesText}
            </h3>
            <p class="font-custom-style-body-4">
              {dataResource.languages}
            </p>
          </div>
        </div>
      {/snippet}
    </Accordion>
  </div>
{/each}

<style>
  /*button {*/
  /*  @apply px-6;*/
  /*  @apply py-2;*/
  /*  @apply border-2;*/
  /*  @apply border-custom-16;*/
  /*}*/
</style>

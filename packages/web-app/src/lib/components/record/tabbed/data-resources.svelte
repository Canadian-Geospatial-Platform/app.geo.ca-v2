<script lang="ts">
  import { page } from "$app/stores";
  import { parseDataResources } from '$lib/components/record/tabbed/parseDataResources';
	import SortableTable from "$lib/components/sortable-table/sortable-table.svelte";

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

  // Translation of table column labels
  const tableLabels: DataResourcesRow = {
    "name": nameText,
    "type": typeText,
    "format": formatText,
    "languages": languagesText
  };

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
<SortableTable tableContent={dataResourcesList} {tableLabels} clickableRows={true} />

<style>
  /*button {*/
  /*  @apply px-6;*/
  /*  @apply py-2;*/
  /*  @apply border-2;*/
  /*  @apply border-custom-16;*/
  /*}*/
</style>

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
  const downloadGeoCoreText = Object.hasOwn(translations,"downloadGeoCore") ?
    translations["downloadGeoCore"] : "Download GeoCore";
  const viewHNAPText = Object.hasOwn(translations,"viewHNAP") ?
    translations["viewHNAP"] : "View HNAP Record";

  // Row labels
  const nameText = Object.hasOwn(translations,"name") ?
    translations["name"] : "Name";
  const typeText = Object.hasOwn(translations,"type") ?
    translations["type"] : "Type";
  const formatText = Object.hasOwn(translations,"format") ?
    translations["format"] : "Format";
  const languagesText = Object.hasOwn(translations,"languages") ?
    translations["languages"] : "Languages";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const items = data.item_v2;
  const properties = items.properties;

  const dataResourcesRaw = properties['options'];
  const dataResourcesList = parseDataResources(dataResourcesRaw, langShort);

  // Translation of table column labels
  const tableLabels: DataResourcesRow = {
    "name": nameText,
    "type": typeText,
    "format": formatText,
    "languages": languagesText
  };
</script>

<div class="space-x-4">
  <button class="bg-custom-16 text-custom-1 font-custom-style-body-5">
    {downloadGeoCoreText}
  </button>
  <button class="bg-custom-1 text-custom-16 font-custom-style-body-3">
    {viewHNAPText}
  </button>
</div>
<SortableTable tableContent={dataResourcesList} tableLabels={tableLabels} clickableRows={true} />

<style>
  button {
    @apply px-6;
    @apply py-2;
    @apply border-2;
    @apply border-custom-16;
  }
</style>

<script lang="ts">
  import { page } from "$app/stores";
	import SortableTable from "$lib/components/sortable-table/sortable-table.svelte";

  type AdvMetadataRow = {
    label: string;
    description: string;
  };

  /******************* Translations *******************/
  const translations = $page.data.t;

  // Row labels
  const statusText = translations?.status ? translations["status"] : "Status";
  const maintenanceText = translations?.maintenance ? translations["maintenance"] : "Maintenance";
  const idText = translations?.id ? translations["id"] : "ID";
  const topicCategoryText = translations?.topicCategory ? translations["topicCategory"] : "Topic Category";
  const typeText = translations?.type ? translations["type"] : "Type";
  const northText = translations?.north ? translations["north"] : "North";
  const eastText = translations?.east ? translations["east"] : "East";
  const westText = translations?.west ? translations["west"] : "West";
  const southText = translations?.south ? translations["south"] : "South";
  const spatialRepresentationText = translations?.spatialRepresentation ?
    translations["spatialRepresentation"] : "Spatial Representation";
  const projectionText = translations?.spatialRepresentation ? translations["projection"] : "Projection";

  const labelText = translations?.label ? translations["label"] : "Label";
  const descriptionText = translations?.description ? translations["description"] : "Description";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const items = data.item_v2;
  const properties = items.properties;
  const geographicExtent = properties.extent.geographicExtent;

  const url = $page.url;
  const mapBrowserUrl = url.origin + '/' + lang + '/map-browser';
  const searchUrl = mapBrowserUrl + '?search-terms=';

  const status = properties.status[langShort];
  const maintenance = properties.maintenance[langShort];
  const id = data.uuid;

  // Each topic category should be a link back to the search page
  const topicCategoryArray = properties.topicCategory.map((x) => {
    const label = x.label[langShort].toLowerCase();
    return `<a href="${searchUrl}${encodeURIComponent(label)}" class="underline text-custom-16">${label}</a>`;
  });
  const topicCategory = topicCategoryArray.join(', ');

  const type = properties.type[langShort];
  const north = geographicExtent.north;
  const east = geographicExtent.east;
  const west = geographicExtent.west;
  const south = geographicExtent.south;
  const spatialRepresentation = properties.spatialRepresentation[langShort];
  const projectionArray = properties.refSys.map((x) => {return x.code});
  const projection = projectionArray.join(', ');

  // Table Array
  const tableDataArray: Array<AdvMetadataRow> = [
    {"label": statusText.toUpperCase(),"description": status},
    {"label": maintenanceText.toUpperCase(),"description": maintenance},
    {"label": idText.toUpperCase(),"description": id},
    {"label": topicCategoryText.toUpperCase(),"description": topicCategory},
    {"label": typeText.toUpperCase(),"description": type},
    {"label": northText.toUpperCase(),"description": north},
    {"label": eastText.toUpperCase(),"description": east},
    {"label": westText.toUpperCase(),"description": west},
    {"label": southText.toUpperCase(),"description": south},
    {"label": spatialRepresentationText.toUpperCase(),"description": spatialRepresentation},
    {"label": projectionText.toUpperCase(),"description": projection}
  ]

  // Translation of table column labels
  const tableLabels: AdvMetadataRow = {"label": labelText,"description": descriptionText};
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

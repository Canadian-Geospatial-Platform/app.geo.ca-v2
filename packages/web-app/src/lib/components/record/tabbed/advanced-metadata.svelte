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
  const statusText = Object.hasOwn(translations,"status") ?
    translations["status"] : "Status";
  const maintenanceText = Object.hasOwn(translations,"maintenance") ?
    translations["maintenance"] : "Maintenance";
  const idText = Object.hasOwn(translations,"id") ?
    translations["id"] : "ID";
  const topicCategoryText = Object.hasOwn(translations,"topicCategory") ?
    translations["topicCategory"] : "Topic Category";
  const typeText = Object.hasOwn(translations,"type") ?
    translations["type"] : "Type";
  const northText = Object.hasOwn(translations,"north") ?
    translations["north"] : "North";
  const eastText = Object.hasOwn(translations,"east") ?
    translations["east"] : "East";
  const westText = Object.hasOwn(translations,"west") ?
    translations["west"] : "West";
  const southText = Object.hasOwn(translations,"south") ?
    translations["south"] : "South";
  const spatialRepresentationText = Object.hasOwn(translations,"spatialRepresentation") ?
    translations["spatialRepresentation"] : "Spatial Representation";

  const labelText = Object.hasOwn(translations,"label") ?
    translations["label"] : "Label";
  const descriptionText = Object.hasOwn(translations,"description") ?
    translations["description"] : "Description";

  /******************* Data *******************/
  const data = $page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const items = data.item_v2;
  const properties = items.properties;
  const geographicExtent = properties.extent.geographicExtent;

  const status = properties.status[langShort];
  const maintenance = properties.maintenance[langShort];
  const id = data.uuid;
  const topicCategoryArray = properties.topicCategory.map((x) => x.label[langShort]);
  const topicCategory = topicCategoryArray.join(',');
  const type = properties.type[langShort];
  const north = geographicExtent.north;
  const east = geographicExtent.east;
  const west = geographicExtent.west;
  const south = geographicExtent.south;
  const spatialRepresentation = properties.spatialRepresentation[langShort];

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
    {"label": spatialRepresentationText.toUpperCase(),"description": spatialRepresentation}
  ]

  // Translation of table column labels
  const tableLabels: AdvMetadataRow = {"label": labelText,"description": descriptionText};
</script>

<SortableTable tableContent={tableDataArray} tableLabels={tableLabels} clickableRows={false} />

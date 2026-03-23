<script lang="ts">
  import { page } from '$app/state';
  import SortableTable from '$lib/components/sortable-table/sortable-table.svelte';

  type AdvMetadataRow = {
    id: string;
    label: string;
    description: string;
  };

  /******************* Translations *******************/
  const translations = page.data.t;

  // Row labels
  const statusText = translations?.status ? translations['status'] : 'Status';
  const maintenanceText = translations?.maintenance ? translations['maintenance'] : 'Maintenance';
  const idText = translations?.id ? translations['id'] : 'ID';
  const topicCategoryText = translations?.topicCategory ? translations['topicCategory'] : 'Topic Category';
  const typeText = translations?.type ? translations['type'] : 'Type';
  const northText = translations?.north ? translations['north'] : 'North';
  const eastText = translations?.east ? translations['east'] : 'East';
  const westText = translations?.west ? translations['west'] : 'West';
  const southText = translations?.south ? translations['south'] : 'South';
  const spatialRepresentationText = translations?.spatialRepresentation ? translations['spatialRepresentation'] : 'Spatial Representation';
  const projectionText = translations?.spatialRepresentation ? translations['projection'] : 'Projection';
  const dateCreatedText = translations?.dateCreated ? translations['dateCreated'] : 'Date Created';
  const datePublishedText = translations?.datePublished ? translations['datePublished'] : 'Date Published';
  const temporalCoverageText = translations?.temporalCoverage ? translations['temporalCoverage'] : 'Temporal Coverage';

  const labelText = translations?.label ? translations['label'] : 'Label';
  const descriptionText = translations?.description ? translations['description'] : 'Description';

  /******************* Data *******************/
  const data = page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const langIndex = langShort === 'fr' ? 1 : 0;
  const items = data.item_v2;

  const url = page.url;
  const mapBrowserUrl = `${url.origin}/${lang}/map-browser`;
  const searchUrl = `${mapBrowserUrl}?search-terms=`;

  const status = items.status.split('; ')[langIndex];
  const maintenance = items.maintenance.split('; ')[langIndex];
  const id = data.uuid;

  // Each topic category should be a link back to the search page
  const topicCategoryArray = items.topicCategory.map((category: string) => {
    const label = category.toLowerCase();
    return `<a href="${searchUrl}${encodeURIComponent(label)}" class="underline hover:no-underline text-custom-16">${label}</a>`;
  });
  const topicCategory = topicCategoryArray.join(', ');

  const type = items.type.split('; ')[langIndex];
  const north = items.bbox.north || 'N/A';
  const east = items.bbox.east || 'N/A';
  const south = items.bbox.south || 'N/A';
  const west = items.bbox.west || 'N/A';
  const spatialRepresentation = items?.spatialRepresentation ? items?.spatialRepresentation.split('; ')[langIndex] : 'N/A';
  const projection = items.refSys || 'N/A';

  const dateCreated = items.created || 'N/A';
  const datePublished = items.published || 'N/A';
  const temporalCoverage = `${items.temporalExtent.begin} - ${items.temporalExtent.end}`;

  // Table Array
  const tableDataArray: Array<AdvMetadataRow> = [
    { id: `status-${id}`, label: statusText.toUpperCase(), description: status },
    { id: `maintenance-${id}`, label: maintenanceText.toUpperCase(), description: maintenance },
    { id: `id-${id}`, label: idText.toUpperCase(), description: id },
    { id: `topicCategory-${id}`, label: topicCategoryText.toUpperCase(), description: topicCategory },
    { id: `type-${id}`, label: typeText.toUpperCase(), description: type },
    { id: `north-${id}`, label: northText.toUpperCase(), description: north },
    { id: `east-${id}`, label: eastText.toUpperCase(), description: east },
    { id: `south-${id}`, label: southText.toUpperCase(), description: south },
    { id: `west-${id}`, label: westText.toUpperCase(), description: west },
    { id: `spatialRepresentation-${id}`, label: spatialRepresentationText.toUpperCase(), description: spatialRepresentation },
    { id: `projection-${id}`, label: projectionText.toUpperCase(), description: projection },
    { id: `dateCreated-${id}`, label: dateCreatedText.toUpperCase(), description: dateCreated },
    { id: `datePublished-${id}`, label: datePublishedText.toUpperCase(), description: datePublished },
    { id: `temporalCoverage-${id}`, label: temporalCoverageText.toUpperCase(), description: temporalCoverage },
  ];

  // Translation of table column labels
  const tableLabels: AdvMetadataRow = { id: `tableLabels-${id}`, label: labelText, description: descriptionText };
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

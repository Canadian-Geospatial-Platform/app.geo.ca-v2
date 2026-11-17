<script lang="ts">
  import { getComponentLabels } from '#lib/i18n/index.js';
  import { getAppLanguage, pickByLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import SortableTable from '#lib/components/sortable-table/sortable-table.svelte';

  type AdvMetadataRow = {
    label: string;
    description: string;
  };

  /******************* Translations *******************/
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getComponentLabels(appLang, 'record'));

  /******************* Data *******************/
  const data = page.data;
  const langIndex = $derived(pickByLanguage(appLang, 0, 1));
  const items = data.item_v2!;

  const url = page.url;
  const mapBrowserUrl = $derived(`${url.origin}/${appLang}/map-browser`);
  const searchUrl = $derived(`${mapBrowserUrl}?search-terms=`);

  const status = $derived(items.status.split('; ')[langIndex]);
  const maintenance = $derived(items.maintenance.split('; ')[langIndex]);
  const id = $derived(data.uuid || translations.notApplicable);

  // Each topic category should be a link back to the search page
  const topicCategoryArray = $derived(
    items.topicCategory.map((category: string) => {
      const label = category.toLowerCase();
      return `<a href="${searchUrl}${encodeURIComponent(label)}" class="underline hover:no-underline text-custom-16">${label}</a>`;
    })
  );
  const topicCategory = $derived(topicCategoryArray.join(', '));

  const type = $derived(items.type.split('; ')[langIndex]);
  const north = $derived(items.bbox?.north?.toString() || translations.notApplicable);
  const east = $derived(items.bbox?.east?.toString() || translations.notApplicable);
  const south = $derived(items.bbox?.south?.toString() || translations.notApplicable);
  const west = $derived(items.bbox?.west?.toString() || translations.notApplicable);
  const spatialRepresentation = $derived(
    items?.spatialRepresentation ? items?.spatialRepresentation.split('; ')[langIndex] : translations.notApplicable
  );
  const projection = $derived(items.refSys || translations.notApplicable);

  const dateCreated = $derived(items.created || translations.notApplicable);
  const datePublished = $derived(items.published || translations.notApplicable);
  const temporalCoverage = `${items.temporalExtent.begin} - ${items.temporalExtent.end}`;

  // Table Array
  const tableDataArray: Array<AdvMetadataRow> = $derived([
    { label: translations.status.toUpperCase(), description: status },
    { label: translations.maintenance.toUpperCase(), description: maintenance },
    { label: translations.id.toUpperCase(), description: id },
    { label: translations.topicCategory.toUpperCase(), description: topicCategory },
    { label: translations.type.toUpperCase(), description: type },
    { label: translations.north.toUpperCase(), description: north },
    { label: translations.east.toUpperCase(), description: east },
    { label: translations.south.toUpperCase(), description: south },
    { label: translations.west.toUpperCase(), description: west },
    { label: translations.spatialRepresentation.toUpperCase(), description: spatialRepresentation },
    { label: translations.projection.toUpperCase(), description: projection },
    { label: translations.dateCreated.toUpperCase(), description: dateCreated },
    { label: translations.datePublished.toUpperCase(), description: datePublished },
    { label: translations.temporalCoverage.toUpperCase(), description: temporalCoverage },
  ]);

  // Translation of table column labels
  const tableLabels: AdvMetadataRow = $derived({ label: translations.label, description: translations.description });
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

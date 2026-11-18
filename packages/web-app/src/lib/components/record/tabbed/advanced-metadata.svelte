<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { getAppLanguage, pickByLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import SortableTable from '#lib/components/sortable-table/sortable-table.svelte';

  type AdvMetadataRow = {
    label: string;
    description: string;
  };

  // App language and translations
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));

  // Data from the page
  const data = page.data;
  const langIndex = $derived(pickByLanguage(appLang, 0, 1));
  const items = data.item_v2!;

  const url = page.url;
  const mapBrowserUrl = $derived(`${url.origin}/${appLang}/map-browser`);
  const searchUrl = $derived(`${mapBrowserUrl}?search-terms=`);

  const status = $derived(items.status.split('; ')[langIndex]);
  const maintenance = $derived(items.maintenance.split('; ')[langIndex]);
  const id = $derived(data.uuid || translations.general.notApplicable);

  // Each topic category should be a link back to the search page
  const topicCategoryArray = $derived(
    items.topicCategory.map((category: string) => {
      const label = category.toLowerCase();
      return `<a href="${searchUrl}${encodeURIComponent(label)}" class="underline hover:no-underline text-custom-16">${label}</a>`;
    })
  );
  const topicCategory = $derived(topicCategoryArray.join(', '));

  const type = $derived(items.type.split('; ')[langIndex]);
  const north = $derived(items.bbox?.north?.toString() || translations.general.notApplicable);
  const east = $derived(items.bbox?.east?.toString() || translations.general.notApplicable);
  const south = $derived(items.bbox?.south?.toString() || translations.general.notApplicable);
  const west = $derived(items.bbox?.west?.toString() || translations.general.notApplicable);
  const spatialRepresentation = $derived(
    items?.spatialRepresentation ? items?.spatialRepresentation.split('; ')[langIndex] : translations.general.notApplicable
  );
  const projection = $derived(items.refSys || translations.general.notApplicable);

  const dateCreated = $derived(items.created || translations.general.notApplicable);
  const datePublished = $derived(items.published || translations.general.notApplicable);
  const temporalCoverage = `${items.temporalExtent.begin} - ${items.temporalExtent.end}`;

  // Table Array
  const tableDataArray: Array<AdvMetadataRow> = $derived([
    { label: translations.components.record.labels.status.toUpperCase(), description: status },
    { label: translations.components.record.labels.maintenance.toUpperCase(), description: maintenance },
    { label: translations.components.record.labels.id.toUpperCase(), description: id },
    { label: translations.components.record.labels.topicCategory.toUpperCase(), description: topicCategory },
    { label: translations.components.record.labels.type.toUpperCase(), description: type },
    { label: translations.general.north.toUpperCase(), description: north },
    { label: translations.general.east.toUpperCase(), description: east },
    { label: translations.general.south.toUpperCase(), description: south },
    { label: translations.general.west.toUpperCase(), description: west },
    { label: translations.components.record.labels.spatialRepresentation.toUpperCase(), description: spatialRepresentation },
    { label: translations.components.record.labels.projection.toUpperCase(), description: projection },
    { label: translations.components.record.labels.dateCreated.toUpperCase(), description: dateCreated },
    { label: translations.components.record.labels.datePublished.toUpperCase(), description: datePublished },
    { label: translations.components.record.labels.temporalCoverage.toUpperCase(), description: temporalCoverage },
  ]);

  // Translation of table column labels
  const tableLabels: AdvMetadataRow = $derived({
    label: translations.components.record.labels.label,
    description: translations.components.record.labels.description,
  });
</script>

<SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={false} />

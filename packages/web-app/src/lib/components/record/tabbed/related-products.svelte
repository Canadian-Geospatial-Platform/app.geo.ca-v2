<script lang="ts">
  import { page } from '$app/state';
  import SortableTable from '$lib/components/sortable-table/sortable-table.svelte';
  import Pagination from '$lib/components/pagination/pagination.svelte';

  type RelatedProductsRow = {
    id: string;
    name: string;
    type: string;
    url: string;
  };

  type RelatedRecord = {
    id: string;
    description_en: string;
    description_fr: string;
    type: string;
  };

  /******************* Translations *******************/
  const translations = page.data.t;
  const relatedProductsNotAvailable = translations?.relatedProductsNotAvailable
    ? translations['relatedProductsNotAvailable']
    : 'The related products for this record are unavailable.';

  // Row labels
  const nameText = translations?.name ? translations['name'] : 'Name';
  const typeText = translations?.type ? translations['type'] : 'Type';

  /******************* Data *******************/
  const data = page.data;
  const lang = data.lang;
  const langShort = lang.slice(0, 2);
  const descriptionLang = `description_${langShort}`;

  const url = page.url;

  const relatedRecords: RelatedRecord[] | undefined = data.related || [];
  let tableDataArray: Array<RelatedProductsRow> = relatedRecords.map((relatedRecord: RelatedRecord) => {
    const recordUrl = `${url.origin}/${lang}/map-browser/record/${relatedRecord.id}`;
    const row = {
      id: relatedRecord.id,
      name: relatedRecord[descriptionLang as 'description_en' | 'description_fr'],
      type: relatedRecord.type,
      url: recordUrl,
    };
    return row;
  });

  // Translation of table column labels
  const tableLabels: RelatedProductsRow = {
    id: `tableLabels-${relatedRecords.map((record) => record.id).join('-')}`,
    name: nameText,
    type: typeText,
    url: '',
  };

  /****************** Pagination ******************/
  // TODO: move to constants file if used in other places
  const itemsPerPage = 10;
  const total = $derived(relatedRecords.length ?? 0);
  let currentPage = $state(1);

  /**
   * Handles page change event from Pagination component.
   *
   * @param page - The new page number.
   */
  function changePage(page: number): void {
    currentPage = page;
  }
</script>

{#if tableDataArray.length === 0}
  <div>
    {relatedProductsNotAvailable}
  </div>
{:else}
  <SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={true} paginated={true} {currentPage} {itemsPerPage} />
  {#if tableDataArray.length > itemsPerPage}
    <div class="flex justify-end w-full">
      <Pagination totalItems={total} {itemsPerPage} bind:currentPage pageChange={changePage} />
    </div>
  {/if}
{/if}

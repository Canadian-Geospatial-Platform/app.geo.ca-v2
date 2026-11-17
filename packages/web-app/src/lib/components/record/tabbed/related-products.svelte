<script lang="ts">
  import { getComponentLabels } from '#lib/i18n/index.js';
  import { getAppLanguage, pickByLanguage } from '#lib/utils/language.js';
  import { page } from '$app/state';
  import SortableTable from '#lib/components/sortable-table/sortable-table.svelte';
  import Pagination from '#lib/components/pagination/pagination.svelte';

  type RelatedProductsRow = {
    id: string;
    name: string;
    type: string;
    url: string;
  };

  type RelatedProductsTableLabels = {
    name: string;
    type: string;
  };

  /******************* Translations *******************/
  const translations = $derived(getComponentLabels(getAppLanguage(page.data.lang ?? page.params.lang), 'record'));

  /******************* Data *******************/
  const data = page.data;
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const descriptionLang = $derived(pickByLanguage(appLang, 'description_en', 'description_fr'));

  const url = page.url;

  const relatedRecords = data.related ?? [];
  let tableDataArray: Array<RelatedProductsRow> = $derived(
    relatedRecords.map((relatedRecord) => {
      const recordUrl = `${url.origin}/${appLang}/map-browser/record/${relatedRecord.id}`;
      const row = {
        id: relatedRecord.id,
        name: relatedRecord[descriptionLang],
        type: relatedRecord.type,
        url: recordUrl,
      };
      return row;
    })
  );

  // Only data fields should be table columns; id/url are internal row metadata.
  const tableLabels: RelatedProductsTableLabels = $derived({
    name: translations.name,
    type: translations.type,
  });

  /****************** Pagination ******************/
  // Keep pagination size local to this view unless reused elsewhere.
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
    {translations.relatedProductsNotAvailable}
  </div>
{:else}
  <SortableTable tableContent={tableDataArray} {tableLabels} clickableRows={true} paginated={true} {currentPage} {itemsPerPage} />
  {#if tableDataArray.length > itemsPerPage}
    <div class="flex justify-end w-full">
      <Pagination totalItems={total} {itemsPerPage} bind:currentPage pageChange={changePage} />
    </div>
  {/if}
{/if}

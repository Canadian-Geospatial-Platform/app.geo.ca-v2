<script lang="ts">
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { updateLocalStorage } from '$lib/utils/event-dispatchers/local-storage-changed';
  import { FAVOURITES_STORAGE_KEY, getStoredFavourites, resolveInitialFavourites } from '$lib/utils/favourites-storage';
  import Card from '$lib/components/card/card.svelte';
  import NoMap from '$lib/components/icons/no-map.svelte';
  import SortableTable from '$lib/components/sortable-table/sortable-table.svelte';
  import FavouritesListSkeleton from '$lib/components/loading-mask/favourites-list-skeleton.svelte';
  import Checkmark from '$lib/components/icons/checkmark.svelte';
  import GarbageCan from '$lib/components/icons/garbage-can.svelte';
  import SearchBarSimplified from '$lib/components/search-results/search-bar-simplified.svelte';
  import enTranslations from '$lib/components/favourites/i18n/en/translations.json';
  import type { FavouritesRecord, FavouritesRow } from '$lib/db/db-types';
  import type { AppLanguage } from '$lib/utils/language';
  import { isFrench, pickByLanguage } from '$lib/utils/language';

  /**
   * Signed-in favourites datasets view.
   *
   * Renders saved dataset records, supports selection and deletion,
   * and opens selected records in the map view route.
   */
  type FavouritesTranslations = typeof enTranslations;
  const translations: FavouritesTranslations = {
    ...enTranslations,
    ...((page.data.t ?? {}) as Partial<FavouritesTranslations>),
  };
  const lang = page.data.lang as AppLanguage;
  const signedIn = Boolean(page.data.signedIn);
  const userDataUnavailable = page.data.userDataStatus === 'unavailable';

  // Translations
  const datasetsTabLabel = translations.datasetsTab;
  const datasetsDescription = translations.datasetsDescription || translations.description;
  const remove = translations.remove;
  const removeAll = translations.removeAll;
  const resourceFormatsLabel = translations.resourceFormats;
  const resourceListEmpty = translations.resourceListEmpty;
  const resourceNameLabel = translations.resourceName;
  const savedDataUnavailable = translations.savedDataUnavailable;
  const searchFor = translations.searchFor;
  const viewOnMapLabel = translations.viewOnMap;
  const findAResource = translations.findAResource;
  const mapsLinkLabel = translations.mapsLinkLabel;

  const langShort = pickByLanguage(lang, 'en', 'fr');
  const titleKey = `title_${langShort}` as 'title_en' | 'title_fr';

  // State
  let sortableTable: SortableTable | undefined = $state();
  let selectedIds: string[] = $state([]);
  let numSelected: number = $derived(selectedIds.length);
  let canOpenMap: boolean = $derived(numSelected > 0);
  let loading: boolean = $state(true);
  let favouriteRecordList: string[] = $state(page.data?.userData?.favourites ? [...page.data.userData.favourites] : []);
  let records: FavouritesRecord[] = $state([]);
  let tableDataArray: FavouritesRow[] = $state([]);

  let allSelected = $derived(
    tableDataArray.length > 0 && tableDataArray.every((row) => selectedIds.includes(row.id) || row.disableCheckbox)
  );

  const tableLabels: Record<string, string> = {
    name: resourceNameLabel,
    formats: resourceFormatsLabel,
  };

  /**
   * Deletes one favourite resource after user confirmation.
   *
   * For signed-in users this persists the deletion through the API,
   * then synchronizes local table and local-storage state.
   *
   * @param id - Favourites record id to delete.
   */
  async function handleDeleteResource(id: string): Promise<void> {
    const resource = tableDataArray.find((tableData: FavouritesRow) => tableData.id === id);
    const resourceName = resource?.name;
    const permissionText = isFrench(lang)
      ? `Êtes-vous sûr de vouloir supprimer la ressource suivante? \n\n${resourceName} (${id})`
      : `Are you sure you want to delete the following resource? \n\n${resourceName} (${id})`;

    if (confirm(permissionText) === true) {
      if (signedIn) {
        const response = await fetch(`/${lang}/api/favourites`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) {
          return;
        }
      }

      let selectedSet = new SvelteSet<string>(sortableTable?.getSelectedIds());
      selectedSet.delete(id);

      favouriteRecordList = favouriteRecordList.filter((listItem) => listItem !== id);
      tableDataArray = tableDataArray.filter((row) => row.id !== id);
      records = records.filter((record) => record.id !== id);

      sortableTable?.updateTableContent(tableDataArray);
      sortableTable?.setSelectedIds(Array.from(selectedSet));

      updateLocalStorage(FAVOURITES_STORAGE_KEY, favouriteRecordList);
    }
  }

  /**
   * Removes all favourite resources after user confirmation.
   *
   * For signed-in users this clears server-side favourites before
   * resetting local records, selection, and local-storage state.
   */
  async function handleRemoveAllClick(): Promise<void> {
    const permissionText = isFrench(lang)
      ? `Êtes-vous certain de vouloir supprimer ${favouriteRecordList.length} ressources?`
      : `Are you sure you want to delete ${favouriteRecordList.length} resources?`;

    if (confirm(permissionText) === true) {
      if (signedIn) {
        const response = await fetch(`/${lang}/api/favourites`, {
          method: 'PUT',
        });
        if (!response.ok) {
          return;
        }
      }

      favouriteRecordList = [];
      tableDataArray = [];
      records = [];

      sortableTable?.updateTableContent([]);
      sortableTable?.setSelectedIds([]);

      updateLocalStorage(FAVOURITES_STORAGE_KEY, []);
    }
  }

  /**
   * Navigates to the shared map view route with selected dataset ids.
   *
   * Encodes selected record identifiers into the query string and preserves source context.
   */
  function handleOpenMapClick(): void {
    if (!canOpenMap) {
      return;
    }

    const ids = selectedIds.join(',');
    goto(resolve(`/${lang}/favourites/view?ids=${encodeURIComponent(ids)}&source=datasets`));
  }

  /**
   * Initializes the datasets table from server/local favourites data.
   *
   * Resolves signed-in and guest sources, fetches matching records, and preselects mappable rows.
   */
  onMount(async () => {
    const storedFavourites = getStoredFavourites(localStorage);
    const resolved = resolveInitialFavourites(signedIn, favouriteRecordList, storedFavourites);
    favouriteRecordList = resolved.favourites;

    if (resolved.shouldSyncLocalStorage) {
      updateLocalStorage(FAVOURITES_STORAGE_KEY, favouriteRecordList);
    }

    if (favouriteRecordList.length > 0) {
      const response = await fetch(`/${lang}/favourites`, {
        method: 'POST',
        body: JSON.stringify({ ids: favouriteRecordList, lang: lang }),
        headers: { 'Content-Type': 'application/json' },
      });

      records = await response.json();

      tableDataArray = records.map((record: FavouritesRecord) => {
        return {
          disableCheckbox: !record.hasMapLayer,
          id: record.id,
          formats: record.formats.join(', '),
          name: record[titleKey],
          url: `${page.url.origin}/${lang}/map-browser/record/${record.id}`,
        };
      });

      selectedIds = tableDataArray.filter((row) => !row.disableCheckbox).map((row) => row.id);
    }

    loading = false;
  });
</script>

<h1 class="page-title-favourites font-custom-style-h1">{datasetsTabLabel}</h1>

<div class="page-section-favourites">
  {#if userDataUnavailable}
    <div class="status-alert-error font-custom-style-body-1" role="status" aria-live="polite">
      {savedDataUnavailable}
    </div>
  {:else if !loading}
    {#if tableDataArray.length > 0}
      <p class="page-copy-block">
        <!-- These are our descriptions, no injection risk -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html datasetsDescription}
      </p>

      <Card>
        <!-- Table for medium to large screens-->
        <div class="hidden sm:table w-full">
          <SortableTable
            tableContent={tableDataArray}
            {tableLabels}
            clickableRows={true}
            checkboxCol={true}
            {allSelected}
            removeCol={true}
            paginated={false}
            deleteResource={handleDeleteResource}
            bind:this={sortableTable}
            bind:selectedIds
          />
        </div>

        <!-- Cards for mobile screens -->
        <div class="block sm:hidden mobile-list-card">
          {#each tableDataArray as item (item.id)}
            <div class="flex items-center py-5">
              <div class="flex pointer-events-auto hover:cursor-pointer w-16 ml-4">
                <input
                  type="checkbox"
                  id={`check-${item.id}`}
                  name={`check-${item.id}`}
                  class="peer checkbox-standard"
                  checked={selectedIds.includes(item.id)}
                  onchange={(event: Event) => {
                    const idSet = new SvelteSet(selectedIds);
                    if ((event.target as HTMLInputElement).checked) {
                      idSet.add(item.id);
                    } else {
                      idSet.delete(item.id);
                    }
                    selectedIds = Array.from(idSet);
                  }}
                />
                <Checkmark classes="absolute h-4 mt-1.5 ml-1.5 hidden peer-checked:block pointer-events-none text-custom-1" />
              </div>

              <div class="flex-1">
                <a href={resolve(`/${lang}/map-browser/record/${item.id}`)} class="font-custom-style-h2-2 block">
                  {item.name}
                </a>
                <p class="font-custom-style-body-9">{item.id}</p>

                <button class="button-action-light button-action-remove" onclick={() => handleDeleteResource(item.id)}>
                  <GarbageCan classes="h-4 button-icon-inline" />
                  {remove}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <div class="sm:flex">
          <div class="sm:grow">
            <button
              class="button-inline-desktop button-action-dark button-width-mobile-full mb-4 sm:mb-0"
              onclick={handleOpenMapClick}
              disabled={!canOpenMap}
              aria-disabled={!canOpenMap}
            >
              {viewOnMapLabel} ({numSelected})
            </button>
          </div>

          <button class="button-inline-desktop button-action-light button-width-mobile-full" onclick={handleRemoveAllClick}>
            <GarbageCan classes="h-4 button-icon-inline" />
            {removeAll}
          </button>
        </div>
      </Card>

      <div class="mt-9">
        <a class="button-action-dark button-cta-link-dark" href={resolve(`/${lang}/favourites/maps`)}>
          {mapsLinkLabel}
        </a>
      </div>

      <h2 class="mb-4 mt-9 mx-0 font-custom-style-h2 md:mr-auto">
        {searchFor}
      </h2>
      <SearchBarSimplified />
    {:else}
      <div class="my-8">
        <NoMap classes="text-custom-19 m-auto h-48 md:h-80 lg:h-96" />

        <p class="block m-auto w-fit font-custom-style-h2 text-center">
          {resourceListEmpty}
        </p>

        <a class="block m-auto w-fit mt-5" href={resolve(`/${lang}/map-browser`)}>
          <div class="surface-action-light surface-shadow w-fit">
            {findAResource}
          </div>
        </a>
      </div>
    {/if}
  {:else}
    <FavouritesListSkeleton numRecords={6} />
  {/if}
</div>

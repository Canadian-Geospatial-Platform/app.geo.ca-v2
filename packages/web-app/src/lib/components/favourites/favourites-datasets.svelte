<script lang="ts">
  import { getTranslations, formatTranslation } from '#lib/i18n/index.js';
  import { onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { updateLocalStorage } from '#lib/utils/event-dispatchers/local-storage-changed.js';
  import { FAVOURITES_STORAGE_KEY, getStoredFavourites, resolveInitialFavourites } from '#lib/utils/favourites-storage.js';
  import Card from '#lib/components/card/card.svelte';
  import ActionDialog from '#lib/components/dialog/action-dialog.svelte';
  import AppDialog from '#lib/components/dialog/app-dialog.svelte';
  import NoMap from '#lib/components/icons/no-map.svelte';
  import SortableTable from '#lib/components/sortable-table/sortable-table.svelte';
  import FavouritesListSkeleton from '#lib/components/loading-mask/favourites-list-skeleton.svelte';
  import Checkmark from '#lib/components/icons/checkmark.svelte';
  import GarbageCan from '#lib/components/icons/garbage-can.svelte';
  import SearchBarSimplified from '#lib/components/search-results/search-bar-simplified.svelte';
  import type { FavouritesRecord, FavouritesRow } from '#lib/db/db-types.js';
  import { getContentLanguage, getAppLanguage } from '#lib/utils/language.js';

  /**
   * Signed-in favourites datasets view.
   *
   * Renders saved dataset records, supports selection and deletion,
   * and opens selected records in the map view route.
   */
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const translations = $derived(getTranslations(appLang));
  const signedIn = Boolean(page.data.signedIn);
  const userDataUnavailable = page.data.userDataStatus === 'unavailable';

  const contentLang = $derived(getContentLanguage(appLang));
  const titleKey = $derived(`title_${contentLang}` as 'title_en' | 'title_fr');

  // State
  let actionDialog: ActionDialog;
  let sortableTable: SortableTable | undefined = $state();
  let selectedIds: string[] = $state([]);
  let numSelected: number = $derived(selectedIds.length);
  let canOpenMap: boolean = $derived(numSelected > 0);
  let loading: boolean = $state(true);
  let favouriteRecordList: string[] = $state(page.data?.userData?.favourites ? [...page.data.userData.favourites] : []);
  let records: FavouritesRecord[] = $state([]);
  let tableDataArray: FavouritesRow[] = $state([]);
  const savedMaps = $derived(page.data.userData?.mapConfigs ?? []);
  let datasetToAdd: string | null = $state(null);
  let pickerError = $state(false);
  let openingSavedMap = $state(false);

  /**
   * Explains why a dataset cannot be added to a saved map.
   *
   * @param unmappable - Whether the dataset has no available map layer.
   * @returns Localized disabled-state explanation, or an empty string when eligible.
   */
  function addDisabledReason(unmappable: boolean): string {
    if (unmappable) return translations.components.favourites.labels.datasetNotMappable;
    if (userDataUnavailable) return translations.components.favourites.labels.savedDataUnavailable;
    if (savedMaps.length === 0) return translations.components.favourites.labels.noSavedMapsToAdd;
    return '';
  }

  /**
   * Opens the chosen saved map with a pending, unsaved dataset addition.
   *
   * Closes the picker immediately, blocks further additions during navigation,
   * and restores the original dataset selection with an error if navigation fails.
   *
   * @param mapId - Identifier of the saved map selected in the picker.
   * @returns Resolves after navigation succeeds or the picker is restored for retry.
   */
  async function handleSelectSavedMap(mapId: string): Promise<void> {
    if (!datasetToAdd || openingSavedMap) return;
    const datasetId = datasetToAdd;
    pickerError = false;
    openingSavedMap = true;
    datasetToAdd = null;
    const query = new URLSearchParams({ mapId, addDatasetId: datasetId, source: 'maps' });
    try {
      await goto(resolve(`/[lang]/favourites/view?${query}`, { lang: appLang }));
    } catch (error) {
      console.error('Unable to open the saved map:', error);
      datasetToAdd = datasetId;
      pickerError = true;
    } finally {
      openingSavedMap = false;
    }
  }

  let allSelected = $derived(
    tableDataArray.length > 0 && tableDataArray.every((row) => selectedIds.includes(row.id) || row.disableCheckbox)
  );

  const tableLabels: Record<string, string> = $derived({
    name: translations.components.favourites.labels.resourceName,
    formats: translations.components.favourites.labels.resourceFormats,
  });

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
    const resourceName = resource?.name ?? id;
    const permissionText = formatTranslation(getTranslations(appLang).components.favourites.messages.deleteResource, {
      name: resourceName,
      id: id,
    });

    if (await actionDialog.confirm(permissionText)) {
      if (signedIn) {
        const response = await fetch(`/${appLang}/api/favourites`, {
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
    const permissionText = formatTranslation(getTranslations(appLang).components.favourites.messages.deleteResources, {
      count: favouriteRecordList.length,
    });

    if (await actionDialog.confirm(permissionText)) {
      if (signedIn) {
        const response = await fetch(`/${appLang}/api/favourites`, {
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
    goto(resolve(`/[lang]/favourites/view?ids=${encodeURIComponent(ids)}&source=datasets`, { lang: appLang }));
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
      const response = await fetch(`/${appLang}/favourites`, {
        method: 'POST',
        body: JSON.stringify({ ids: favouriteRecordList, lang: appLang }),
        headers: { 'Content-Type': 'application/json' },
      });

      records = await response.json();

      tableDataArray = records.map((record: FavouritesRecord) => {
        return {
          disableCheckbox: !record.hasMapLayer,
          id: record.id,
          formats: record.formats.join(', '),
          name: record[titleKey],
          url: `${page.url.origin}/${appLang}/map-browser/record/${record.id}`,
        };
      });

      selectedIds = tableDataArray.filter((row) => !row.disableCheckbox).map((row) => row.id);
    }

    loading = false;
  });
</script>

<ActionDialog bind:this={actionDialog} />
<AppDialog
  open={datasetToAdd !== null}
  title={translations.components.favourites.labels.chooseSavedMap}
  onclose={() => (datasetToAdd = null)}
>
  <ul class="max-h-80 overflow-y-auto space-y-3 mb-5">
    {#each savedMaps as savedMap (savedMap.id)}
      <li>
        <button class="button-action-light w-full text-left" onclick={() => handleSelectSavedMap(savedMap.id)}>
          {savedMap.name}
        </button>
      </li>
    {/each}
  </ul>
  {#if pickerError}
    <p class="status-alert-error mb-5" role="alert">{translations.components.favourites.labels.openSavedMapFailed}</p>
  {/if}
  <button class="button-action-dark" onclick={() => (datasetToAdd = null)}>{translations.general.cancel}</button>
</AppDialog>

{#snippet addToSavedMapButton(id: string, unmappable: boolean, mobile = false)}
  {@const reason = addDisabledReason(unmappable)}
  <button
    class="button-action-light"
    disabled={Boolean(reason) || openingSavedMap}
    aria-busy={openingSavedMap}
    title={reason || translations.components.favourites.labels.addToSavedMap}
    aria-describedby={reason ? `add-map-reason-${id}-${mobile}` : undefined}
    onclick={() => {
      if (openingSavedMap) return;
      pickerError = false;
      datasetToAdd = id;
    }}
  >
    {translations.components.favourites.labels.add}
  </button>
  {#if reason}
    <span id={`add-map-reason-${id}-${mobile}`} class="sr-only">{reason}</span>
  {/if}
{/snippet}

{#snippet savedMapAction(row: { id: string; disableCheckbox?: boolean })}
  {@render addToSavedMapButton(row.id, Boolean(row.disableCheckbox))}
{/snippet}

<h1 class="page-title-favourites font-custom-style-h1">{translations.components.favourites.labels.datasetsTab}</h1>

<div class="page-section-favourites">
  {#if userDataUnavailable}
    <div class="status-alert-error font-custom-style-body-1" role="status" aria-live="polite">
      {translations.components.favourites.labels.savedDataUnavailable}
    </div>
  {:else if !loading}
    {#if tableDataArray.length > 0}
      <p class="page-copy-block">
        <!-- These are our descriptions, no injection risk -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html translations.components.favourites.labels.datasetsDescription}
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
            actionColumnLabel={translations.components.favourites.labels.addToSavedMap}
            rowAction={signedIn ? savedMapAction : undefined}
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
                <a
                  href={resolve('/[lang]/map-browser/record/[uuid]', { lang: appLang, uuid: item.id })}
                  class="font-custom-style-h2-2 block"
                >
                  {item.name}
                </a>
                <p class="font-custom-style-body-9">{item.id}</p>

                {#if signedIn}
                  <div class="mb-3">
                    {@render addToSavedMapButton(item.id, Boolean(item.disableCheckbox), true)}
                  </div>
                {/if}
                <button class="button-action-light button-action-remove" onclick={() => handleDeleteResource(item.id)}>
                  <GarbageCan classes="h-4 button-icon-inline" />
                  {translations.components.favourites.labels.remove}
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
              {translations.components.favourites.labels.viewOnMap} ({numSelected})
            </button>
          </div>

          <button class="button-inline-desktop button-action-light button-width-mobile-full" onclick={handleRemoveAllClick}>
            <GarbageCan classes="h-4 button-icon-inline" />
            {translations.components.favourites.labels.removeAll}
          </button>
        </div>
      </Card>

      <div class="mt-9">
        <a class="button-action-dark button-cta-link-dark" href={resolve('/[lang]/favourites/maps', { lang: appLang })}>
          {translations.components.favourites.labels.mapsLinkLabel}
        </a>
      </div>

      <h2 class="mb-4 mt-9 mx-0 font-custom-style-h2 md:mr-auto">
        {translations.components.favourites.labels.searchFor}
      </h2>
      <SearchBarSimplified />
    {:else}
      <div class="my-8">
        <NoMap classes="text-custom-19 m-auto h-48 md:h-80 lg:h-96" />

        <p class="block m-auto w-fit font-custom-style-h2 text-center">
          {translations.components.favourites.labels.resourceListEmpty}
        </p>

        <a class="button-action-dark button-cta-link-dark block m-auto mt-5" href={resolve('/[lang]/map-browser', { lang: appLang })}>
          {translations.components.favourites.labels.findAResource}
        </a>
      </div>
    {/if}
  {:else}
    <FavouritesListSkeleton numRecords={6} />
  {/if}
</div>

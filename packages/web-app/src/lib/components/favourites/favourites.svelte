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

  type FavouritesTranslations = typeof enTranslations;
  const translations: FavouritesTranslations = {
    ...enTranslations,
    ...((page.data.t ?? {}) as Partial<FavouritesTranslations>),
  };
  const lang = page.data.lang as AppLanguage;
  const signedIn = Boolean(page.data.signedIn);
  const userDataUnavailable = page.data.userDataStatus === 'unavailable';

  // Translations
  const favouritesTitle = translations.title;
  const datasetsDescription = translations.datasetsDescription || translations.description;
  const loginInfo = translations.loginInfo;
  const landingDescription = translations.landingDescription;
  const datasetsTabLabel = translations.datasetsTab;
  const mapsTabLabel = translations.mapsTab;
  const datasetsLinkLabel = translations.datasetsLinkLabel;
  const mapsLinkLabel = translations.mapsLinkLabel;
  const datasetsLandingDescription = translations.datasetsLandingDescription;
  const mapsLandingDescription = translations.mapsLandingDescription;
  const landingTipLabel = translations.landingTipLabel;
  const remove = translations.remove;
  const removeAll = translations.removeAll;
  const resourceListEmpty = translations.resourceListEmpty;
  const findAResource = translations.findAResource;
  const savedDataUnavailable = translations.savedDataUnavailable;
  const viewOnMapLabel = translations.viewOnMap;
  const searchFor = translations.searchFor;

  const langShort = pickByLanguage(lang, 'en', 'fr');
  const titleKey = `title_${langShort}` as 'title_en' | 'title_fr';

  // State
  let sortableTable: SortableTable | undefined = $state();
  let selectedIds: string[] = $state([]);
  let numSelected: number = $derived(selectedIds.length);
  let canOpenMap: boolean = $derived(numSelected > 0);
  let loading: boolean = $state(true);

  let favouriteRecordList: string[] = $state(page.data?.userData?.favourites ? [...page.data.userData.favourites] : []);
  let savedMapsCount = $derived(page.data?.userData?.mapConfigs?.length ?? 0);
  let records: FavouritesRecord[] = $state([]);
  let tableDataArray: FavouritesRow[] = $state([]);

  // Derive allSelected state: true only if all non-disabled rows are selected
  let allSelected = $derived(
    tableDataArray.length > 0 && tableDataArray.every((row) => selectedIds.includes(row.id) || row.disableCheckbox)
  );

  const resourceFormatsLabel = translations.resourceFormats;
  const resourceNameLabel = translations.resourceName;
  const tableLabels: Record<string, string> = {
    name: resourceNameLabel,
    formats: resourceFormatsLabel,
  };

  /************* Handlers ***************/

  /**
   * Handle deleting a resource from the favourites list.
   *
   * @param id - The ID of the resource to delete.
   */
  async function handleDeleteResource(id: string): Promise<void> {
    // Before deleting, ask the user's permission
    const resource = tableDataArray.find((tableData: FavouritesRow) => tableData.id === id);
    const resourceName = resource?.name;
    const permissionText = isFrench(lang)
      ? `Êtes-vous sûr de vouloir supprimer la ressource suivante? \n\n${resourceName} (${id})`
      : `Are you sure you want to delete the following resource? \n\n${resourceName} (${id})`;

    if (confirm(permissionText) === true) {
      // If the user confirms, proceed with deletion. For signed-in users, also update the server-side favourites.
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

      // Update resource lists
      favouriteRecordList = favouriteRecordList.filter((listItem) => listItem !== id);
      tableDataArray = tableDataArray.filter((row) => row.id !== id);
      records = records.filter((record) => record.id !== id);

      // Update the table and button label
      sortableTable?.updateTableContent(tableDataArray);
      sortableTable?.setSelectedIds(Array.from(selectedSet));

      // Update localStorage and dispatch localstorage_updated event
      updateLocalStorage(FAVOURITES_STORAGE_KEY, favouriteRecordList);
    }
  }

  /**
   * Handle removing all resources from the favourites list.
   *
   * For signed-in users this also clears server-side favourites before
   * resetting local table state and local-storage data.
   */
  async function handleRemoveAllClick(): Promise<void> {
    const permissionText = isFrench(lang)
      ? `Êtes-vous certain de vouloir supprimer ${favouriteRecordList.length} ressources?`
      : `Are you sure you want to delete ${favouriteRecordList.length} resources?`;

    if (confirm(permissionText) === true) {
      // If the user confirms, proceed with deletion. For signed-in users, also update the server-side favourites.
      if (signedIn) {
        const response = await fetch(`/${lang}/api/favourites`, {
          method: 'PUT',
        });
        if (!response.ok) {
          return;
        }
      }

      // Update resource lists
      favouriteRecordList = [];
      tableDataArray = [];
      records = [];

      // Update the table and button label
      sortableTable?.updateTableContent([]);
      sortableTable?.setSelectedIds([]);

      // Update localStorage and dispatch localstorage_updated event
      updateLocalStorage(FAVOURITES_STORAGE_KEY, []);
    }
  }

  /**
   * Handle opening the map view.
   *
   * Encodes selected dataset ids in the query string and preserves source context.
   */
  function handleOpenMapClick(): void {
    if (!canOpenMap) {
      return;
    }

    const ids = selectedIds.join(',');
    goto(resolve(`/${lang}/favourites/view?ids=${encodeURIComponent(ids)}&source=datasets`));
  }

  /**
   * Initializes guest favourites state from local storage and fetched records.
   *
   * Signed-in users skip this fetch path because server data is already available.
   */
  onMount(async () => {
    if (signedIn) {
      loading = false;
      return;
    }

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

      // Select all non-disabled rows by default
      selectedIds = tableDataArray.filter((row) => !row.disableCheckbox).map((row) => row.id);
    }

    // Turn off the loading mask once the records have finished loading
    loading = false;
  });

  const isLanding = $derived(signedIn);
</script>

<h1 class="mt-12 mb-7 mx-5 md:mx-0 font-custom-style-h1 md:mr-auto leading-tight">
  {favouritesTitle}
</h1>

<div class="mx-5 md:mx-0 mb-5">
  {#if isLanding}
    {#if userDataUnavailable}
      <div class="rounded border border-red-600 bg-red-50 px-4 py-3 font-custom-style-body-1 text-red-900" role="status" aria-live="polite">
        {savedDataUnavailable}
      </div>
    {:else}
      <!-- Landing page for signed-in users -->
      <p class="font-custom-style-body-1 mx-0 mb-7 max-w-4xl leading-relaxed">
        <!-- These are our descriptions, no injection risk -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html landingDescription}
      </p>
      <Card type="tabbed">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section
            class="rounded border border-custom-16/35 bg-custom-1 p-5 md:p-6 shadow-[0_0.1875rem_0.375rem_#00000014] transition-shadow hover:shadow-[0_0.375rem_0.75rem_#0000001f]"
          >
            <div class="flex items-start justify-between gap-4">
              <h2 class="font-custom-style-h2-2">
                <a class="hover:underline" href={resolve(`/${lang}/favourites/datasets`)}>
                  {datasetsTabLabel} ({favouriteRecordList.length})
                </a>
              </h2>
            </div>
            <p class="font-custom-style-body-1 mt-3 mb-5 leading-relaxed">{datasetsLandingDescription}</p>
            <a
              class="button-5 w-full md:w-fit md:min-w-48 shadow-[0_0.1875rem_0.375rem_#00000029]"
              href={resolve(`/${lang}/favourites/datasets`)}
            >
              {datasetsLinkLabel}
            </a>
          </section>

          <section
            class="rounded border border-custom-16/35 bg-custom-1 p-5 md:p-6 shadow-[0_0.1875rem_0.375rem_#00000014] transition-shadow hover:shadow-[0_0.375rem_0.75rem_#0000001f]"
          >
            <div class="flex items-start justify-between gap-4">
              <h2 class="font-custom-style-h2-2">
                <a class="hover:underline" href={resolve(`/${lang}/favourites/maps`)}>
                  {mapsTabLabel} ({savedMapsCount})
                </a>
              </h2>
            </div>
            <p class="font-custom-style-body-1 mt-3 mb-5 leading-relaxed">{mapsLandingDescription}</p>
            <a
              class="button-5 w-full md:w-fit md:min-w-48 shadow-[0_0.1875rem_0.375rem_#00000029]"
              href={resolve(`/${lang}/favourites/maps`)}
            >
              {mapsLinkLabel}
            </a>
          </section>
        </div>
        <div class="mt-1 rounded border border-custom-16/20 bg-custom-1 px-4 py-3 md:px-5">
          <p class="font-custom-style-body-9 m-0 text-custom-18">
            {landingTipLabel}
          </p>
        </div>
      </Card>
    {/if}
  {:else if !loading}
    <!-- Guest list -->
    <p class="font-custom-style-body-1 mx-0 mb-6">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html datasetsDescription}
    </p>
    <p class="font-custom-style-body-1 mx-0 mb-6">
      {loginInfo}
    </p>

    {#if records.length > 0}
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
        <div class="block sm:hidden rounded bg-custom-1 px-5 drop-shadow-[0_0.1875rem_0.375rem_#00000029] divide-y divide-custom-17">
          {#each tableDataArray as item (item.id)}
            <div class="flex items-center py-5">
              <!-- Checkboxes -->
              <div class="flex pointer-events-auto hover:cursor-pointer w-16 ml-4">
                <input
                  type="checkbox"
                  id={`check-${item.id}`}
                  name={`check-${item.id}`}
                  class="peer appearance-none min-w-[1.6875rem] h-[1.6875rem] border-2 border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16 hover:cursor-pointer"
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

              <!-- Resource -->
              <div class="flex-1">
                <!-- Resource data-->
                <a href={resolve(`/${lang}/map-browser/record/${item.id}`)} class="font-custom-style-h2-2 block">
                  {item.name}
                </a>
                <p class="font-custom-style-body-9">{item.id}</p>

                <!-- Remove Button-->
                <button
                  class="button-3 mt-4 p-2 text-custom-16 rounded border-2 border-transparent hover:border-custom-16 hover:text-custom-1 hover:bg-custom-16 hover:shadow-[0_0.1875rem_0.375rem_#00000029]"
                  onclick={() => handleDeleteResource(item.id)}
                >
                  <GarbageCan classes="h-4 inline mb-1" />
                  {remove}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-------------- buttons -------------->
        <div class="sm:flex">
          <div class="sm:grow">
            <button
              class="sm:inline-block button-5 w-full sm:w-fit mb-4 sm:mb-0 shadow-[0_0.1875rem_0.375rem_#00000029]"
              onclick={handleOpenMapClick}
              disabled={!canOpenMap}
              aria-disabled={!canOpenMap}
            >
              {viewOnMapLabel} ({numSelected})
            </button>
          </div>

          <button class="sm:inline-block button-3 w-full sm:w-fit shadow-[0_0.1875rem_0.375rem_#00000029]" onclick={handleRemoveAllClick}>
            <GarbageCan classes="h-4 inline mb-1" />
            {removeAll}
          </button>
        </div>
      </Card>

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
          <div class="button-3 w-fit shadow-[0_0.1875rem_0.375rem_#00000029]">
            {findAResource}
          </div>
        </a>
      </div>
    {/if}
  {:else}
    <FavouritesListSkeleton numRecords={6} />
  {/if}
</div>

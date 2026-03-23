<script lang="ts">
  import { page, navigating } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { updateLocalStorage } from '$lib/utils/event-dispatchers/local-storage-changed';
  import Accordion from '$lib/components/accordion/accordion.svelte';
  import Card from '$lib/components/card/card.svelte';
  import ResultListSkeleton from '$lib/components/loading-mask/result-list-skeleton.svelte';
  import Map from '$lib/components/map/map.svelte';
  import Pagination from '$lib/components/pagination/pagination.svelte';
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
  import NotVisible from '$lib/components/icons/not-visible.svelte';
  import Heart from '$lib/components/icons/heart.svelte';
  import HeartFilled from '$lib/components/icons/heart-filled.svelte';
  import type { SelectOption } from '$lib/components/select-customized/selected-types';
  import type { DistributionOption, GeospatialRecord } from '$lib/db/db-types';
  import type { MapTypes } from '$lib/components/map/map-types';

  type SearchResult = GeospatialRecord & {
    description_en: string;
    description_fr: string;
    coordinates: number[][];
  };

  /************* User Data ***************/
  const userId = page.data.userData?.uuid;

  /************* Translations ***************/
  const translations = page.data.t;

  const mapNotAvailableText = translations?.mapNotAvailable ? translations['mapNotAvailable'] : 'Map not available';
  const saveSearchParamsText = translations?.saveSearchParams ? translations['saveSearchParams'] : 'Save Search Parameters';
  const formatText = translations?.formatParams ? translations['format'] : 'Format';
  const organizationText = translations?.organization ? translations['organization'] : 'Organization';
  const windowTooSmall = translations?.windowTooSmall ? translations['windowTooSmall'] : '';

  /************* Accordion Components ***************/
  let data = $derived(page.data);
  let accordionComponents: Accordion[] = $state([]);

  // When the page data changes, close all of the accordions.
  // This will reset the maps.
  $effect(() => {
    closeAllAccordions();
  });

  /**
   * Closes all of the accordions in the result list.
   */
  function closeAllAccordions(): void {
    if (data) {
      accordionComponents.forEach((accordion: Accordion) => {
        if (accordion) {
          accordion.closeAccordion();
        }
      });
    }
  }

  /****************** Sorting ******************/
  // + 1 because the first page of results is page 0, but the pagination element starts at 1
  let currentPage: number = $state(Number(page.url.searchParams.get('page-number') ?? '0') + 1);

  const sortBySelectData = page.data.sortOptions;
  const searchMode = page.data.searchMode ?? 'semantic';

  let sortOrder;
  if (searchMode === 'semantic') {
    sortOrder = page.url.searchParams.get('sort') ?? 'relevancy';
  } else {
    sortOrder = page.url.searchParams.get('sort') ?? 'popularity-desc';
  }

  let defaultOption = sortBySelectData.find((sortData: { value: string }) => sortData.value === sortOrder);
  let selected = $state(defaultOption ?? sortBySelectData[0]);

  /**
   * Changes the sort order of the search results.
   *
   * @param newSelected - The newly selected sort option.
   */
  function changeSort(newSelected: SelectOption | null): void {
    if (newSelected) {
      selected = newSelected;
      currentPage = 1;
      page.url.searchParams.set('sort', selected.value);
      page.url.searchParams.set('page-number', '0');
      goto(page.url, { invalidateAll: true });
    }
  }

  /****************** Pagination ******************/
  let itemsPerPage = 10;
  let pageMessage = $derived(page.data.numPageText);
  let results: SearchResult[] = $derived(page.data.results ?? []);
  let total = $derived(page.data.total ?? 0);

  let hrefPrefix = `${page.url.origin}${page.url.pathname}/record/`;

  /**
   * Changes the current page of the search results.
   *
   * @param newPage - The custom event containing the new page number.
   */
  function changePage(newPage: number): void {
    // Go to the top of the page with new page load
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    currentPage = newPage;
    page.url.searchParams.set('page-number', `${currentPage - 1}`);
    page.url.searchParams.set('results-per-page', `${itemsPerPage}`);
    goto(page.url, { invalidateAll: true });
  }

  /**
   * Gets the unique formats from a record's options.
   *
   * @param record - The record to get the formats from.
   * @returns An array of unique formats.
   */
  function getFormats(record: SearchResult): string[] {
    const options = record.options;

    // Get an array of just the format of each record option
    const formatArray = options.map((option: DistributionOption) => {
      const description = option.description;
      const descriptionString = lang === 'fr' ? description.fr : description.en;
      const descriptionArray = descriptionString?.split(';');

      // The description string is always in this format 'type;format;language',
      // so when splitting the string to an array, we can get the format by returning
      // the item in the second array index.
      return descriptionArray?.[1];
    });

    // Note: In the geocore records, the protocol is sometimes listed as the string 'null',
    // not just the value null, so we should check for the string to filter it out.
    // We can also check for 'undefined' as a string too for good measure.
    // Using indexOf allows us to check for duplicate values since it always returns the
    // first instance of the value being searched. If it doesn't match the current index,
    // then it must be a duplicate.
    const filteredFormats = formatArray
      .filter((format: string | undefined, index: number, self: (string | undefined)[]) => {
        return format && format !== 'null' && format !== 'undefined' && self.indexOf(format) === index;
      })
      .filter((format) => format !== undefined);

    return filteredFormats;
  }

  /****************** Favourites Resources ******************/
  let favouriteRecordList: string[] = $state(page.data?.userData?.favourites ? [...page.data.userData.favourites] : []);

  /**
   * Handles the click event for the favourite button.
   *
   * @param recordId - The ID of the record to be favourited or unfavourited.
   * @returns A promise that resolves when the operation is complete.
   */
  async function handleFavouriteClick(recordId: string): Promise<void> {
    if (!favouriteRecordList.includes(recordId)) {
      // Add to list of ids
      favouriteRecordList.push(recordId);
    } else {
      // Remove from list of ids
      let index = favouriteRecordList.indexOf(recordId);
      if (index > -1) {
        favouriteRecordList.splice(index, 1);
      }
    }

    // Update localStorage and dispatch localstorage_updated event
    updateLocalStorage('FavouritesResources', favouriteRecordList);
  }

  // Local storage is only accessible from the client side, so we need to get
  // the FavouritesResources array inside onMount
  onMount(() => {
    let stored = localStorage.getItem('FavouritesResources');

    if (stored) {
      favouriteRecordList = stored.split(',');
    }
  });

  /****************** Map ******************/
  let mapType: MapTypes = 'resultList';
  let lang = page.data.lang === 'fr-ca' ? 'fr' : 'en';
</script>

<!-- When the window is resized, we can close each accordion to reset the map variables. -->
<svelte:window onresize={closeAllAccordions} />

<Card>
  {#if navigating.type !== null}
    <ResultListSkeleton numRecords={results.length} />
  {:else}
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between flex-wrap gap-y-4">
      <p class="font-custom-style-body-8 self-center">
        {pageMessage}
      </p>
      <div class="flex flex-row gap-3 md:gap-5">
        <div>
          <SelectCustomized selectType="resultList" optionsData={sortBySelectData} bind:selected selectedChange={changeSort} />
        </div>
        {#if userId}
          <!-- TODO: Add a method for this button -->
          <button class="button-3">{saveSearchParamsText}</button>
        {/if}
      </div>
    </div>
    <!-- List -->
    {#each results as result, index}
      <div class="bg-custom-1 px-5 py-4">
        <Accordion bind:this={accordionComponents[index]}>
          {#snippet accordionTitle()}
            <div class="sm:grid grid-cols-10">
              <!------------- Record info ------------->
              <div class="col-span-9 sm:pr-2">
                <a href={`${hrefPrefix}${result.id}`} class="underline hover:no-underline font-custom-style-header-4">
                  {lang === 'fr' ? result.title_fr : result.title_en}
                </a>
                <div class="line-clamp-2 pt-1">
                  <!-- Remove new line characters -->
                  {lang === 'fr' ? result.description_fr.replaceAll('\\n', '') : result.description_en.replaceAll('\\n', '')}
                </div>
              </div>

              <!------------- Favourites button ------------->
              {#if favouriteRecordList.includes(result.id)}
                <button
                  class="col-start-10 justify-self-end text-custom-16 self-center w-fit
                  mt-2 sm:mt-0 hover:text-custom-23"
                  title={translations.removeFromFavourites}
                  onclick={() => handleFavouriteClick(result.id)}
                >
                  <HeartFilled classes="h-9" />
                </button>
              {:else}
                <button
                  class="col-start-10 justify-self-end text-custom-16 self-center w-fit
                  mt-2 sm:mt-0 hover:text-custom-23"
                  title={translations.addToFavourites}
                  onclick={() => handleFavouriteClick(result.id)}
                >
                  <Heart classes="h-9 hover:fill-custom-23" />
                </button>
              {/if}
            </div>
          {/snippet}
          {#snippet accordionContent()}
            <div class="mt-5">
              <!------------- Record Details ------------->
              <div class="mb-5">
                <p>
                  <span class="font-semibold">{organizationText}: </span>
                  {lang === 'fr'
                    ? result.contact[0]?.organisation?.fr?.replaceAll(';', '; ')
                    : result.contact[0]?.organisation?.en?.replaceAll(';', '; ')}
                </p>
                <p class="mt-2">
                  <span class="font-semibold">{formatText}: </span>
                  {#each getFormats(result) as format}
                    <span class="text-sm bg-custom-16/15 py-0.5 px-2 mt-1 mr-2 rounded inline-block">{format}</span>
                  {/each}
                </p>
              </div>

              <!------------- Map ------------->
              <!-- Note: We will only show a map for screens larger than 640px -->
              {#if result.coordinates}
                <div class="hidden sm:flex">
                  <Map coordinates={result.coordinates} id={result.id} dynamic={true} {mapType} footer={false} />
                </div>
                <div class="sm:hidden">
                  <p class="md:mx-0">
                    {windowTooSmall}
                  </p>
                  <div class="mt-5 bg-[url('/map-not-available.png')] bg-cover max-w-full h-60">
                    <div class="bg-black/35 w-full h-full flex items-center justify-center">
                      <NotVisible classes="text-custom-1 h-32" />
                    </div>
                  </div>
                </div>
              {:else}
                {mapNotAvailableText}
              {/if}
            </div>
          {/snippet}
        </Accordion>
      </div>
    {/each}
    <!------------- Pagination ------------->
    <div class="flex justify-end w-full">
      <Pagination totalItems={total} {itemsPerPage} bind:currentPage pageChange={changePage} />
    </div>
  {/if}
</Card>

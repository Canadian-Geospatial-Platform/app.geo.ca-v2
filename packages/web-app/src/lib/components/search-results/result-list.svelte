<script lang="ts">
  import { page, navigating } from '$app/stores';
  import { afterNavigate, goto } from '$app/navigation';
  import { tick } from 'svelte';
  import Accordion from '$lib/components/accordion/accordion.svelte';
  import Card from '$lib/components/card/card.svelte';
  import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
  import Map from '$lib/components/map/map.svelte';
  import Pagination from '$lib/components/pagination/pagination.svelte';
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
  import NotVisible from "$lib/components/icons/not-visible.svelte";

  /************* User Data ***************/
  const userId = $page.data.userData?.uuid;

  /************* Translations ***************/
  const translations = $page.data.t;

  const mapNotAvailableText = translations?.mapNotAvailable ?
    translations["mapNotAvailable"] : "Map preview not available";
  const saveSearchParamsText = translations?.saveSearchParams ?
    translations["saveSearchParams"] : "Save Search Parameters";
  const formatText = translations?.formatParams ? translations["format"] : "Format";
  const organizationText = translations?.organization ? translations["organization"] : "Organization";
  const windowTooSmall = translations?.windowTooSmall ? translations["windowTooSmall"] : "";

  /************* Accordion Components ***************/
  let data = $derived($page.data);
  let accordionComponents = $state([]);

  // When the page data changes, close all of the accordions.
  // This will reset the maps.
  $effect(() => {
    closeAllAccordions();
  });

  function closeAllAccordions() {
    if (data) {
      accordionComponents.forEach((accordion) => {
        if (accordion) {
          accordion.closeAccordion();
        }
      })
    }
  }

  /****************** Sorting ******************/
  // + 1 because the first page of results is page 0, but the pagination element starts at 1
  let currentPage = $state(Number($page.url.searchParams.get('page-number') ?? '0') + 1);

  const sortBySelectData = $page.data.sortOptions;
  const searchMode = $page.data.searchMode ?? 'semantic';

  let sortOrder;
  if (searchMode == 'semantic') {
    sortOrder = $page.url.searchParams.get('sort') ?? 'relevancy';
  } else {
    sortOrder = $page.url.searchParams.get('sort') ?? 'popularity-desc';
  }

  let defaultOption = sortBySelectData.find((x) => x.value == sortOrder);
  let selected = $state(defaultOption ?? sortBySelectData[0]);

  function changeSort(event: CustomEvent) {
    selected = event;
    currentPage = 1;
    $page.url.searchParams.set('sort', selected.value);
    $page.url.searchParams.set('page-number', '0');
    goto($page.url, { invalidateAll: true });
  }

  /****************** Pagination ******************/
  let itemsPerPage = 10;
  let pageMessage = $derived($page.data.numPageText);
  let results = $derived($page.data.results ?? []);
  let total = $derived($page.data.total ?? 0);
  let totalPages = $derived(Math.ceil(total/itemsPerPage));

  let hrefPrefix = $page.url.origin + $page.url.pathname + '/record/';

  function parsePageMessage(message, page, numPages) {
    message = message.replaceAll('{{page}}', page);
    message = message.replaceAll('{{totalPages}}', numPages);

    return message;
  }

  function changePage(event: CustomEvent) {
    currentPage = event;
    $page.url.searchParams.set('page-number', `${currentPage - 1}`);
    $page.url.searchParams.set('results-per-page', `${itemsPerPage}`);
    goto($page.url, { invalidateAll: true });
  }

  function getFormats(record) {
    const options = record.options;

    // Get an array of just the format of each record option
    const formatArray = options.map((x) => {
      const description = x.description;
      const descriptionString = lang == 'fr' ? description.fr : description.en;
      const descriptionArray = descriptionString.split(';');

      // The description string is always in this format 'type;format;language',
      // so when splitting the string to an array, we can get the format by returning
      // the item in the second array index.
      return descriptionArray[1];
    });

    // Note: In the geocore records, the protocol is sometimes listed as the string 'null',
    // not just the value null, so we should check for the string to filer it out.
    // We can also check for 'undefined' as a string too for good measure.
    // Using indexOf allows us to check for duplicate values since it always returns the
    // first instance of the value being searched. If it doesn't match the current index,
    // then it must be a duplicate.
    const filteredFormats = formatArray.filter((x, index, self) => {
      return x && x !== 'null' && x != 'undefined' && self.indexOf(x) === index;
    });

    return filteredFormats;
  }

  /****************** Map ******************/
  let mapType = 'resultList';
  let lang = $page.data.lang == 'fr-ca' ? 'fr' : 'en';

  afterNavigate(async () => {
    try {
      await tick();
      cgpv.init();
    } catch (e) {
      console.warn('Error initialising cgpv.', e);
    }
  });
</script>

<!-- When the window is resized, we can close each accordion to reset the map variables. -->
<svelte:window onresize={closeAllAccordions} />

<Card>
  {#if $navigating}
    <LoadingMask classes="absolute bottom-0 right-0 pt-28"/>
  {/if}
  <!-- Header -->
  <div class="flex flex-col md:flex-row justify-between flex-wrap gap-y-4">
    <p class="font-custom-style-body-6">
      {pageMessage}
    </p>
    <div class="flex flex-row gap-3 md:gap-5">
      <div>
        <SelectCustomized
          selectType='resultList'
          optionsData={sortBySelectData}
          bind:selected={selected}
          selectedChange={changeSort}
        />
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
          <div>
            <a
              href={hrefPrefix + result.id}
              class="uppercase underline font-custom-style-header-2"
            >
              {result.title}
            </a>
            <div class="line-clamp-2 pt-1">
              <!-- Remove new line characters -->
              {result.description.replaceAll('\\n', '')}
            </div>
          </div>
        {/snippet}
        {#snippet accordionContent()}
          <div  class="mt-5">

            <!-- Record Details -->
            <div class="mb-5">
              <p>
                <span class="font-semibold">{organizationText}: </span>
                {lang == 'fr' ?
                    result.contact[0].organisation.fr.replaceAll(';', '; ') :
                    result.contact[0].organisation.en.replaceAll(';', '; ')}
              </p>
              <p class="mt-2">
                <span class="font-semibold">{formatText}: </span>
                {#each getFormats(result) as format, i}
                  <span class="text-sm bg-custom-16/15 py-0.5 px-2 mt-1 mr-2 rounded inline-block">{format}</span>
                {/each}
              </p>
            </div>

            <!-- Map -->
            <!-- Note: We will only show a map for screens larger than 640px -->
            {#if result.coordinates}
              <div class="hidden sm:flex">
                <Map
                  coordinates={result.coordinates} id={result.id}
                  dynamic={true} mapType={mapType} footer=true
                />
              </div>
              <div class="sm:hidden">
                <p class="md:mx-0">
                  {windowTooSmall}
                </p>
                <div class="mt-5 bg-[url('/map-not-available.png')] bg-cover max-w-full h-60">
                  <div class="bg-black/35 w-full h-full flex items-center justify-center">
                    <NotVisible classes="text-custom-1 h-32"/>
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
  <!-- Pagination -->
  <div class="flex justify-end w-full">
    <Pagination
      totalItems={total}
      {itemsPerPage}
      bind:currentPage={currentPage}
      pageChange={changePage}
    />
  </div>
</Card>

<script lang="ts">
  import { page, navigating } from '$app/stores';
  import { afterNavigate, goto } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import { paginationNumber, updatePaginationNumber } from '$lib/components/search-results/store';
  import Accordion from '$lib/components/accordion/accordion.svelte';
  import ArrowDown from "$lib/components/icons/arrow-down.svelte";
  import ArrowUp from "$lib/components/icons/arrow-up.svelte";
  import Card from '$lib/components/card/card.svelte';
  import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
  import Map from '$lib/components/map/map.svelte';
  import Pagination from '$lib/components/pagination/pagination.svelte';
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';

  /************* User Data ***************/
  const userId = $page.data.userData?.uuid;

  /************* Translations ***************/
  const translations = $page.data.t;

  const datasetText = translations?.dataset ? translations["dataset"] : "Dataset";
  const datasetsText = translations?.datasets ? translations["datasets"] : "Datasets";
  const dateText = translations?.date ? translations["date"] : "Date";
  const mapNotAvailableText = translations?.mapNotAvailable ?
    translations["mapNotAvailable"] : "Map preview not available";
  const popularityText = translations?.popularity ? translations["popularity"] : "Popularity";
  const saveSearchParamsText = translations?.saveSearchParams ?
    translations["saveSearchParams"] : "Save Search Parameters";
  const titleText = translations?.title ? translations["title"] : "Title";

  /****************** Sorting ******************/
  let url = $page.url;
  let sortOrder = url.searchParams.get('sort') ?? 'title';
  // + 1 because the first page of results is page 0, but the pagination element starts at 1
  $: currentPage = Number(url.searchParams.get('page-number') ?? '0') + 1;

  const sortBySelectData = [
    {"value": "date-desc", "label": dateText, "icon": ArrowDown},
    {"value": "date-asc", "label": dateText, "icon": ArrowUp},
    {"value": "popularity-desc", "label": popularityText, "icon": ArrowDown},
    {"value": "popularity-asc", "label": popularityText, "icon": ArrowUp},
    {"value": "title", "label": titleText}
  ]

  let defaultOption = sortBySelectData.find((x) => x.value == sortOrder);
  $: selected = defaultOption ?? sortBySelectData[0];

  function changeSort(event: CustomEvent) {
    url = $page.url;
    selected = event.detail;
    currentPage = 1;
    updatePaginationNumber(currentPage);
    url.searchParams.set('sort', selected.value);
    url.searchParams.set('page-number', '0');
    goto(url, { invalidateAll: true });
  }

  /****************** Pagination ******************/
  let itemsPerPage = 10;
  $: results = $page.data.results ?? [];
  $: total = $page.data.total ?? 0;

  let hrefPrefix: string;

  function changePage(event: CustomEvent) {
    url = $page.url;
    currentPage = event.detail;
    updatePaginationNumber(currentPage);
    url.searchParams.set('page-number', `${currentPage - 1}`);
    url.searchParams.set('results-per-page', `${itemsPerPage}`);
    goto(url, { invalidateAll: true });
  }

  /****************** Map ******************/
  let mapHeight = '16rem';
  let mapWidth = '100%';
  let lang = $page.data.lang == 'fr-ca' ? 'fr' : 'en';

  // Function to update mapHeight based on breakpoints
  function updateMapSize() {
    if (window.matchMedia('(min-width: 1536px)').matches) {
      mapHeight = '32rem'; // 2xl breakpoint
    } else if (window.matchMedia('(min-width: 1280px)').matches) {
      mapHeight = '28rem'; // xl breakpoint
    } else if (window.matchMedia('(min-width: 1024px)').matches) {
      mapHeight = '24rem'; // lg breakpoint
    } else if (window.matchMedia('(min-width: 768px)').matches) {
      mapHeight = '20rem'; // md breakpoint
    } else {
      mapHeight = '16rem'; // Default for smaller screens
    }
  }

  onMount(() => {
    // Sometimes the pagination element needs to be reset from other components.
    // E.g. when a new value is entered in the search bar. We can use a store to do this.
    updatePaginationNumber(currentPage);
    paginationNumber.subscribe((value) => {
      currentPage = value;
    });

    hrefPrefix = url.origin + url.pathname + '/record/';

    /******** Map width setting **********/
    // This is used to set the map width based on the active tailwind break points
    updateMapSize();
  });

  afterNavigate(async () => {
    try {
      await tick();
      cgpv.init();
    } catch (e) {
      console.warn('Error initialising cgpv.', e);
    }
  });
</script>

<Card>
  {#if $navigating}
    <LoadingMask classes="bottom-0 right-0 z-10"/>
  {/if}
  <!-- Header -->
  <div class="flex flex-col-reverse md:flex-row justify-between flex-wrap-reverse">
    <p class="font-custom-style-body-6">
      {#if total === 1}
        {total} {datasetText}
      {:else}
        {total} {datasetsText}
      {/if}
    </p>
    <div class="flex flex-col-reverse md:flex-row gap-3 md:gap-5">
      <div class="w-full md:w-48">
        <SelectCustomized
          optionsData={sortBySelectData}
          selectId={"sort-options"}
          bind:selected={selected}
          on:selectedChange={changeSort}
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
      <Accordion>
        <div slot="accordionTitle">
          <a 
            href={hrefPrefix + result.id}
            class="uppercase underline font-custom-style-header-2"
            target="_blank"
          >
            {result.title}
          </a>
          <div class="line-clamp-2">
            {result.description}
          </div>
        </div>
        <div slot="accordionContent" class="mt-9">
          <!--For now, we will only load vector maps. Other map types won't load-->
          {#if result.coordinates}
            <div class="flex">
              <Map
                coordinates={result.coordinates} id={result.id}
                height={mapHeight} width={mapWidth}
                dynamic={true} useMap={result.hasMap}
              />
            </div>
          {:else}
            {mapNotAvailableText}
          {/if}
        </div>
      </Accordion>
    </div>
  {/each}
  <!-- Pagination -->
  <div class="flex justify-end">
    <Pagination
      totalItems={total}
      {itemsPerPage}
      bind:currentPage={currentPage}
      on:pageChange={changePage}
    />
  </div>
</Card>

<script lang="ts">
  import { page, navigating } from '$app/stores';
  import { afterNavigate, goto } from '$app/navigation';
  import { onMount, tick } from 'svelte';
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

  const dateText = translations?.date ? translations["date"] : "Date";
  const mapNotAvailableText = translations?.mapNotAvailable ?
    translations["mapNotAvailable"] : "Map preview not available";
  const popularityText = translations?.popularity ? translations["popularity"] : "Popularity";
  const saveSearchParamsText = translations?.saveSearchParams ?
    translations["saveSearchParams"] : "Save Search Parameters";
  const titleText = translations?.title ? translations["title"] : "Title";

  /****************** Sorting ******************/
  let sortOrder = $page.url.searchParams.get('sort') ?? 'title';
  // + 1 because the first page of results is page 0, but the pagination element starts at 1
  $: currentPage = Number($page.url.searchParams.get('page-number') ?? '0') + 1;

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
    selected = event.detail;
    currentPage = 1;
    $page.url.searchParams.set('sort', selected.value);
    $page.url.searchParams.set('page-number', '0');
    goto($page.url, { invalidateAll: true });
  }

  /****************** Pagination ******************/
  let itemsPerPage = 10;
  $: pageMessage = $page.data.numPageText;
  $: results = $page.data.results ?? [];
  $: total = $page.data.total ?? 0;
  $: totalPages = Math.ceil(total/itemsPerPage);

  let hrefPrefix = $page.url.origin + $page.url.pathname + '/record/';

  function parsePageMessage(message, page, numPages) {
    message = message.replaceAll('{{page}}', page);
    message = message.replaceAll('{{totalPages}}', numPages);

    return message;
  }

  function changePage(event: CustomEvent) {
    currentPage = event.detail;
    $page.url.searchParams.set('page-number', `${currentPage - 1}`);
    $page.url.searchParams.set('results-per-page', `${itemsPerPage}`);
    goto($page.url, { invalidateAll: true });
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

<Card>
  {#if $navigating}
    <LoadingMask classes="bottom-0 right-0 z-10"/>
  {/if}
  <!-- Header -->
  <div class="flex flex-col md:flex-row justify-between flex-wrap gap-y-4">
    <p class="font-custom-style-body-6">
      {pageMessage}
    </p>
    <div class="flex flex-col-reverse md:flex-row gap-3 md:gap-5">
      <div class="w-full md:w-48">
        <SelectCustomized
          buttonWidth='w-48 md:w-full'
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
                dynamic={true} useMap={result.hasMap}
                mapType={mapType}
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
  <div class="flex justify-end w-full">
    <Pagination
      totalItems={total}
      {itemsPerPage}
      bind:currentPage={currentPage}
      on:pageChange={changePage}
    />
  </div>
</Card>

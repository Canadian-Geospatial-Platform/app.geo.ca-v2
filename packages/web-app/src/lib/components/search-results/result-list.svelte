<script lang="ts">
  import { page, navigating } from '$app/stores';
  import { goto } from '$app/navigation';
  import ArrowUp from "$lib/components/icons/arrow-up.svelte";
  import ArrowDown from "$lib/components/icons/arrow-down.svelte";
  import Card from '$lib/components/card/card.svelte';
	import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
	import Accordian from '$lib/components/accordion/accordian.svelte';
	import { onMount } from 'svelte';
	import Pagination from '$lib/components/pagination/pagination.svelte';
	import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
  import Map from '$lib/components/map/map.svelte';
  import { tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

  /************* Translations ***************/
  const translations = $page.data.t;

  const datasetText = translations?.dataset ? translations["dataset"] : "Dataset";
  const datasetsText = translations?.datasets ? translations["datasets"] : "Datasets";
  const dateText = translations?.date ? translations["date"] : "Date";
  const popularityText = translations?.popularity ? translations["popularity"] : "Popularity";
  const titleText = translations?.title ? translations["title"] : "Title";
  const saveSearchParamsText = translations?.saveSearchParams ?
    translations["saveSearchParams"] : "Save Search Parameters";

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

  function changeSort(event: any) {
    selected = event.detail;
    currentPage = 1;
    url.searchParams.set('sort', selected.value);
    url.searchParams.set('page-number', '0');
    goto(url, { invalidateAll: true });
  }

  /****************** Pagination ******************/
  let itemsPerPage = 10;
  $: results = $page.data.results ?? [];
  $: total = $page.data.total ?? 0;

  let hrefPrefix: string;
  onMount(() => {
    hrefPrefix = url.origin + url.pathname + '/record/';
  });

  function changePage(event: any) {
    currentPage = event.detail;
    url.searchParams.set('page-number', `${currentPage - 1}`);
	  url.searchParams.set('results-per-page', `${itemsPerPage}`);
    goto(url, { invalidateAll: true });
  }

  /****************** Map ******************/
  let mapHeight = '24rem';
  let mapWidth = '100%';

  // TODO: find a way to load only one map at a time using the ID
  // TODO: reset maps on page change
  // TODO: find out why some maps load and some don't

  async function loadMap(event: any, mapId, mapType) {
    console.log('MAP Type!!!!!!!!!!!!!!! ' + mapType);
    console.log(event);
    // TODO: Figure out why non vector type layers won't load
    if (mapType.includes('vector')) {
      try {
        await tick();
        cgpv.init(function () {});
      } catch (e) {
        console.warn('Error initialising cgpv.', e);
      }
    }
  }
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
      <!-- TODO: Add a method for this button -->
      <button class="button-3">{saveSearchParamsText}</button>
    </div>
  </div>
  <!-- List -->
  {#each results as result, index}
    <div class="bg-custom-1 px-5 py-4">
      <Accordian on:openChange={(event) => loadMap(event, result.id, result.spatialRepresentation)}>
        <div slot="accordianTitle">
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
        <div slot="accordianContent" class="mt-4">
          <!--For now, we will only load vector maps. Other map types won't load-->
          {#if result.spatialRepresentation.includes('vector')}
            <div class="flex justify-center items-center">
              <Map
                coordinates={result.coordinates} id={result.id}
                height={mapHeight} width={mapWidth}
                dynamic={true}
              />
            </div>
          {:else}
            Map preview not available
          {/if}
        </div>
      </Accordian>
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

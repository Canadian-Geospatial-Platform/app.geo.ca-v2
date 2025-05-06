<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import NoMap from '$lib/components/icons/no-map.svelte';
  import CheckboxCustomized from '$lib/components/checkbox-customized/checkbox-customized.svelte';
  import MymapMap from '$lib/components/map/mymap-map.svelte';
  import SortableTable from "$lib/components/sortable-table/sortable-table.svelte";
  import MyMapListSkeleton from '$lib/components/loading-mask/mymap-list-skeleton.svelte';

  type MyMapRow = {
    id: string;
    name: string;
    url: string;
  };

  /************* Translations ***************/
  const translations = $page.data.t;
  const lang = $page.data.lang;

  const findAResource = translations?.findAResource ? translations.findAResource : 'Find a resource';
  const mapViewLabel = translations?.mapView ? translations.mapView : 'Map View';
  const myMapTitle = translations?.title ? translations.title : 'MyMap';
  const pageDescription = translations?.description ? translations.description : '';
  const removeSelected = translations?.removeSelected ? translations.removeSelected : 'Remove selected';
  const resourceIdLabel = translations?.resourceId ? translations.resourceId : 'Resource id';
  const resourceListEmpty = translations?.resourceListEmpty ? translations.resourceListEmpty : 'The resource list is empty.';
  const resourceNameLabel = translations?.resourceName ? translations.resourceName : 'Resource name';

  const langShort = lang == 'fr-ca' ? 'fr' : 'en';
  const titleKey = 'title_' + langShort;

  /************* Resource Table ***************/
  let sortableTable = $state();
  let loading = $state(true);
  let mapToggle = $state(false);

  let favouriteRecordList = $state($page.data?.userData?.mapCart ?
    [...$page.data?.userData?.mapCart] : []);
  let records = $state([]);
  let tableDataArray = $state([]);

  // Table column labels
  const tableLabels: MyMapRow = {
    "name": resourceNameLabel,
    "id": resourceIdLabel
  };

  /************* Handlers ***************/

  // When a resource is removed, update the table rows and local storage to match
  function handleRemoveSelectedClick(event) {
    const selectedIds = new Set(sortableTable.getSelectedIds());

    // Update resource lists
    favouriteRecordList = favouriteRecordList.filter(id => !selectedIds.has(id));
    tableDataArray = tableDataArray.filter(row => !selectedIds.has(row.id));
    records = records.filter(record => !selectedIds.has(record.id));

    // Update the table
    sortableTable.updateTableContent(tableDataArray);

    // Update localStorage
    localStorage.setItem("MyMapResources", favouriteRecordList);

    // TODO: update user's favourites when the login system is implemented
  }

  // Local storage is only accessible from the client side, so we need to get
  // the MyMapResources array inside onMount
  onMount(async () => {
    // If not signed in, check the local storage for saved resources instead
    if (!$page.data.signedIn) {
      let stored = localStorage.getItem("MyMapResources");

      if (stored) {
        // local storage is always a string, so we need to convert to an array
        stored = stored.split(",");
        favouriteRecordList = [...stored];
      }

      // Issue POST request for record details
      if (favouriteRecordList.length > 0) {
        const response = await fetch('/[lang]/my-map', {
          method: 'POST',
          body: JSON.stringify({ ids: favouriteRecordList, lang: lang }),
          headers: {'Content-Type': 'application/json'}
        });

        records = await response.json();

        tableDataArray = records.map((record) => {
          return {
            id: record.id,
            name: record[titleKey],
            url: $page.url.origin + "/" + lang + "/map-browser/record/" + record.id
          };
        });
      }

      // Turn off the loading mask once the records have finished loading
      loading = false;
    }
  });
</script>

<div class="md:flex mb-4 mx-5 md:mx-0">
  <h1 class="font-custom-style-h1 md:mr-auto">
    {myMapTitle}
  </h1>

  <!-- Toggle between map and list -->
  <!-- Note: HTML doesn't have a built-in toggle input, so we can build one from a checkbox instead. -->
  <label class="inline-flex items-center cursor-pointer">
    <div class="mr-4 font-semibold">
      {mapViewLabel}
    </div>
    <input type="checkbox" value="show map" class="sr-only peer" bind:checked={mapToggle} >
    <div
      class="peer relative w-16 h-8 bg-custom-19 rounded-full shadow-[0_0.1875rem_0.375rem_#00000029]
        transition duration-500

        after:absolute after:h-9 after:w-9 after:start-0 after:-top-0.5 after:bg-custom-1 after:rounded-full
        after:shadow-[0_0.1875rem_0.375rem_#00000029] after:border-2 after:border-custom-19
        after:transition after:duration-500

        peer-checked:bg-custom-16 peer-checked:after:translate-x-8 peer-checked:after:border-custom-16
        peer-checked:transition peer-checked:duration-500"
    ></div>
  </label>
</div>

<div class="mx-5 md:mx-0 mb-5">
  {#if !loading}
    {#if records.length > 0}
      {#if mapToggle}
        <!-------------- Map -------------->
        <MymapMap layerIds={favouriteRecordList} />
      {:else}
        <!-------------- List -------------->
        <p class="font-custom-style-body-1 mx-0 mb-6">
          {@html pageDescription}
        </p>

        <SortableTable
          tableContent={tableDataArray}
          tableLabels={tableLabels}
          clickableRows={true}
          checkboxCol={true}
          bind:this={sortableTable}
        />

        <!-------------- buttons -------------->
        <div class="sm:flex">
          <button
            class="sm:inline-block button-5 w-full sm:w-fit mt-5 mb-4 sm:mb-0 sm:mr-5 shadow-[0_0.1875rem_0.375rem_#00000029]"
            onclick={(event) => handleRemoveSelectedClick(event)}
          >
            {removeSelected}
          </button>

          <a class="sm:inline-block w-full sm:w-fit mt-5" href={$page.url.origin + '/' + lang + '/map-browser'}>
            <div class="button-3 w-full sm:w-fit text-center shadow-[0_0.1875rem_0.375rem_#00000029]">
              {findAResource}
            </div>
          </a>
        </div>
      {/if}
    {:else}
      <!-------------- No records selected -------------->
      <div class="my-8">
        <NoMap classes="text-custom-19 m-auto h-48 md:h-80 lg:h-96" />

        <p class="block m-auto w-fit font-custom-style-h2 text-center">
          {resourceListEmpty}
        </p>

        <a
          class="block m-auto w-fit mt-5"
          href={$page.url.origin + '/' + lang + '/map-browser'}
        >
          <div class="button-3 w-fit shadow-[0_0.1875rem_0.375rem_#00000029]">
            {findAResource}
          </div>
        </a>
      </div>
    {/if}

  {:else if mapToggle}
    <!-- Map loading mask -->
    <div class="animate-pulse bg-custom-6 w-full h-[32rem]"></div>
  {:else if !mapToggle}
    <!-- Table loading skeleton -->
    <MyMapListSkeleton numRecords={6} />
  {/if}
</div>

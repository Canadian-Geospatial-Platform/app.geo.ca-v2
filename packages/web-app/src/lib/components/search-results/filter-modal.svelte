<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { updateBoundingBox, updateCategoryOfInterest, updateDateRange,
    updateFoundational, updateOrg, updateTheme, updateTypeFilter,
    updateTempCategoryOfInterest, clearAll
  } from '$lib/components/search-results/store';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import Close from '$lib/components/icons/close.svelte';
	import Search from '$lib/components/icons/search.svelte';
	import CategoryOfInterest from '$lib/components/search-results/filters/category-of-interest.svelte';
	import Organizations from '$lib/components/search-results/filters/organizations.svelte';
	import Types from '$lib/components/search-results/filters/types.svelte';
	import Themes from '$lib/components/search-results/filters/themes.svelte';
	import OtherFilters from '$lib/components/search-results/filters/other-filters.svelte';
	import SpatioTemporal from '$lib/components/search-results/filters/spatio-temporal.svelte';

  // TODO: Fix tab sequence for keyboard navigation i.e. disable content below mask

  export let active = false;
  export let numFilters = 0;

  /************* Translations ***************/
  const translations = $page.data.t;

  const filterByText = translations?.filterBy ? translations["filterBy"] : "Filter By";
  // TODO: update description text
  const filterDescriptionText = translations?.filterDescription ?
    translations["filterDescription"] : "";
  const clearAllText = translations?.clearAll ? translations["clearAll"] : "Clear All";
  const searchText = translations?.search ? translations["search"] : "Search";

  /************* Filter Data ***************/
  $: tempNumFilters = numFilters;
  let temporalActive = false;
  let spatialActive = false;

  /************* Handlers ***************/
  function handleCloseButtonClick(event: Event) {
    closeModal();
  }

  function handleClearAllClick(event: Event) {
    tempNumFilters = 0;
    numFilters = 0;
    temporalActive = false;
    spatialActive = false;
    updateTempCategoryOfInterest(null);
    updateCategoryOfInterest(null);
  }

  function handleSubmit(event: Event) {
    numFilters = tempNumFilters;
    let filterForm = event.target;
    let i: number;
    let formInput: HTMLInputElement;
    let key: string;

    let category = null;
    let bbox = null;
    let dateRange = null;
    let foundational = {
      foundational: false,
    }

    let org = {
      "agriculture-and-agri-food-canada": false,
      "canadian-geospatial-data-infrastructure-web-harvester": false,
      "canadian-heritage": false,
      "canadian-northern-economic-development-agency": false,
      "canadian-nuclear-safety-commission": false,
      "canadian-space-agency": false,
      "elections-canada": false,
      "employment-and-social-development-canada": false,
      "environment-and-climate-change-canada": false,
      "fisheries-and-oceans-canada": false,
      "government-and-municipalities-of-québec": false,
      "government-of-alberta": false,
      "government-of-british-columbia": false,
      "government-of-manitoba": false,
      "government-of-new-brunswick": false,
      "government-of-newfoundland-and-labrador": false,
      "government-of-northwest-territories": false,
      "government-of-nova-scotia": false,
      "government-of-nunavut": false,
      "government-of-ontario": false,
      "government-of-prince-edward-island": false,
      "government-of-saskatchewan": false,
      "government-of-yukon": false,
      "impact-assessment-agency-of-canada": false,
      "indigenous-services-canada": false,
      "national-defence": false,
      "natural-resources-canada": false,
      "parks-canada": false,
      "public-health-agency-of-canada": false,
      "statistics-canada": false,
      "transport-canada": false,
    };

    let theme = {
      administration: false,
      economy: false,
      emergency: false,
      environment: false,
      imagery: false,
      infrastructure: false,
      legal: false,
      science: false,
      society: false,
    };

    let typeFilter = {
      api: false,
      application: false,
      collection: false,
      community: false,
      dataset: false,
      service: false,
    };

    for (i = 0; i < filterForm.length; i++) {
      formInput = filterForm[i];
      if (formInput?.id == 'categories-of-interest') {
        category = formInput?.value ?? null;
      } else if (formInput?.type == 'checkbox' && formInput?.id == 'spatio-temporal-spatial-extent') {
        if (formInput.checked) {
          let northEl = document.getElementById('spatio-temporal-north');
          let eastEl = document.getElementById('spatio-temporal-east');
          let southEl = document.getElementById('spatio-temporal-south');
          let westEl = document.getElementById('spatio-temporal-west');

          let north = northEl.value;
          let east = eastEl.value;
          let south = southEl.value;
          let west = westEl.value;

          bbox = {
            north: north,
            east: east,
            south: south,
            west: west
          }
        } else {
          bbox = null;
        }
      } else if (formInput?.type == 'checkbox' && formInput?.id == 'spatio-temporal-temporal-extent') {
        if (formInput.checked) {
          let beginEl = document.getElementById('spatio-temporal-start');
          let endEl = document.getElementById('spatio-temporal-end');

          let begin = beginEl.value;
          let end = endEl.value;

          dateRange = {
            begin: begin,
            end: end
          }
        } else {
          dateRange = null;
        }
      } else if (formInput?.type == 'checkbox' && formInput?.name == 'others') {
        // Note: The different filters in the 'others' section will have their own
        // entries in the filters store (since they are listed seperately in the get request),
        // so we need to check for each one
        if (formInput?.id == 'others-foundational') {
          foundational.foundational = formInput.checked ? true : false;
        }
      } else if (formInput?.type == 'checkbox' && formInput.name && formInput.id) {
        if (formInput.name == 'org') {
          key = formInput.id.replace('org-', '');
          org[key] = formInput.checked ? true : false;
        } else if (formInput.name == 'type') {
          key = formInput.id.replace('type-', '');
          typeFilter[key] = formInput.checked ? true : false;
        } else if (formInput.name == 'theme') {
          key = formInput.id.replace('theme-', '');
          theme[key] = formInput.checked ? true : false;
        }
      }
    }

    updateBoundingBox(bbox);
    updateCategoryOfInterest(category);
    updateDateRange(dateRange);
    updateFoundational(foundational);
    updateOrg(org);
    updateTheme(theme);
    updateTypeFilter(typeFilter);

    let query = new URLSearchParams($page.url.searchParams.toString());

    if (bbox) {
      query.set('north', bbox.north);
      query.set('east', bbox.east);
      query.set('south', bbox.south);
      query.set('west', bbox.west);
      query.set('bbox', bbox.south + '|' + bbox.west + '|' + bbox.north + '|' + bbox.east);
    }

    let opts = {
			replaceState: true,
			keepfocus: true
		};
		goto(`?${query.toString()}`, opts);

    console.log(query);

    closeModal();
  }

  /************* utility methods ***************/

  function closeModal() {
    active = false;
    toggleScroll(active);
  }
</script>

<div
  class="fixed flex justify-center z-30 inset-0 bg-custom-7/75 overflow-y-scroll hide-scroll pb-4"
  class:hidden={!active}
>
  <form
    class="grid grid-cols-6 bg-custom-1 border border-custom-21 w-2/3 h-fit mt-2"
    on:submit|preventDefault={handleSubmit}
  >
    <div class="col-span-5 flex flex-col gap-5 px-5 pb-5 pt-8 font-custom-style-body-1">
      <div>
        <h1 class="font-custom-style-h1-2">{filterByText}</h1>
        <p>{filterDescriptionText}</p>
      </div>
      <div class="flex flex-col gap-y-5">
        <CategoryOfInterest
          bind:tempNumFilters={tempNumFilters}
        />
        <SpatioTemporal
          bind:tempNumFilters={tempNumFilters}
          bind:temporalActive={temporalActive}
          bind:spatialActive={spatialActive}
        />
        <Organizations bind:tempNumFilters={tempNumFilters} />
        <Types bind:tempNumFilters={tempNumFilters} />
        <Themes bind:tempNumFilters={tempNumFilters} />
        <OtherFilters bind:tempNumFilters={tempNumFilters} />
      </div>
    </div>
    <div class="col-span-1 px-5 pt-8 justify-self-end">
      <button
        type="button"
        class="flex justify-center items-center border border-custom-16 rounded-[50%] h-[49px] w-[49px]"
        on:click={handleCloseButtonClick}
      >
        <Close classes="text-custom-16 h-[21px]"/>
      </button>
    </div>
    <div class="grid grid-cols-2 col-span-6 bg-custom-5 border-t border-custom-21 px-5 py-[18px]">
      <button
        type="reset" class="justify-self-start button-3"
        on:click={handleClearAllClick}
      >
        {clearAllText}
      </button>
      <button type="submit" class="justify-self-end button-5 shadow-[0px_3px_6px_#00000029]">
        <Search classes="inline" height="18px"/>
        {searchText}
      </button>
    </div>
  </form>
</div>

<style>
  .hide-scroll {
    -ms-overflow-style: none;  /* Edge */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scroll::-webkit-scrollbar {
    @apply hidden; /* Chrome */
  }
</style>

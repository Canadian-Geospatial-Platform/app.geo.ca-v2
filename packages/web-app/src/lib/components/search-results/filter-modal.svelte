<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { updateTempCategoryOfInterest, updatePaginationNumber } from '$lib/components/search-results/store';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
  import Close from '$lib/components/icons/close.svelte';
  import Search from '$lib/components/icons/search.svelte';
  import CategoryOfInterest from '$lib/components/search-results/filters/category-of-interest.svelte';
  import Organizations from '$lib/components/search-results/filters/organizations.svelte';
  import Types from '$lib/components/search-results/filters/types.svelte';
  import Themes from '$lib/components/search-results/filters/themes.svelte';
  import OtherFilters from '$lib/components/search-results/filters/other-filters.svelte';
  import SpatioTemporal from '$lib/components/search-results/filters/spatio-temporal.svelte';

  export let active = false;
  export let numFilters = 0;

  const translations = $page.data.t;

  const filterByText = translations?.filterBy ?? "Filter By";
  const filterDescriptionText = translations?.filterDescription ?? "";
  const clearAllText = translations?.clearAll ?? "Clear All";
  const searchText = translations?.search ?? "Search";

  let temporalActive = false;
  let spatialActive = false;

  const categoriesKey = 'category-of-interest';
  const orgKey = 'org';
  const typeKey = 'type';
  const themeKey = 'theme';
  const foundationalKey = 'foundational';
  const bboxKey = 'bbox';
  const dateRangeKey = 'dateRange';
  const delineator = '|';

  let categoriesComponent;
  let othersCompontent;
  let orgCompontent;
  let themeCompontent;
  let typeCompontent;
  let spatioTemporalComponent;

  /************* Handlers ***************/
  function handleCloseButtonClick(event: Event) {
    closeModal();
  }

  function handleClearAllClick(event: Event) {
    temporalActive = false;
    spatialActive = false;
    updateTempCategoryOfInterest(null);
    clearAllChecks();
  }

  function handleSubmit(event: Event) {
    const formEl = event.target;
    const formData = new FormData(formEl);
    const categoryVal = categoriesComponent.getValue();

    const filters = {
      category: categoryVal ? categoryVal : null,
      bbox: formData.get('spatio-temporal-spatial-extent') ? parseBoundingBox() : null,
      dateRange: formData.get('spatio-temporal-temporal-extent') ? parseDateRange() : null,
      other: {
        foundational: formData.has('others-foundational'),
      },
      org: {},
      typeFilter: {},
      theme: {}
    };

    for (let [key, value] of formData.entries()) {
      if (key.startsWith('org-')) {
        filters.org[key.replace('org-', '')] = value === 'on';
      } else if (key.startsWith('type-')) {
        filters.typeFilter[key.replace('type-', '')] = value === 'on';
      } else if (key.startsWith('theme-')) {
        filters.theme[key.replace('theme-', '')] = value === 'on';
      }
    }

    numFilters = countFilters(filters);

    const query = buildFilterParams(filters);
    goto(`?${query.toString()}`, { replaceState: true, keepfocus: true });

    closeModal();
  }

  /************* utility methods ***************/
  export function setFiltersFromURL() {
    categoriesComponent.resetFilters();
    orgCompontent.resetFilters();
    othersCompontent.resetFilters();
    typeCompontent.resetFilters();
    themeCompontent.resetFilters();
    spatioTemporalComponent.resetFilters();
  }
  
  function clearAllChecks() {
    orgCompontent.clearAllFilters();
    othersCompontent.clearAllFilters();
    typeCompontent.clearAllFilters();
    themeCompontent.clearAllFilters();
    spatioTemporalComponent.clearAllFilters();
  }

  function parseBoundingBox() {
    return spatioTemporalComponent.getBBox();
  }

  function parseDateRange() {
    return spatioTemporalComponent.getDateRange();
  }

  function countFilters(filters) {
    let filterCount = 0;

    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value !== null && key != bboxKey && key != dateRangeKey) {
        filterCount = filterCount + countFilters(value);
      } else if (value) {
        filterCount = filterCount + 1;
      }
    }

    return filterCount;
  }

  function buildFilterParams(filters) {
    const bbox = filters.bbox;
    const category = filters.category;
    const dateRange = filters.dateRange;
    const foundational = filters.other.foundational;
    const org = filters.org;
    const typeFilter = filters.typeFilter;
    const theme = filters.theme;

    const query = new URLSearchParams($page.url.searchParams.toString());

    // BBOX
    if (bbox) {
      query.set('north', bbox.north);
      query.set('east', bbox.east);
      query.set('south', bbox.south);
      query.set('west', bbox.west);
      query.set(bboxKey, `${bbox.south}|${bbox.west}|${bbox.north}|${bbox.east}`);
    } else {
      query.delete('north');
      query.delete('east');
      query.delete('south');
      query.delete('west');
      query.delete(bboxKey);
    }

    // Date range
    if (dateRange) {
      query.set('begin', dateRange.begin);
      query.set('end', dateRange.end);
    } else {
      query.delete('begin');
      query.delete('end');
    }

    category ? query.set(categoriesKey, category) : query.delete(categoriesKey);

    foundational ? query.set(foundationalKey, foundational) : query.delete(foundationalKey);

    const orgString = getFilterStringFromObj(Object.entries(org));
    orgString ? query.set(orgKey, orgString) : query.delete(orgKey);

    const typeFilterString = getFilterStringFromObj(Object.entries(typeFilter));
    typeFilterString ? query.set(typeKey, typeFilterString) : query.delete(typeKey);

    const themeString = getFilterStringFromObj(Object.entries(theme));
    themeString ? query.set(themeKey, themeString) : query.delete(themeKey);

    // When filters change, reset the page and pagination element back to the start
    query.set('page-number', '0');
    updatePaginationNumber(1);

    return query;
  }

  function getFilterStringFromObj(filterObj) {
    const checkedEntries = filterObj.filter(([, checked]) => checked);
    const checkedKeys = checkedEntries.map(([key]) => key);
    return checkedKeys.join(delineator);
  }

  function setFilterCountFromUrl() {
    const filterLists = {
      bboxList: getList(bboxKey, false),
      categoryList: getList(categoriesKey, false),
      dateRangeList: getList('begin', false),
      foundationalList: getList(foundationalKey, false),
      orgList: getList(orgKey, true),
      typeFilterList: getList(typeKey, true),
      themeList: getList(themeKey, true),
    };

    numFilters = countFilters(filterLists);
  }

  function getList(key, split) {
    const searchParams = $page.url.searchParams;
    const value = searchParams.getAll(key)[0];
    return split && value ? value.split(delineator) : value;
  }

  function closeModal() {
    active = false;
    toggleScroll(active);
  }

  onMount(() => {
    setFilterCountFromUrl();
  });
</script>

<div
  class="fixed flex justify-center z-40 inset-0 bg-custom-7/75 overflow-y-scroll hide-scroll pb-4"
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
        <CategoryOfInterest bind:this={categoriesComponent} />
        <SpatioTemporal
          bind:temporalActive={temporalActive}
          bind:spatialActive={spatialActive}
          bind:this={spatioTemporalComponent}
        />
        <Organizations bind:this={orgCompontent} />
        <Types bind:this={typeCompontent} />
        <Themes bind:this={themeCompontent} />
        <OtherFilters bind:this={othersCompontent} />
      </div>
    </div>
    <div class="col-span-1 px-5 pt-8 justify-self-end">
      <button
        type="button"
        class="flex justify-center items-center border border-custom-16 rounded-[50%]
          h-[49px] w-[49px] hover:bg-custom-16 text-custom-16 hover:text-custom-1"
        on:click={handleCloseButtonClick}
      >
        <Close classes="h-[21px]"/>
      </button>
    </div>
    <div class="grid grid-cols-2 col-span-6 bg-custom-5 border-t border-custom-21 px-5 py-[18px]">
      <button
        type="button" class="justify-self-start button-3"
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

<script lang="ts">
  import { page } from '$app/stores';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
	import Checkmark from '$lib/components/icons/checkmark.svelte';
	import Close from '$lib/components/icons/close.svelte';
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';
	import Search from '../icons/search.svelte';

  // TODO: Fix tab sequence for keyboard navigation i.e. disable content below mask

  export let active = false;
  export let numFilters = 0;
  
  /************* Translations ***************/
  const translations = $page.data.t;

  const filterByText = translations?.filterBy ? translations["filterBy"] : "Filter By";
  // TODO: update description text
  const filterDescriptionText = translations?.filterDescription ?
    translations["filterDescription"] : "";
  const categoryOfInterestText = translations?.categoryOfInterest ?
    translations["categoryOfInterest"] : "Select Category of Interest";
  const clearAllText = translations?.clearAll ? translations["clearAll"] : "Clear All";
  const searchText = translations?.search ? translations["search"] : "Search";
  const categorySelectDefautText = translations?.categorySelectDefaut ?
    translations["categorySelectDefaut"] : "--Select a Category--";

  /************* Filter Data ***************/
  const filters = $page.data.filters.filters;
  const categories = $page.data.categories;

  // TODO: Get full list of categories
  const categoriesOfInterest = categories;

  $: selected = null;
  $: tempNumFilters = numFilters;

  /************* Handlers ***************/
  function handleCloseButtonClick(event: Event) {
    active = false;
    toggleScroll(active);
  }

  function handleCategoryOfInterestChange(event: CustomEvent) {
    if (!selected && event.detail) {
      tempNumFilters = tempNumFilters + 1;
    } else if (selected && !event.detail) {
      tempNumFilters = tempNumFilters - 1;
    }
    selected = event.detail;
  }

  function handleCheckboxClick(event: Event) {
    let checkbox = event.target as HTMLInputElement;
    if (checkbox.checked == true) {
      tempNumFilters = tempNumFilters + 1;
    } else {
      tempNumFilters = tempNumFilters - 1;
    }
  }

  function handleSubmit(event: Event) {
    numFilters = tempNumFilters;
    console.log(event);
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
        <h1 class="font-custom-style-h1-2">
          {filterByText}
        </h1>
        <p>{filterDescriptionText}</p>
      </div>
      <div class="w-full">
        <h3 class="font-custom-style-h3 mb-5">
          {categoryOfInterestText}
        </h3>
        <div class="w-full lg:w-[60%]">
          <SelectCustomized
            optionsData={categoriesOfInterest}
            selectId={"categories-of-interest"}
            buttonClasses={"button-4"}
            dropDownColor={"#002E62"}
            removableSelection={true}
            defaultLabel={categorySelectDefautText}
            selected={selected}
            on:selectedChange={handleCategoryOfInterestChange}
          />
        </div>
      </div>
      <div class="flex flex-col gap-y-5">
        {#each filters as filter}
          <h3 class="font-custom-style-h3">
            {filter?.label}
          </h3>
          <div
            class:organizations={filter.section == "organisations"}
            class:sections={filter.section != "organisations"}
          >
            {#each filter.filterList as filterListItem}
              <div class="flex gap-[13px] flex-[1_1_160px]">
                <!-- Note: checkboxes with the same name attribute are grouped together -->
                <input 
                  type="checkbox" 
                  id={filter.section + "-" + filterListItem.value} 
                  class="peer appearance-none min-w-[27px] h-[27px] border-2 
                    border-custom-16 rounded-sm bg-custom-1 checked:bg-custom-16"
                  name={filter.section}
                  on:click={handleCheckboxClick}
                />
                <label for={filter.section + "-" + filterListItem.value}>
                  {filterListItem.label}
                </label>
                <Checkmark
                  classes="absolute h-4 mt-1.5 ml-1.5 hidden peer-checked:block
                    pointer-events-none text-custom-1"
                />
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
    <div class="col-span-1 px-5 pt-8 justify-self-end">
      <button 
        class="flex justify-center items-center border border-custom-16 rounded-[50%] h-[49px] w-[49px]"
        type="button"
        on:click={handleCloseButtonClick}
      >
        <Close classes="text-custom-16 h-[21px]"/>
      </button>
    </div>
    <div class="grid grid-cols-2 col-span-6 bg-custom-5 border-t border-custom-21 px-5 py-[18px]">
      <button type="button" class="justify-self-start button-3">
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

  .organizations {
    @apply space-y-[18px];
  }

  .sections {
    @apply grid;
    @apply gap-x-4;
    @apply gap-y-[18px];
    grid-template-columns: repeat(1, 1fr);
  }

  @media (min-width: 1024px) {
    .organizations {
      columns: 2;
    }

    .sections {
      grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), max-content));
    }
  }
</style>

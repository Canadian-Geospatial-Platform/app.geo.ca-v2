<script lang="ts">
  import { page } from "$app/stores";
  import type { ComponentType } from "svelte";
  import Card from "$lib/components/card/card.svelte";
  import SelectCustomized from '$lib/components/select-customized/select-customized.svelte';

  type Tab = {
    label: string;
    // Id used to determine which tab is active
    value: number;
    component: ComponentType;
  };

  type Tabs = Array<Tab>;

  export let tabContentArray: Tabs;

  /******************* Translations *******************/
  const translations = $page.data.t;
  const selectCategory = translations?.selectCategory ? translations["selectCategory"] : "Select Category";
  const resources = translations?.resources ? translations["resources"] : "Resources";

  // Set the first tab to active by default
  let activeTabId = tabContentArray[0].value;
  let activeTab = tabContentArray.find((x: Tab) => x.value == activeTabId);
  $: title = activeTab ? activeTab.label : "";

  function handleTabClick(tab: Tab) {
    activeTab = tab;
    activeTabId = tab.value;
  };

  function handleDropdownClick(event: CustomEvent) {
    handleTabClick(event.detail);
  }

</script>

<div class="font-custom-style-body-1">
  <div class="flex flex-wrap justify-between">
    <!-- Using a max width here ensures the title wraps instead of the menu tab for small screens -->
    <!-- Usig a min width for large screens ensures the flex wrap doesn't toggle when the tabs are clicked -->
    <h2 class="hidden lg:flex font-custom-style-h2 mx-5 md:mx-0 max-w-tabbed-title lg:max-w-none lg:min-w-80 mb-1">
      {title}
    </h2>
    <h2 class="lg:hidden font-custom-style-h2 mx-5 md:mx-0 mb-1">
      {resources}
    </h2>
    <div class="flex mr-6 space-x-3 self-end">
      <!-------------- Tabs for large screens -------------->
      {#each tabContentArray as tab}
        <button 
          class="hidden lg:flex items-center h-9 px-5 font-custom-style-body-3 bg-custom-5 border-b-[0.1875rem] border-custom-16"
          class:active={tab.value == activeTabId}
          on:click={() => handleTabClick(tab)}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  </div>
  <!-------------- Select for small screens -------------->
  <div class="bg-custom-5 lg:hidden">
    <h2 class="mx-5 font-custom-style-header-1 pt-5">
      {selectCategory}
    </h2>
    <div class="mx-5 mt-2.5 sm:w-fit">
      <SelectCustomized
        optionsData={tabContentArray}
        selectType={"tabCard"}
        bind:selected={activeTab}
        on:selectedChange={handleDropdownClick}
      />
    </div>
  </div>
  {#each tabContentArray as tabContent}
    {#if activeTabId == tabContent.value}
      <Card spaceBetween='space-y-3'>
        <div class="lg:hidden">
          <h2 class="font-open-sans font-bold text-xl">
            {tabContent.label}
          </h2>
        </div>
        <svelte:component this={tabContent.component}/>
      </Card>
    {/if}
  {/each}
</div>

<style>
  .active {
    @apply border-b-0;
    @apply text-custom-7;
  }
</style>
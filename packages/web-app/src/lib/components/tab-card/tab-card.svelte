<script lang="ts">
  import type { ComponentType } from "svelte";
  import Card from "$lib/components/card/card.svelte";

  type Tab = {
    label: string;
    // Id used to determine which tab is active
    tabId: number;
    component: ComponentType;
  };

  type Tabs = Array<Tab>;

  export let tabContentArray: Tabs;

  // Set the first tab to active by default
  $: activeTabId = tabContentArray[0].tabId;
  $: activeTab = tabContentArray.find((x: Tab) => x.tabId == activeTabId);
  $: title = activeTab ? activeTab.label : "";
  $: open = false;

  function handleTabClick(tabId: number) {
    activeTabId = tabId;
  };

  function handleDropdownClick() {
    open = !open;
  }
</script>

<div class="font-custom-style-body-1">
  <div class="flex flex-wrap justify-between">
    <!-- Using a max width here ensures the title wraps instead of the menu tab for small screens -->
    <!-- Usig a min width for large screens ensures the flex wrap doesn't toggle when the tabs are clicked -->
    <h2 class="font-custom-style-h2 max-w-tabbed-title lg:max-w-none lg:min-w-80 mb-1">
      {title}
    </h2>
    <div class="flex mr-6 space-x-3 self-end">
      <!-------------- Tabs for large screens -------------->
      {#each tabContentArray as tab}
        <button 
          class="hidden lg:flex items-center h-9 px-5 font-custom-style-body-3 bg-custom-5 border-b-[0.1875rem] border-custom-16"
          class:active={tab.tabId == activeTabId}
          on:click={() => handleTabClick(tab.tabId)}
        >
          {tab.label}
        </button>
      {/each}
      <!-------------- Dropdown for smaller screens -------------->
      <button
        class="flex flex-col lg:hidden justify-center items-center py-3 px-5 space-y-[0.3125rem] bg-custom-5"
        class:open={open}
        on:click={handleDropdownClick}
      >
        <div class="bar bar1"></div>
        <div class="bar bar2"></div>
        <div class="bar bar3"></div>
      </button>
    </div>
    <div
      class="flex flex-col lg:hidden w-full bg-custom-5 py-6 space-y-3 border-b-[0.1875rem] border-custom-16"
      class:hidden={!open}
    >
      {#each tabContentArray as tab}
        <button 
          class="flex lg:hidden justify-start mx-6 font-custom-style-body-3 bg-custom-1 p-3"
          class:active={tab.tabId == activeTabId}
          on:click={() => handleTabClick(tab.tabId)}
        >
          {tab.label}
        </button>
      {/each}
    </div>
    <!-------------- ^^ End of dropdown ^^ -------------->
  </div>
  {#each tabContentArray as tabContent}
    {#if activeTabId == tabContent.tabId}
      <Card>
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

  .bar {
    @apply w-7;
    @apply h-1;
    @apply bg-custom-16;
    @apply rounded;
  }

  .open .bar1 {
    @apply origin-top-left;
    @apply rotate-45;
    @apply translate-x-1.5;
  }

  .open .bar2 {
    @apply opacity-0;
  }

  .open .bar3 {
    @apply origin-bottom-left;
    @apply -rotate-45;
    @apply translate-x-1.5;
  }
</style>
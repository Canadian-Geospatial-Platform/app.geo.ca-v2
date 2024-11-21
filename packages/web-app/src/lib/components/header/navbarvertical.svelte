<script lang="ts">
  import { page } from '$app/stores';
  import Menubutton from './menubutton.svelte';
  import Navitem from './navitem.svelte';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
  import Chevronleft from '../icons/chevronleft.svelte';

  const userId = $page.data.userData?.uuid;
  const navItems = $page.data.navitems;
  const orientation = 'vertical';

  let active = false;
  let mainMenuVisible = false;
  let activeMenuContent = null;

  function resetNav() {
    if (active === true) {
      active = false;
      mainMenuVisible = false;
      activeMenuContent = null;
      toggleScroll(active);
    }
  };

  function toggleMenuView(event: CustomEvent) {
    mainMenuVisible = !mainMenuVisible;
    activeMenuContent = event?.detail?.menu;

    if (activeMenuContent?.href) {
      resetNav();
    }
  }
</script>

<svelte:window on:resize={resetNav} />

<div class="grid">
  <Menubutton bind:active={active} bind:mainMenuVisible={mainMenuVisible} />
</div>
<div
  class="nav-items-container bg-custom-23"
  class:hidden={!active || !mainMenuVisible}
>
  <div class="rounded-[5px] bg-custom-1 divide-y divide-custom-16">
    {#each Object.entries(navItems) as [key, data]}
      {#if key != 'lang' && ((key != 'collections') || userId)}
        <div class="nav-item">
          <Navitem linkData={data} {orientation} on:dropDownClick={toggleMenuView} />
        </div>
      {/if}
    {/each}
  </div>
  <div class="text-custom-1 nav-item">
    <Navitem linkData={navItems.lang} {orientation} on:dropDownClick={toggleMenuView} />
  </div>
</div>

<!--
  This section replaces the main menu with a seconday menu when a menu option is
  selected e.g. the Discover, Collaborate, or Learn menus
-->
{#if activeMenuContent}
  <div
    class="nav-items-container bg-custom-23 pb-[40px]"
    class:hidden={!active || mainMenuVisible}
  >
    <button
      class="w-full h-[81px] pl-[20px] text-left bg-custom-16 text-custom-1 rounded-t-[5px]"
      class:rounded-section-title={activeMenuContent?.options && activeMenuContent?.options[0]?.colTitle}
      on:click={toggleMenuView}
    >
      <Chevronleft classes="h-[35px] w-[35px] inline-block"/>
      {activeMenuContent.title}
    </button>
    {#if activeMenuContent.options}
      {#each activeMenuContent.options as option}
        {#if option?.colTitle}
          <div class="font-open-sans text-custom-1 text-base font-semibold mt-[17px] mb-[13px]">
            {option.colTitle}
          </div>
        {/if}
        <div
          class="rounded-b-[5px] bg-custom-1 divide-y divide-custom-16"
          class:rounded-section-link-list={option?.colTitle}
        >
          {#each option["links"] as link}
            <div class="nav-item">
              <Navitem linkData={link} {orientation} on:dropDownClick={toggleMenuView} />
            </div>
          {/each}
        </div>
      {/each}
    {/if}
  </div>
{/if}

<div class:mask={active}></div>

<style>
  /* Hide scroll bar for navbar options*/
  .nav-items-container {
    @apply absolute;
    @apply top-20;
    @apply z-20;
    width: calc(100% - 40px);
    @apply m-[20px];
    @apply left-0;
    @apply max-h-vertical-nav;
    @apply overflow-y-scroll;
    -ms-overflow-style: none;  /* Edge */
    scrollbar-width: none;  /* Firefox */
  }

  .nav-items-container::-webkit-scrollbar {
    @apply hidden;
  }

  .nav-item {
    @apply pl-[28px];
    @apply pr-[15px];
    @apply h-[58px];
  }

  .rounded-section-title {
    @apply rounded-b-[5px];
  }

  .rounded-section-link-list {
    @apply rounded-t-[5px];
  }

  .mask {
    @apply absolute;
    @apply top-20;
    @apply right-0;
    @apply w-full;
    @apply bg-custom-23;
    @apply z-10;
    height: calc(100vh + 40px);
  }
</style>
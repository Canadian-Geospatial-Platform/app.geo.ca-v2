<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { clickOutside } from '$lib/components/component-utils/clickOutside';
  import { toggleScroll } from '$lib/components/component-utils/toggleScroll';
  import { LOCALSTORAGE_UPDATED } from '$lib/utils/event-dispatchers/local-storage-changed.js';
  import Navdropdown from '$lib/components/header/navdropdown.svelte';
  import Chevronup from '$lib/components/icons/chevronup.svelte';
  import Chevrondown from '$lib/components/icons/chevrondown.svelte';
  import Chevronright from '$lib/components/icons/chevronright.svelte';
  import Globe from '$lib/components/icons/globe.svelte';

  let { linkData, orientation, dropDownClick } = $props();

  const lang = $page.data.lang;
  const homeText = lang == 'fr-ca' ? 'Accueil' : 'Home';

  let localStorageKey = linkData?.localStorageKey;
  let localStorageValue = $state('');
  let localStorageList = $derived(
    localStorageValue ?
    typeof localStorageValue == "string" ?
    [...localStorageValue.split(",")] :
    [...localStorageValue] :
    []
  );
  let localStorageListLength = $derived(localStorageList.length);

  let chevronDown = $state(true);
  let active = $state(false);

  function setActive(isActive: boolean, down: boolean, activateScroll: boolean) {
    active = isActive;
    chevronDown = down;
    if (activateScroll) {
      toggleScroll(active);
    }
  };

  function handleClickOutside(menuOrientation: string) {
    if (active) {
      let isHorizontal = menuOrientation === "horizontal";
      setActive(false, true, isHorizontal);
    }
	};

  function handleDropdownClick(menuOrientation: string) {
    let isHorizontal = menuOrientation === "horizontal";
    if (active) {
      setActive(false, true, isHorizontal);
    } else {
      setActive(true, false, isHorizontal);
    }

    if (!isHorizontal) {
      dispatchDropDownClick();
    }
	};

  function handleLocalStorageUpdated(event) {
    const { key, value } = event.detail;
    if (key === localStorageKey) {
      localStorageValue = value;
    }
  }

	function dispatchDropDownClick() {
	  dropDownClick({'menu': linkData});
	}

  function resetNav() {
    if (active) {
      setActive(false, true, true);
    }
  };

  function toggleLanguage(lang) {
    let currentUrl = $page.url.origin + $page.url.pathname;
    let url = lang == "fr-ca" ? currentUrl.replace("en-ca", "fr-ca") :
      currentUrl.replace("fr-ca", "en-ca");
    return url;
  }

  // Local storage is only accessible from the client side, so we need to get
  // the MapCartResources array inside onMount
  onMount(async () => {
    localStorageValue = localStorage.getItem("MapCartResources");

    window.addEventListener(LOCALSTORAGE_UPDATED, handleLocalStorageUpdated);

    // Remove listener when the component is destroyed
    return () => window.removeEventListener(LOCALSTORAGE_UPDATED, handleLocalStorageUpdated);
  });
</script>

<svelte:window onresize={resetNav} />

<div
  class={[
    "h-full",
    (active && orientation === 'horizontal') && "active"
  ]}
>
  {#if linkData?.options && orientation == 'horizontal'}
    <!-- TODO: fix typescript error for click_outside event-->
    <button
      class="nav-link"
      use:clickOutside
      onclick_outside={() => handleClickOutside(orientation)}
      onclick={() => handleDropdownClick(orientation)}
    >
      {linkData.title}
      {#if chevronDown}
        <Chevrondown classes="mt-1 ml-1 h-4 w-4 text-custom-16"/>
      {:else}
        <Chevronup classes="mt-1 ml-1 h-4 w-4 text-custom-16"/>
      {/if}
    </button>

    <div class="relative">
      <Navdropdown options={linkData['options']} bind:active={active} orientation={orientation}/>
    </div>
    <div class={[active && "mask"]}></div>
  {:else if linkData?.options}
    <button
      class="nav-link w-full justify-between"
      use:clickOutside
      onclick_outside={() => handleClickOutside(orientation)}
      onclick={() => handleDropdownClick(orientation)}
    >
      <div>
        {linkData.title}
      </div>
      <div>
        <Chevronright classes="h-[2.1875rem] w-[2.1875rem] text-custom-16"/>
      </div>
    </button>
  {:else if linkData?.title && linkData?.title == "English"}
    <a class="nav-link" href={toggleLanguage("en-ca")} data-sveltekit-reload>
      <Globe classes="h-[1.25rem] w-[1.25rem] mr-1"/>
      {linkData.title}
    </a>
  {:else if linkData?.title && linkData?.title == "Français"}
    <a class="nav-link" href={toggleLanguage("fr-ca")} data-sveltekit-reload>
      <Globe classes="h-[1.25rem] w-[1.25rem] mr-1"/>
      {linkData.title}
    </a>
  {:else if linkData?.title && linkData?.title == homeText}
    {#if orientation == 'vertical'}
      <a class="nav-link" href={linkData["href"]}>
        {linkData.title}
      </a>
    {/if}
  {:else if linkData?.href}
    <div class="flex relative h-full">
    <a
      class="nav-link"
      href={linkData["href"]}
      onclick={() => {
        if (orientation === "vertical") {
          dispatchDropDownClick();
        }
      }
    }>
      {linkData.title}
    </a>
    {#if linkData?.counter && localStorageKey}
      <div
        class:hidden={!localStorageListLength || localStorageListLength == 0}
        class="align-middle absolute top-3.5 right-0 lg:-right-5 bg-red-700 rounded-full min-w-[1.625rem] h-[1.625rem]
          p-1 text-center text-custom-1 font-open-sans text-xs font-normal border-2 border-custom-1"
      >
        {localStorageListLength}
      </div>
    {/if}
    </div>
  {/if}
</div>

<style>
  .nav-link {
    @apply flex;
    @apply h-full;
    @apply items-center;
  }
  .active {
    @apply shadow-[0_0.125rem_0.188rem_white,_0_0.188rem_white];
    @apply border-b;
  }

  .mask {
    @apply absolute;
    @apply top-20;
    @apply right-0;
    @apply w-full;
    @apply h-screen;
    @apply bg-custom-12;
  }
</style>

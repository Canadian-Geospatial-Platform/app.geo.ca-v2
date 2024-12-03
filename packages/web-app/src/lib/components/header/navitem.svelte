<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, createEventDispatcher } from 'svelte';
  import {clickOutside} from './clickOutside';
  import { toggleScroll } from "$lib/components/component-utils/toggleScroll";
  import Navdropdown from './navdropdown.svelte';
  import Chevronup from '../icons/chevronup.svelte';
  import Chevrondown from '../icons/chevrondown.svelte';
  import Chevronright from '../icons/chevronright.svelte';

  export let linkData;
  export let orientation;

  const dispatch = createEventDispatcher();

  const lang = $page.data.lang;
  const homeText = lang == 'fr-ca' ? 'Accueil' : 'Home';

  let chevronDown = true;
  let active = false;
  let currentUrl: string;
  let frenchUrl: string;
  let englishUrl: string;

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
	
	function dispatchDropDownClick() {
	  dispatch('dropDownClick', {'menu': linkData});
	}

  function resetNav() {
    if (active) {
      setActive(false, true, true);
    }
  };

  onMount(() => {
    currentUrl = $page.url.origin + $page.url.pathname;
    frenchUrl = currentUrl.replace("en-ca", "fr-ca");
    englishUrl = currentUrl.replace("fr-ca", "en-ca");
  });
</script>

<svelte:window on:resize={resetNav} />

<div
  class="h-full"
  class:active={active && orientation === 'horizontal'}
>
  {#if linkData?.options && orientation == 'horizontal'}
    <!-- TODO: fix typescript error for click_outside event-->
    <button
      class="nav-link"
      use:clickOutside
      on:click_outside={handleClickOutside(orientation)}
      on:click={() => handleDropdownClick(orientation)}
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
    <div class:mask={active} />
  {:else if linkData?.options}
    <button
      class="nav-link w-full justify-between"
      use:clickOutside
      on:click_outside={handleClickOutside(orientation)}
      on:click={() => handleDropdownClick(orientation)}
    >
      <div>
        {linkData.title}
      </div>
      <div>
        <Chevronright classes="h-[2.1875rem] w-[2.1875rem] text-custom-16"/>
      </div>
    </button>
  {:else if linkData?.title && linkData?.title == "English"}
    <a class="nav-link" href={englishUrl} data-sveltekit-reload>
      {linkData.title}
    </a>
  {:else if linkData?.title && linkData?.title == "Français"}
    <a class="nav-link" href={frenchUrl} data-sveltekit-reload>
      {linkData.title}
    </a>
  {:else if linkData?.title && linkData?.title == homeText}
    {#if orientation == 'vertical'}
      <a class="nav-link" href={linkData["href"]}>
        {linkData.title}
      </a>
    {/if}
  {:else if linkData?.href}
    <a class="nav-link" href={linkData["href"]} on:click={dispatchDropDownClick}>
      {linkData.title}
    </a>
  {/if}
</div>

<style>
  .nav-link {
    @apply flex;
    @apply h-full;
    @apply items-center;
  }
  .active {
    @apply shadow-nav;
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
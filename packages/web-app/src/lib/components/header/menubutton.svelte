<script lang="ts">
  import { page } from '$app/stores';
  import { toggleScroll } from "$lib/components/component-utils/toggleScroll";

  export let active: Boolean;
  export let mainMenuVisible: Boolean;

  const translations = $page.data.headerTranslations;
  const menuButton = translations?.menuButton ? translations["menuButton"] : "";

  function handleMenuButtonClick() {
    active = !active;
    mainMenuVisible = active;
    toggleScroll(active);
  }
</script>

<button class="grid grid-cols-4 cursor-pointer pl-[13px] pr-[9px]
    py-[7px] self-center bg-custom-16 text-custom-1 rounded-[5px]
    font-bold text-[20px]"
  on:click={handleMenuButtonClick}
  class:active={active} 
  title={menuButton}
>
  {#if !active}
    <div class="col-span-1 mt-[3px] mr-[5px]">
      <div class="bar bar1"></div>
      <div class="bar bar2"></div>
      <div class="bar bar3"></div>
    </div>
    <p class="col-span-3">MENU</p>
  {:else}
    <div class="col-span-4 mt-[4px] mb-[2px] mx-[1px] self-center translate-x-0.5">
      <div class="bar bar1"></div>
      <div class="bar bar2"></div>
      <div class="bar bar3"></div>
    </div>
  {/if}
</button>

<style>
  .bar {
    @apply w-[18px];
    @apply h-[2px];
    @apply bg-custom-1;
    @apply my-[4px];
    @apply rounded;
  }

  .active .bar1 {
    @apply w-[20px];
    @apply h-[3px];
    @apply origin-top-left;
    @apply rotate-45;
  }

  .active .bar2 {
    @apply opacity-0;
  }

  .active .bar3 {
    @apply w-[20px];
    @apply h-[3px];
    @apply origin-bottom-left;
    @apply -rotate-45;
  }
</style>
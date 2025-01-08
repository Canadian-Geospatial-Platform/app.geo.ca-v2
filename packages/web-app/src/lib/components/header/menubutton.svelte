<script lang="ts">
  import { page } from '$app/stores';
  import { toggleScroll } from "$lib/components/component-utils/toggleScroll";

  interface Props {
    active: Boolean;
    mainMenuVisible: Boolean;
  }

  let { active = $bindable(), mainMenuVisible = $bindable() }: Props = $props();

  const translations = $page.data.headerTranslations;
  const menuButton = translations?.menuButton ? translations["menuButton"] : "";

  function handleMenuButtonClick() {
    active = !active;
    mainMenuVisible = active;
    toggleScroll(active);
  }
</script>

<button class={[
    "grid grid-cols-4 cursor-pointer pl-[0.8125rem] pr-[0.5625rem] py-[0.4375rem]",
    "self-center bg-custom-16 text-custom-1 rounded-[0.3125rem] font-bold text-xl",
    active && "menu-active"
  ]}
  onclick={handleMenuButtonClick}
  title={menuButton}
>
  {#if !active}
    <div class="col-span-1 mt-[0.1875rem] mr-[0.3125rem]">
      <div class="bar bar1"></div>
      <div class="bar bar2"></div>
      <div class="bar bar3"></div>
    </div>
    <p class="col-span-3">MENU</p>
  {:else}
    <div class="col-span-4 mt-1 mb-0.5 mx-px self-center translate-x-0.5">
      <div class="bar bar1"></div>
      <div class="bar bar2"></div>
      <div class="bar bar3"></div>
    </div>
  {/if}
</button>

<style>
  .bar {
    @apply w-[1.125rem];
    @apply h-0.5;
    @apply bg-custom-1;
    @apply my-1;
    @apply rounded;
  }

  .menu-active .bar1 {
    @apply w-5;
    @apply h-[0.1875rem];
    @apply origin-top-left;
    @apply rotate-45;
  }

  .menu-active .bar2 {
    @apply opacity-0;
  }

  .menu-active .bar3 {
    @apply w-5;
    @apply h-[0.1875rem];
    @apply origin-bottom-left;
    @apply -rotate-45;
  }
</style>

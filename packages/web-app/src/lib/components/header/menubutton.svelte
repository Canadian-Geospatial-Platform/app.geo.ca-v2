<script lang="ts">
  import { page } from '$app/stores';
  import { toggleScroll } from "./toggleScroll";

  export let active: Boolean;

  const translations = $page.data.headerTranslations;
  const menuButton = translations?.menuButton ? translations["menuButton"] : "";

  function handleMenuButtonClick() {
    active = !active;
    toggleScroll(active);
  }
</script>

<button class="inline-block cursor-pointer p-1 self-center"
  on:click={handleMenuButtonClick}
  class:active={active} 
  title={menuButton}
>
  <div class="bar bar1"></div>
  <div class="bar bar2"></div>
  <div class="bar bar3"></div>
</button>

<style>
  .bar {
    @apply w-7;
    @apply h-1;
    @apply bg-custom-16;
    @apply my-[5px];
    @apply rounded;
  }

  .active .bar1 {
    @apply origin-top-left;
    @apply rotate-45;
  }

  .active .bar2 {
    @apply opacity-0;
  }

  .active .bar3 {
    @apply origin-bottom-left;
    @apply -rotate-45;
  }
</style>
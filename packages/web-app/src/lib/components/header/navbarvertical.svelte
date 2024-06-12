<script>
	import { page } from '$app/stores';
  import Menubutton from './menubutton.svelte';
  import Navitem from './navitem.svelte';
  import { toggleScroll } from './toggleScroll';

  const navItems = $page.data.navitems;
  const orientation = 'vertical';
  let active = false;

  function resetNav() {
    if (active === true) {
      active = false;
      toggleScroll(active);
    }
  };
</script>

<svelte:window on:resize={resetNav} />

<div class="grid pr-4">
  <Menubutton bind:active={active}/>
</div>
<div
  class="nav-items-container"
  class:hidden={!active}
>
  {#each Object.entries(navItems) as [colIndex, data]}
    <div class="bg-custom-1 p-2 m-3">
      <Navitem linkData={data} orientation={orientation} />
    </div>
  {/each}
</div>
<div class:mask={active}></div>

<style>
  /* Hide scroll bar for navbar options*/
  .nav-items-container {
    @apply absolute;
    @apply w-full;
    @apply top-20;
    @apply left-0;
    @apply bg-custom-5;
    @apply border-b-4;
    @apply border-custom-16;
    @apply max-h-vertical-nav;
    @apply overflow-y-scroll;
    -ms-overflow-style: none;  /* Edge */
    scrollbar-width: none; /* Firefox */
  }

  .nav-items-container::-webkit-scrollbar {
    @apply hidden;
  }

  .mask {
    @apply absolute;
    @apply top-20;
    @apply right-0;
    @apply w-full;
    @apply h-screen;
    @apply bg-custom-12;
    @apply z-10;
  }
</style>
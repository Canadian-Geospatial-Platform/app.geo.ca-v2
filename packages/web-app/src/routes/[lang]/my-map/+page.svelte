<script lang="ts">
  import { navigating, page } from '$app/stores';
  import { onMount, tick } from 'svelte';
  import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
  import MyMap from '$lib/components/mymap/mymap.svelte';

  onMount(async () => {
    try {
      await tick();
      cgpv.init();
    } catch (e) {
      console.warn('Error initialising cgpv.', e);
    }
  });
</script>

<svelte:head>
  <script src="https://canadian-geospatial-platform.github.io/geoview/public/cgpv-main.js"></script>
</svelte:head>

{#if $navigating}
  <LoadingMask classes="fixed left-0 top-0 items-center" />
{/if}

<MyMap />

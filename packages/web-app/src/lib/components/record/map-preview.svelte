<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Map from '$lib/components/map/map.svelte';
  import NotVisible from "$lib/components/icons/not-visible.svelte";

  const translations = $page.data.t;
  const mapPreviewtext = translations?.mapPreview ? translations["mapPreview"] : "Map Preview";
  const mapNotAvailableText = translations?.mapNotAvailable ? translations["mapNotAvailable"] : "";
  const windowTooSmall = translations?.windowTooSmall ? translations["windowTooSmall"] : "";

  const data = $page.data;
  const uuid = data.uuid;
  const items = data.item_v2;
  const geometry = items?.geometry ? items.geometry : null;
  const coordinates = geometry && geometry?.coordinates ? geometry.coordinates : null;

  /***************** Time Slider *************************/
  // Note: Geoview checks for a valid time dimension for each map layer before adding the
  // time slider, so even if there is a valid time range here, the tool might not be added.
  // Since Geoview does most of the error handling, we'll only check if a date range exists
  // and not worry about the format of the dates.
  // const temporalExtentStart = items?.properties?.extent?.temporalExtent?.start;
  // const temporalExtentEnd = items?.properties?.extent?.temporalExtent?.end;
  // let useTimeSlider = !!(temporalExtentStart && temporalExtentEnd);

  // For small screens, don't include the map preview
  let showMap = $state(true);

  const checkScreenSize = () => {
    // Tailwind's 'sm' breakpoint starts at 640px
    showMap = window.matchMedia('(min-width: 640px)').matches;
  };

  // This is wrapped in onMount to account for the use of window and
  // avoid errors while rendering on the server
  onMount(() => {
    checkScreenSize();

    // Update map visibility on window resize
    const resizeListener = () => checkScreenSize();
    window.addEventListener('resize', resizeListener);

    // Remove the event listener when the component is destroyed
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  });
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-1 mx-5 md:mx-0">
    {mapPreviewtext}
  </h2>
  {#if coordinates && showMap}
    <!--<Map {coordinates} id={uuid} dynamic=true mapType="record" footer=true timeSlider={useTimeSlider} />-->
    <Map {coordinates} id={uuid} dynamic=true mapType="record" footer=true timeSlider={useTimeSlider} />
  {:else if coordinates}
    <p class="mx-5 md:mx-0">
      {windowTooSmall}
    </p>
    <div class="mx-5 mt-5 bg-[url('/map-not-available.png')] bg-cover max-w-full h-60">
      <div class="bg-black/35 w-full h-full flex items-center justify-center">
        <NotVisible classes="text-custom-1 h-32"/>
      </div>
    </div>
  {:else}
    <p class="mx-5 md:mx-0">
      {mapNotAvailableText}
    </p>
  {/if}
</div>

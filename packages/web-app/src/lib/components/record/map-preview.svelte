<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/card/card.svelte';
  import Map from '$lib/components/map/map.svelte';

  const translations = $page.data.t;
  const mapPreviewtext = translations?.mapPreview ? translations["mapPreview"] : "Map Preview";
  const mapNotAvailableText = translations?.mapNotAvailable ? translations["mapNotAvailable"] : "";

  const data = $page.data;
  const uuid = data.uuid;
  const items = data.item_v2;
  const geometry = items?.geometry ? items.geometry : null;
  const coordinates = geometry && geometry?.coordinates ? geometry.coordinates : null;
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-1 mx-5 md:mx-0">
    {mapPreviewtext}
  </h2>
  {#if coordinates}
    <Card>
      <Map {coordinates} id={uuid} />
    </Card>
  {:else}
    <p>{mapNotAvailableText}</p>
  {/if}
</div>
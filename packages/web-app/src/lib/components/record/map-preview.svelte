<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/card/card.svelte';
  import Map from '$lib/components/map/map.svelte';

  const translations = $page.data.t;
  const mapPreviewtext = Object.hasOwn(translations,"mapPreview") ?
    translations["mapPreview"] : "Map Preview";
  const mapNotAvailableText = Object.hasOwn(translations,"mapNotAvailable") ?
    translations["mapNotAvailable"] : "";

  const data = $page.data;
  const uuid = data.uuid;
  const items = data.item_v2;
  const geometry = Object.hasOwn(items,"geometry") ? items.geometry : null;
  const coordinates = geometry && Object.hasOwn(geometry,"coordinates") ? geometry.coordinates : null;
</script>

<div class="font-custom-style-body-1">
  <h2 class="font-custom-style-h2 mb-1">
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
<script lang="ts">
  import { navigating, page } from '$app/stores';
  import MicroData from '$lib/components/microdata/microdata.svelte';
  import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
	import Description from './description.svelte';
	import Metadata from './metadata.svelte';
  import MapContainer from './map-container.svelte';
  import Keywords from './keywords.svelte';
  import SimilarProducts from './similar-products.svelte';
  import Tabbed from './tabbed/tabbed.svelte';

  const similarProducts = $page.data.similar;
</script>

<MicroData item={$page.data.item_v2} />

{#if $navigating}
  <LoadingMask classes="fixed left-0 top-0 items-center" />
{/if}
<div class="flex flex-col space-y-8">
  <Description />
  <Metadata />
  <MapContainer />
  <Tabbed />
  <Keywords />
  <!-- Only add Similar products if they exist -->
  {#if similarProducts.length > 0}
    <SimilarProducts />
  {/if}
</div>

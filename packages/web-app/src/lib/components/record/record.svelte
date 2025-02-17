<script lang="ts">
  import { navigating, page } from '$app/stores';
  import MicroData from '$lib/components/microdata/microdata.svelte';
  import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
	import Description from './description.svelte';
	import Metadata from './metadata.svelte';
  import MapPreview from './map-preview.svelte';
  import Keywords from './keywords.svelte';
  import SimilarProducts from './similar-products.svelte';
  import Tabbed from './tabbed/tabbed.svelte';
</script>

<MicroData item={$page.data.item_v2} />

{#if $navigating}
  <LoadingMask classes="fixed left-0 top-0" />
{/if}
<div class="flex flex-col space-y-8">
  <Description />
  <Metadata />
  <MapPreview />
  <Tabbed />
  <Keywords />
  <!-- TODO: Uncomment SimilarProducts when the component no longer uses placeholder data -->
  <!-- <SimilarProducts /> -->
</div>

<script lang="ts">
  import { navigating } from '$app/stores';
  import LoadingMask from '$lib/components/loading-mask/loading-mask.svelte';
	import Description from './description.svelte';
	import Metadata from './metadata.svelte';
  import MapPreview from './map-preview.svelte';
  import Keywords from './keywords.svelte';
  import SimilarProducts from './similar-products.svelte';
  import Tabbed from './tabbed/tabbed.svelte';
</script>

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

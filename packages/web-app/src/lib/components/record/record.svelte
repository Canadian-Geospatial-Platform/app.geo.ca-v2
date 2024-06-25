<script lang="ts">
	import Description from './description.svelte';
	import Metadata from './metadata.svelte';
  import MapPreview from './map-preview.svelte';
  import Keywords from './keywords.svelte';
  import SimilarProducts from './similar-products.svelte';
  import Tabbed from './tabbed/tabbed.svelte';
</script>

<div class="flex flex-col space-y-3">
  <Description />
  <Metadata />
  <MapPreview />
  <Tabbed />
  <Keywords />
  <SimilarProducts />
</div>

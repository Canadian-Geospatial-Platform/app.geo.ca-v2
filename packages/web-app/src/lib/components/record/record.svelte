<script lang="ts">
	import Description from './description.svelte';
	import Metadata from './metadata.svelte';
  import MapPreview from './map-preview.svelte';
  import Keywords from './keywords.svelte';
</script>

<div class="py-10 flex flex-col space-y-3">
  <Description />
  <Metadata />
  <MapPreview />
  <Keywords />
</div>

<script lang="ts">
  import { page } from '$app/stores';
  import Share from '$lib/components/share/share.svelte';

  const lang: string = $page.data.lang;
  const dateModifiedText: string = lang == 'fr-ca' ? 'Date modifiée' : 'Date Modified';

  //TODO: Date should not be hardcoded
  const dateModified: string = '2024-06-12';
</script>

<div class="flex flex-col md:flex-row content-width items-center my-10 md:justify-between">
  <p>{dateModifiedText}: {dateModified}</p>
  <Share />
</div>
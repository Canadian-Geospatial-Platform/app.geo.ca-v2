<script lang="ts">
  import { page } from '$app/stores';
  import Share from '$lib/components/share/share.svelte';

  const lang: string = $page.data.lang;
  const dateModifiedText: string = lang == 'fr-ca' ? 'Date modifiée' : 'Date Modified';

  //TODO: Date should not be hardcoded
  const dateModified: string = '2024-12-03';
</script>

<div
  class="flex flex-col md:flex-row content-width md:items-center my-10
    md:justify-between px-5 md:px-0 gap-y-6"
>
  <p class="font-semibold">{dateModifiedText}: {dateModified}</p>
  <Share />
</div>
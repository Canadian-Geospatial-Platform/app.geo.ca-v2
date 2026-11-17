<script lang="ts">
  import { page } from '$app/state';
  import { getAppLanguage, pickByLanguage } from '#lib/utils/language.js';
  import Share from '#lib/components/share/share.svelte';

  const lang = getAppLanguage(page.data.lang);
  const dateModifiedText: string = pickByLanguage(lang, 'Date Modified', 'Date modifiée');

  const dateModified: string = __APP_DATE_MODIFIED__;
</script>

<div
  class="flex flex-col md:flex-row content-width md:items-center mb-6 md:mb-10 mt-12
    md:justify-between px-5 md:px-0 gap-y-6"
>
  <p class="font-semibold">{dateModifiedText}: {dateModified}</p>
  <Share />
</div>

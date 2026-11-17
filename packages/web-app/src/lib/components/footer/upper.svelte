<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { getAppLanguage } from '#lib/utils/language.js';
  import Share from '#lib/components/share/share.svelte';

  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const dateModifiedText: string = $derived(getTranslations(appLang).components.footer.dateModified);

  const dateModified: string = __APP_DATE_MODIFIED__;
</script>

<div
  class="flex flex-col md:flex-row content-width md:items-center mb-6 md:mb-10 mt-12
    md:justify-between px-5 md:px-0 gap-y-6"
>
  <p class="font-semibold">{dateModifiedText}: {dateModified}</p>
  <Share />
</div>

<script lang="ts">
  import { getAppLanguage } from '#lib/utils/language.js';
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import SearchResults from '#lib/components/search-results/search-results.svelte';

  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const titleText = $derived(getTranslations(appLang).pages.search.title);

  const canonicalUrl = page.data.canonicalUrl;
  const alternateUrl = page.data.alternateUrl;
  const alternateAppLang = page.data.alternateLang;
  const metaDescription = page.data.metaDescription;
</script>

<svelte:head>
  <title>{titleText}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang={alternateAppLang} href={alternateUrl} />
</svelte:head>

<div class="flex flex-wrap lg:flex-nowrap items-start gap-4 py-4">
  <div class="grow flex flex-col gap-4 w-full">
    <SearchResults />
  </div>
</div>

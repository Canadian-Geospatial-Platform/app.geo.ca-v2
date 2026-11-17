<script lang="ts">
  import Record from '#lib/components/record/record.svelte';
  import { page } from '$app/state';

  const canonicalUrl = page.data.canonicalUrl;
  const alternateUrl = page.data.alternateUrl;
  const alternateAppLang = page.data.alternateLang;
  const metaDescription = page.data.metaDescription;
</script>

<svelte:head>
  <title>{page.data.item_v2?.title}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang={alternateAppLang} href={alternateUrl} />
</svelte:head>

<Record />

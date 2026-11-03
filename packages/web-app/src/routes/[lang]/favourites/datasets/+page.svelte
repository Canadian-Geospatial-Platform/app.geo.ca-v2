<script lang="ts">
  import { navigating, page } from '$app/state';
  import LoadingMask from '#lib/components/loading-mask/loading-mask.svelte';
  import FavouritesDatasets from '#lib/components/favourites/favourites-datasets.svelte';

  const title = `app.geo.ca - ${page.data.tTitle2?.text}`;

  const canonicalUrl = page.data.canonicalUrl;
  const alternateUrl = page.data.alternateUrl;
  const alternateLang = page.data.alternateLang;
  const metaDescription = page.data.metaDescription;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  <link rel="alternate" hreflang={alternateLang} href={alternateUrl} />
</svelte:head>

{#if navigating.type !== null}
  <LoadingMask classes="fixed left-0 top-0 items-center" />
{/if}

<div style="min-height: 300px;"><FavouritesDatasets /></div>

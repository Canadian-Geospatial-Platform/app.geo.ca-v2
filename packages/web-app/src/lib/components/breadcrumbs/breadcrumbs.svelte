<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { AppLanguage } from '$lib/utils/language';
  import { pickByLanguage } from '$lib/utils/language';

  // Assign a default lang to prevent 'undefined' in the url when lang is not set
  const lang = (page.data.lang ?? 'en-ca') as AppLanguage;

  const geoCaUrl = $derived(pickByLanguage(lang, 'https://geo.ca/home', 'https://geo.ca/fr/accueil/index.html'));
  const homeLabel = $derived(pickByLanguage(lang, 'Home', 'Accueil'));

  const appGeoCaUrl = $derived(`/${lang}/map-browser`);
  const searchLabel = $derived(pickByLanguage(lang, 'Search', 'Recherche'));

  const title2 = $derived(page.data.tTitle2);
  const title3 = $derived(page.data.tTitle3);

  const breadcrumbs = $derived([
    { text: homeLabel, href: geoCaUrl },
    { text: searchLabel, href: appGeoCaUrl },
    ...(title2 ? [title2] : []),
    ...(title3 ? [title3] : []),
  ]);
</script>

<p class="flex flex-wrap px-5 md:px-0 gap-3">
  {#each breadcrumbs as breadcrumb, i (breadcrumb.href)}
    <!--
      A link isn't needed for the current page, but the search
      page link should always available from +error.svelte.
    -->
    {#if i < breadcrumbs.length - 1 || page.error}
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <span><a href={breadcrumb.href.startsWith('http') ? breadcrumb.href : resolve(breadcrumb.href)}>{breadcrumb.text}</a></span>
      /
    {:else}
      <span>{breadcrumb.text}</span>
    {/if}
  {/each}
</p>

<style lang="postcss">
  @reference "../../../app.css";
  a {
    @apply hover:no-underline;
    @apply underline;
    @apply text-custom-8;
  }
</style>

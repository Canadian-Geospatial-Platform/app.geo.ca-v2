<script lang="ts">
  import { page } from '$app/stores';

  // Assign a default lang to prevent 'undefined' in the url when lang is not set
  const lang = $page.data.lang ?? 'en-ca';

  const geoCaUrl = $derived(lang == 'fr-ca' ?
    'https://geo.ca/fr/accueil/index.html' : 'https://geo.ca/home');
  const homeLabel = $derived(lang == 'fr-ca' ? 'Accueil' : 'Home');

  const appGeoCaUrl = $derived('/' + lang + '/map-browser');
  const searchLabel = $derived(lang == 'fr-ca' ? 'Recherche' : 'Search');

  const title2 = $derived($page.data.t_title_2);
  const title3 = $derived($page.data.t_title_3);

  let breadcrumbs = $derived([
    {"text": homeLabel, "href": geoCaUrl},
    {"text": searchLabel, "href": appGeoCaUrl},
    ...(title2 ? [title2] : []),
    ...(title3 ? [title3] : []),
  ]);
</script>

<p class="flex flex-wrap px-5 md:px-0 gap-3">
  {#each breadcrumbs as breadcrumb, i}
    <!--
      A link isn't needed for the current page, but the search
      page link should always available from +error.svelte.
    -->
    {#if i < breadcrumbs.length - 1 || $page.error}
      <span><a href={breadcrumb.href}>{breadcrumb.text}</a></span>
      /
    {:else}
      <span>{breadcrumb.text}</span>
    {/if}
  {/each}
</p>

<style>
  a {
    @apply hover:no-underline;
    @apply underline;
    @apply text-custom-8;
  }
</style>

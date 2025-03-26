<script lang="ts">
  import { page } from '$app/stores';

  const geoCaUrl = $derived($page.data.lang == 'fr-ca' ?
    'https://geo.ca/fr/accueil/index.html' : 'https://geo.ca/home');
  const homeLabel = $derived($page.data.lang == 'fr-ca' ? 'Accueil' : 'Home');

  const appGeoCaUrl = $derived('/' + $page.data.lang + '/map-browser');
  const searchLabel = $derived($page.data.lang == 'fr-ca' ? 'Recherche' : 'Search');

  const title2 = $derived($page.data.t_title_2);
  const title3 = $derived($page.data.t_title_3);

  let breadcrumbs = $derived([
    {"text": homeLabel, "href": geoCaUrl},
    {"text": searchLabel, "href": appGeoCaUrl},
    ...(title2 ? [title2] : []),
    ...(title3 ? [title3] : []),
  ]);
</script>

<ol class="flex flex-wrap px-5 md:px-0 gap-1">
  {#each breadcrumbs as breadcrumb, i}
    {#if i < breadcrumbs.length - 1}
      <li><a href={breadcrumb.href}>{breadcrumb.text}</a> /</li>
    {:else}
      <li>{breadcrumb.text}</li>
    {/if}
  {/each}
</ol>

<style>
  a {
    @apply underline;
    @apply text-custom-8;
  }
</style>

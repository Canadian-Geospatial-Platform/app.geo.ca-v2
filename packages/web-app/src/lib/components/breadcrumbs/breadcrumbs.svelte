<script lang="ts">
  import { page } from '$app/stores';

  let geoCaUrl = $derived($page.data.lang == 'en-ca' ?
    'https://www.geo.ca/home' : 'https://geo.ca/fr/accueil/index.html');
  let appGeoCaUrl = $derived('/' + $page.data.lang + '/map-browser');
</script>

<ol class="flex flex-wrap px-5 md:px-0 gap-2 text-custom-8">
  <li><a href={geoCaUrl}>Home</a></li>
  <li>/ <a href={appGeoCaUrl}>Search</a></li>
  {#if $page.data.t_title_2}
    <li>/ <a href={$page.data.t_title_2.href}>{$page.data.t_title_2.text}</a></li>
  {/if}
  {#if $page.data.t_title_3}
    <li>/ <a href={$page.data.t_title_3.href}>{$page.data.t_title_3.text}</a></li>
  {/if}
</ol>

<style>
  a {
    @apply underline;
  }
</style>

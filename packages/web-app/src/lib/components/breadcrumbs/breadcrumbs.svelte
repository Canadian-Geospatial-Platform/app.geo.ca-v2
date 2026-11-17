<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { getAppLanguage } from '#lib/utils/language.js';

  // Assign a default lang to prevent 'undefined' in the url when lang is not set
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));

  const translations = $derived(getTranslations(appLang));

  const appGeoCaUrl = $derived(`/${appLang}/map-browser`);

  const title2 = $derived(page.data.tTitle2);
  const title3 = $derived(page.data.tTitle3);

  const breadcrumbs = $derived([
    { text: translations.general.home, href: translations.components.breadcrumbs.homeUrl },
    { text: translations.general.search, href: appGeoCaUrl },
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

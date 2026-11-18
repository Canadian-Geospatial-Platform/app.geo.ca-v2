<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { onMount } from 'svelte';

  let { data } = $props();
  const translations = $derived(getTranslations(data.lang));

  onMount(() => {
    window.location.replace(data.signInUrl);
  });
</script>

<svelte:head>
  <title>{translations.pages.signIn.title} | App.geo.ca</title>
</svelte:head>

<main class="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
  <section class="w-full rounded border border-custom-16 bg-white p-6">
    <p role="status" aria-live="polite" class="mb-4">
      {translations.pages.signIn.redirecting}
    </p>
    <!-- The server constructs this localized route, including its preserved sign-in state. -->
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a href={data.signInUrl} class="button-action-dark">
      {translations.general.continue}
    </a>
  </section>
</main>

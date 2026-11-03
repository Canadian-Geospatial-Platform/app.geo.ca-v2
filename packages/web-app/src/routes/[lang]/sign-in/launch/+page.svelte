<script lang="ts">
  import { onMount } from 'svelte';
  import { pickByLanguage } from '#lib/utils/language.js';

  let { data } = $props();

  onMount(() => {
    window.location.replace(data.signInUrl);
  });
</script>

<svelte:head>
  <title>{pickByLanguage(data.lang, 'Signing in', 'Connexion en cours')} | App.geo.ca</title>
</svelte:head>

<main class="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
  <section class="w-full rounded border border-custom-16 bg-white p-6">
    <p role="status" aria-live="polite" class="mb-4">
      {pickByLanguage(data.lang, 'Redirecting to sign in...', 'Redirection vers la connexion...')}
    </p>
    <!-- The server constructs this localized route, including its preserved sign-in state. -->
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a href={data.signInUrl} class="button-action-dark">
      {pickByLanguage(data.lang, 'Continue', 'Continuer')}
    </a>
  </section>
</main>

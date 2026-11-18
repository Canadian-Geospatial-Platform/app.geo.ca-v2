<script lang="ts">
  import { getTranslations } from '#lib/i18n/index.js';
  import { resolve } from '$app/paths';

  let { data } = $props();

  const translations = $derived(getTranslations(data.lang));

  function handleCancel(event: MouseEvent): void {
    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  }
</script>

<svelte:head>
  <title>{translations.general.signOut} | App.geo.ca</title>
</svelte:head>

<main class="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
  <section class="w-full rounded border border-custom-16 bg-white p-6 shadow-lg">
    <h1 class="mb-3 text-xl font-bold">{translations.pages.signOut.title}</h1>
    <p class="mb-6">
      {translations.pages.signOut.warning}
    </p>
    <div class="flex flex-wrap gap-3">
      <form method="POST" action="?/confirm">
        {#if data.returnTo}
          <input type="hidden" name="returnTo" value={data.returnTo} />
        {/if}
        <button type="submit" class="button-action-dark">
          {translations.general.signOut}
        </button>
      </form>
      <a href={resolve('/[lang]/map-browser', { lang: data.lang })} onclick={handleCancel} class="button-action-light">
        {translations.general.cancel}
      </a>
    </div>
  </section>
</main>

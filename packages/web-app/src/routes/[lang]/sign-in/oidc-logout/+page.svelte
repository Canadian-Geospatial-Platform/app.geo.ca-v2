<script lang="ts">
  import { resolve } from '$app/paths';
  import { pickByLanguage } from '#lib/utils/language.js';

  let { data } = $props();

  const title = $derived(pickByLanguage(data.lang, 'Are you sure you want to sign out?', 'Voulez-vous vraiment vous déconnecter?'));

  function handleCancel(event: MouseEvent): void {
    if (window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  }
</script>

<svelte:head>
  <title>{pickByLanguage(data.lang, 'Sign out', 'Se déconnecter')} | App.geo.ca</title>
</svelte:head>

<main class="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
  <section class="w-full rounded border border-custom-16 bg-white p-6 shadow-lg">
    <h1 class="mb-3 text-xl font-bold">{title}</h1>
    <p class="mb-6">
      {pickByLanguage(
        data.lang,
        'Make sure you have saved all your work before you sign out.',
        'Assurez-vous d’avoir sauvegardé tout votre travail avant de vous déconnecter.'
      )}
    </p>
    <div class="flex flex-wrap gap-3">
      <form method="POST" action="?/confirm">
        {#if data.returnTo}
          <input type="hidden" name="returnTo" value={data.returnTo} />
        {/if}
        <button type="submit" class="button-action-dark">
          {pickByLanguage(data.lang, 'Sign out', 'Se déconnecter')}
        </button>
      </form>
      <a href={resolve('/[lang]/map-browser', { lang: data.lang })} onclick={handleCancel} class="button-action-light">
        {pickByLanguage(data.lang, 'Cancel', 'Annuler')}
      </a>
    </div>
  </section>
</main>

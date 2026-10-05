<script lang="ts">
  import { resolve } from '$app/paths';
  import { slide } from 'svelte/transition';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { pickByLanguage } from '$lib/utils/language';
  import { FAVOURITES_STORAGE_KEY } from '$lib/utils/favourites-storage';
  import { encodeGuestFavouritesCookieValue, GUEST_FAVOURITES_COOKIE_NAME } from '$lib/utils/guest-favourites';
  import LeavingNotice from '$lib/components/leaving-notice/leaving-notice.svelte';

  type Props = {
    light?: boolean;
  };

  let { light = false }: Props = $props();

  const lang = page.data.lang;
  const signedIn = $derived(Boolean(page.data.signedIn));
  const featureSignIn = $derived(page.data.FEATURE_SIGN_IN !== false);

  const signInText = $derived(pickByLanguage(lang, 'Sign in', 'Se connecter'));
  const signOutText = $derived(pickByLanguage(lang, 'Sign out', 'Se déconnecter'));
  const manageCanadaLoginUrl = $derived(page.data.manageCanadaLoginUrl ?? '');
  const shouldReturnToFavourites = $derived.by(() => {
    const currentPath = page.url.pathname;
    const datasetsPath = `/${lang}/favourites/datasets`;
    const mapsPath = `/${lang}/favourites/maps`;

    return currentPath === datasetsPath || currentPath === mapsPath;
  });

  let showLeavingNotice = $state(false);
  let showSignOutConfirmation = $state(false);
  const signOutHref = $derived(
    shouldReturnToFavourites
      ? resolve(`/${lang}/sign-in/oidc-logout?returnTo=${encodeURIComponent(`/${lang}/favourites`)}`)
      : resolve(`/${lang}/sign-in/oidc-logout`)
  );

  onMount(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        showSignOutConfirmation = false;
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  });

  /**
   * Temporarily stores guest favourites before redirecting to sign-in,
   * so they can be merged after authentication.
   */
  function cacheGuestFavouritesForMerge(): void {
    const favourites = localStorage.getItem(FAVOURITES_STORAGE_KEY);
    if (!favourites) {
      return;
    }

    const encoded = encodeGuestFavouritesCookieValue(favourites);
    document.cookie = `${GUEST_FAVOURITES_COOKIE_NAME}=${encoded}; Path=/; Max-Age=600; SameSite=Lax`;
  }

  /**
   * Starts sign-in and preserves the current URL in state for return navigation.
   */
  function handleSignInClick(): void {
    if (showLeavingNotice) {
      return;
    }

    showLeavingNotice = true;
    cacheGuestFavouritesForMerge();
    const state = encodeURIComponent(page.url.href);

    // Keep behavior aligned with other leaving notices before redirect.
    setTimeout(() => {
      window.location.href = `/${lang}/sign-in/send?state=${state}`;
    }, 300);
  }

  function handleSignOutClick(event: MouseEvent): void {
    event.preventDefault();
    showSignOutConfirmation = true;
  }
</script>

<div class="flex h-full items-center whitespace-nowrap">
  {#if featureSignIn}
    {#if signedIn}
      <div class="flex items-center gap-3">
        {#if manageCanadaLoginUrl}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a href={manageCanadaLoginUrl} class="text-sm underline" data-sveltekit-reload>
            {pickByLanguage(lang, 'Manage CanadaLogin', 'Gérer ConnexionCanada')}
          </a>
        {/if}
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          transition:slide
          data-sveltekit-reload
          href={signOutHref}
          onclick={handleSignOutClick}
          class={['button-signin', light ? 'button-action-light' : 'button-action-dark']}
        >
          {signOutText}
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    {:else}
      <div class="flex flex-col items-center gap-0.5">
        <button class={['button-signin', light ? 'button-action-light' : 'button-action-dark']} onclick={handleSignInClick}>
          {signInText}
        </button>
        <span class={['text-xs pointer-events-none select-none', light ? 'text-custom-1 opacity-80' : 'text-custom-8 opacity-80']}>
          {pickByLanguage(lang, 'with CanadaLogin', 'par ConnexionCanada')}
        </span>
      </div>
    {/if}
  {/if}
</div>

{#if showLeavingNotice}
  <LeavingNotice />
{/if}

{#if showSignOutConfirmation}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    role="presentation"
    onclick={(event) => {
      if (event.target === event.currentTarget) {
        showSignOutConfirmation = false;
      }
    }}
  >
    <dialog
      open
      class="static m-0 w-full max-w-lg rounded border border-custom-16 bg-white p-6 shadow-lg"
      aria-modal="true"
      aria-labelledby="sign-out-title"
    >
      <button
        class="float-right text-2xl leading-none"
        type="button"
        aria-label={pickByLanguage(lang, 'Close', 'Fermer')}
        onclick={() => (showSignOutConfirmation = false)}
      >
        &times;
      </button>
      <h2 id="sign-out-title" class="mb-3 text-xl font-bold">
        {pickByLanguage(lang, 'Are you sure you want to sign out?', 'Voulez-vous vraiment vous déconnecter?')}
      </h2>
      <p class="mb-4">
        {pickByLanguage(
          lang,
          'Make sure you have saved all your work before you sign out.',
          'Assurez-vous d’avoir sauvegardé tout votre travail avant de vous déconnecter.'
        )}
      </p>
      <div class="flex flex-wrap gap-3">
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a href={signOutHref} class="button-action-dark rounded px-4 py-2">{signOutText}</a>
        <button class="button-action-light rounded px-4 py-2" onclick={() => (showSignOutConfirmation = false)}>
          {pickByLanguage(lang, 'Cancel', 'Annuler')}
        </button>
      </div>
    </dialog>
  </div>
{/if}

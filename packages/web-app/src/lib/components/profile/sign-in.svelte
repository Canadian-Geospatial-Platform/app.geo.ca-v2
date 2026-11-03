<script lang="ts">
  import { resolve } from '$app/paths';
  import { slide } from 'svelte/transition';
  import { page } from '$app/state';
  import { pickByLanguage } from '#lib/utils/language.js';
  import { FAVOURITES_STORAGE_KEY } from '#lib/utils/favourites-storage.js';
  import { encodeGuestFavouritesCookieValue, GUEST_FAVOURITES_COOKIE_NAME } from '#lib/utils/guest-favourites.js';

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

  let signInRedirectPending = $state(false);
  const signOutHref = $derived(
    shouldReturnToFavourites
      ? resolve(`/[lang]/sign-in/oidc-logout?returnTo=${encodeURIComponent(`/${lang}/favourites`)}`, { lang })
      : resolve('/[lang]/sign-in/oidc-logout', { lang })
  );

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
   * Starts sign-in; the launcher defaults successful sign-in to localized favourites.
   */
  function handleSignInClick(): void {
    if (signInRedirectPending) {
      return;
    }

    signInRedirectPending = true;
    cacheGuestFavouritesForMerge();
    window.location.href = `/${lang}/sign-in/launch`;
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
          class={['button-signin', light ? 'button-action-light' : 'button-action-dark']}
        >
          {signOutText}
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    {:else}
      <div class="flex flex-col items-center gap-0.5">
        <button
          class={['button-signin', light ? 'button-action-light' : 'button-action-dark']}
          disabled={signInRedirectPending}
          onclick={handleSignInClick}
        >
          {signInText}
        </button>
        <span class={['text-xs pointer-events-none select-none', light ? 'text-custom-1 opacity-80' : 'text-custom-8 opacity-80']}>
          {pickByLanguage(lang, 'with CanadaLogin', 'par ConnexionCanada')}
        </span>
      </div>
    {/if}
  {/if}
</div>

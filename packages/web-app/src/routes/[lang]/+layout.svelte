<script lang="ts">
  import { afterNavigate, invalidate } from '$app/navigation';
  import { page, updated } from '$app/state';
  import { onMount } from 'svelte';
  import '../../app.css';
  import Header from '#lib/components/header/header.svelte';
  import Footer from '#lib/components/footer/footer.svelte';
  import Feedback from '#lib/components/feedback/feedback.svelte';
  import Breadcrumbs from '#lib/components/breadcrumbs/breadcrumbs.svelte';
  import LeavingNotice from '#lib/components/leaving-notice/leaving-notice.svelte';
  import GoogleTag from '#lib/components/google-tag/google-tag.svelte';
  import AppDialog from '#lib/components/dialog/app-dialog.svelte';
  import { getAppLanguage } from '#lib/utils/language.js';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let showLeavingSitePopup = $state(false);
  let showSessionWarning = $state(false);
  let sessionSecondsRemaining = $state(0);
  let sessionExpiresAt = 0;
  let sessionRefreshPending = false;
  let sessionLayoutActive = true;
  let sessionLogoutPending = false;
  let previousSessionExpired = $state(false);
  const appLang = getAppLanguage(page.data.lang);
  const lang = appLang.slice(0, 2);

  function endExpiredSession(): void {
    if (!sessionLayoutActive || sessionLogoutPending) return;
    sessionLogoutPending = true;
    showSessionWarning = false;
    sessionExpiresAt = 0;
    window.location.replace(`/${appLang}/sign-in/logout?reason=session-expired`);
  }

  // The browser never receives the refresh token; the server reads the HTTP-only cookie.
  /**
   * Refreshes the server-managed session or sends the user to logout if it has expired.
   */
  async function staySignedIn(): Promise<void> {
    if (sessionRefreshPending || sessionLogoutPending) return;
    sessionRefreshPending = true;
    try {
      const response = await fetch('/api/session', { method: 'POST' });
      if (!sessionLayoutActive || sessionLogoutPending) return;
      if (!response.ok) {
        endExpiredSession();
        return;
      }
      const data = (await response.json()) as { expiresAt?: number };
      sessionExpiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : 0;
      showSessionWarning = false;
    } finally {
      sessionRefreshPending = false;
    }
  }

  // When session expiration is detected, invalidate cached data so the page re-fetches user state.
  // This ensures navigation to protected routes will reflect the signed-out state.
  $effect(() => {
    if (page.data.sessionExpired && !previousSessionExpired) {
      previousSessionExpired = true;
      void invalidate('app:favourites');
    }
  });

  // Set the language of the page. This needs to be done using onMount to
  // ensure it is only executed after the <html> element is present in the DOM.
  // Assigning the language using <svelte:head> instead sometimes caused errors
  onMount(() => {
    let previousSignedIn = Boolean(page.data.signedIn);
    document.documentElement.lang = lang;

    let sessionTimer: ReturnType<typeof setInterval> | undefined;
    const updateSessionWarning = (): void => {
      if (!sessionExpiresAt || !page.data.signedIn) {
        showSessionWarning = false;
        return;
      }

      sessionSecondsRemaining = Math.max(0, Math.ceil((sessionExpiresAt - Date.now()) / 1000));
      if (sessionSecondsRemaining <= 0) {
        endExpiredSession();
      } else if (sessionSecondsRemaining <= 300) {
        showSessionWarning = true;
      }
    };

    const loadSessionExpiry = async (): Promise<void> => {
      if (!page.data.signedIn) return;
      const response = await fetch('/api/session');
      if (!sessionLayoutActive) return;
      if (response.ok) {
        const data = (await response.json()) as { expiresAt?: number };
        sessionExpiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : 0;
        updateSessionWarning();
        sessionTimer = setInterval(updateSessionWarning, 1000);
      } else if (response.status === 401) {
        endExpiredSession();
      }
    };

    void loadSessionExpiry();

    afterNavigate(() => {
      const currentSignedIn = Boolean(page.data.signedIn);

      // Ensure components switch to their correct signed-out rendering path.
      if (previousSignedIn && !currentSignedIn) {
        window.location.reload();
        return;
      }

      previousSignedIn = currentSignedIn;
    });

    const originalScrollIntoView = Element.prototype.scrollIntoView;

    // Keep native scrolling for the app, but block map-internal auto scrolls.
    Element.prototype.scrollIntoView = function (...args: Parameters<Element['scrollIntoView']>) {
      const isGeoViewElement = this.closest('[id^="map-"]');
      if (isGeoViewElement) {
        return;
      }

      return originalScrollIntoView.apply(this, args);
    };

    /**
     * When the user clicks on an external link, indicate to the user that they are leaving.
     *
     * @param event - The click event.
     */
    function handleClick(event: MouseEvent): void {
      const anchor = (event.target as HTMLElement)?.closest('a');
      if (!anchor) {
        return;
      }

      const href = anchor.href;
      const isExternal = href && !href.includes(page.url.host) && !href.includes('geo.ca') && !href.startsWith('mailto');

      if (isExternal) {
        showLeavingSitePopup = true;

        // delay navigation to allow for users to read the message
        event.preventDefault();
        setTimeout(() => {
          showLeavingSitePopup = false;
          window.location.href = href;
        }, 1000);
      }
    }
    window.addEventListener('click', handleClick);
    return () => {
      sessionLayoutActive = false;
      if (sessionTimer) clearInterval(sessionTimer);
      window.removeEventListener('click', handleClick);
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  });
</script>

<GoogleTag />
<Header />
<main class="flex flex-col content-width bg-custom-1 min-h-screen pt-8" data-sveltekit-reload={updated.current ? '' : 'off'}>
  {#if page.data.authError}
    <div
      class="mb-4 rounded border border-red-700 bg-red-50 px-4 py-3 font-custom-style-body-1 text-red-900"
      role="alert"
      aria-live="assertive"
    >
      {lang === 'fr'
        ? 'Impossible de vous connecter pour le moment. Veuillez reessayer. Si le probleme persiste, contactez geoinfo@nrcan-rncan.gc.ca.'
        : 'Unable to sign you in right now. Please try again. If the issue persists, contact geoinfo@nrcan-rncan.gc.ca.'}
    </div>
  {/if}
  {#if page.data.sessionExpired}
    <div
      class="mb-4 rounded border border-yellow-600 bg-yellow-50 px-4 py-3 font-custom-style-body-1 text-yellow-900"
      role="status"
      aria-live="polite"
    >
      {lang === 'fr' ? 'Votre session a expiré. Vous avez été déconnecté.' : 'You have been signed out because your session expired.'}
    </div>
  {/if}
  <Breadcrumbs />
  <div>
    {@render children?.()}
  </div>
  <Feedback />
</main>
<Footer />

{#if showSessionWarning}
  <AppDialog
    open={showSessionWarning}
    role="alertdialog"
    labelledby="session-warning-title"
    describedby="session-warning-description"
    closeOnBackdrop
    onclose={() => void staySignedIn()}
  >
    <button
      class="float-right text-2xl leading-none"
      type="button"
      aria-label={lang === 'fr' ? 'Fermer' : 'Close'}
      onclick={() => void staySignedIn()}
    >
      &times;
    </button>
    <h2 id="session-warning-title" class="mb-3 text-xl font-bold">
      {lang === 'fr' ? 'Nous allons fermer votre session pour cause d’inactivité' : 'Your session is about to end due to inactivity'}
    </h2>
    <p id="session-warning-description" class="mb-2">
      {lang === 'fr'
        ? 'Si vous ne prolongez pas votre session, celle-ci sera automatiquement fermée.'
        : 'If you do not continue your session you will be signed out automatically.'}
    </p>
    <p class="mb-4 font-semibold" aria-live="assertive">
      {lang === 'fr'
        ? `Temps restant : ${Math.ceil(sessionSecondsRemaining / 60)} minutes`
        : `Time remaining: ${Math.ceil(sessionSecondsRemaining / 60)} minutes`}
    </p>
    <p class="mb-4">{lang === 'fr' ? 'Souhaitez-vous prolonger votre session?' : 'Do you wish to continue your session?'}</p>
    <div class="flex flex-wrap gap-3">
      <button class="button-action-dark" onclick={staySignedIn}>
        {lang === 'fr' ? 'Prolonger la session' : 'Stay signed in'}
      </button>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="button-action-light" href={`/${appLang}/sign-in/oidc-logout`}>
        {lang === 'fr' ? 'Se déconnecter' : 'Sign out'}
      </a>
    </div>
  </AppDialog>
{/if}

{#if showLeavingSitePopup}
  <LeavingNotice />
{/if}

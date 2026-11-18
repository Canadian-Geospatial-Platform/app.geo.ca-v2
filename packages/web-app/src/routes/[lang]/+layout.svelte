<script lang="ts">
  import { getTranslations, formatTranslation } from '#lib/i18n/index.js';
  import { afterNavigate, goto } from '$app/navigation';
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
  import { SESSION_INACTIVITY_SECONDS, SESSION_WARNING_SECONDS } from '#lib/config/constants.js';
  import { getAppLanguage, getContentLanguage } from '#lib/utils/language.js';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let showLeavingSitePopup = $state(false);
  let showSessionWarning = $state(false);
  let sessionSecondsRemaining = $state(0);
  let sessionExpiresAt = 0;
  let lastUserActivityAt = 0;
  let lastSessionTouchAt = 0;
  let sessionRefreshPending = false;
  let sessionLayoutActive = true;
  let sessionLogoutPending = false;
  const appLang = $derived(getAppLanguage(page.data.lang ?? page.params.lang));
  const contentLang = $derived(getContentLanguage(appLang));
  const translations = $derived(getTranslations(appLang));

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
      lastUserActivityAt = Date.now();
      lastSessionTouchAt = lastUserActivityAt;
      showSessionWarning = false;
    } finally {
      sessionRefreshPending = false;
    }
  }

  // Set the language of the page. This needs to be done using onMount to
  // ensure it is only executed after the <html> element is present in the DOM.
  // Assigning the language using <svelte:head> instead sometimes caused errors
  onMount(() => {
    if (page.url.searchParams.get('sessionExpired') === '1') {
      const cleanUrl = new URL(page.url.href);
      cleanUrl.searchParams.delete('sessionExpired');
      void goto(cleanUrl, { state: page.state, shallow: true, replace: true });
    }

    let previousSignedIn = Boolean(page.data.signedIn);
    lastUserActivityAt = Date.now();
    lastSessionTouchAt = lastUserActivityAt;
    document.documentElement.lang = contentLang;

    let sessionTimer: ReturnType<typeof setInterval> | undefined;
    let sessionStatusPending = false;
    const heartbeatIntervalMs = Math.min(30_000, (SESSION_INACTIVITY_SECONDS * 1000) / 3);
    const updateSessionWarning = (): void => {
      if (!page.data.signedIn) {
        showSessionWarning = false;
        return;
      }

      const now = Date.now();
      const idleSeconds = (now - lastUserActivityAt) / 1000;
      if (idleSeconds > SESSION_INACTIVITY_SECONDS) {
        endExpiredSession();
        return;
      }

      const idleSecondsRemaining = Math.ceil(SESSION_INACTIVITY_SECONDS - idleSeconds);
      const tokenSecondsRemaining = sessionExpiresAt ? Math.ceil((sessionExpiresAt - now) / 1000) : Number.POSITIVE_INFINITY;
      if (tokenSecondsRemaining <= 0) {
        endExpiredSession();
        return;
      }

      sessionSecondsRemaining = Math.min(idleSecondsRemaining, tokenSecondsRemaining);
      showSessionWarning = idleSecondsRemaining <= SESSION_WARNING_SECONDS || tokenSecondsRemaining <= 300;
    };

    const loadSessionExpiry = async (): Promise<void> => {
      if (!page.data.signedIn || sessionStatusPending || sessionRefreshPending || sessionLogoutPending) return;
      sessionStatusPending = true;
      lastSessionTouchAt = Date.now();
      try {
        const response = await fetch('/api/session');
        if (!sessionLayoutActive || sessionLogoutPending) return;
        if (response.ok) {
          const data = (await response.json()) as { expiresAt?: number };
          sessionExpiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : 0;
          lastSessionTouchAt = Date.now();
          updateSessionWarning();
          if (!sessionTimer) sessionTimer = setInterval(updateSessionWarning, 1000);
        } else if (response.status === 401) {
          endExpiredSession();
        }
      } finally {
        sessionStatusPending = false;
      }
    };

    const handleUserActivity = (): void => {
      lastUserActivityAt = Date.now();
      updateSessionWarning();
      if (lastUserActivityAt - lastSessionTouchAt >= heartbeatIntervalMs) {
        void loadSessionExpiry();
      }
    };
    const userActivityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    for (const eventName of userActivityEvents) {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', updateSessionWarning);

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
      for (const eventName of userActivityEvents) {
        window.removeEventListener(eventName, handleUserActivity);
      }
      document.removeEventListener('visibilitychange', updateSessionWarning);
      window.removeEventListener('click', handleClick);
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  });
</script>

<GoogleTag />
<Header />
<main class="flex flex-col content-width bg-custom-1 min-h-screen pt-8" data-sveltekit-reload={updated.current ? '' : 'false'}>
  {#if page.data.authError}
    <div
      class="mb-4 rounded border border-red-700 bg-red-50 px-4 py-3 font-custom-style-body-1 text-red-900"
      role="alert"
      aria-live="assertive"
    >
      {translations.layout.session.signInFailed}
    </div>
  {/if}
  {#if page.data.sessionExpired}
    <div
      class="mb-4 rounded border border-yellow-600 bg-yellow-50 px-4 py-3 font-custom-style-body-1 text-yellow-900"
      role="status"
      aria-live="polite"
    >
      {translations.layout.session.expired}
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
    <h2 id="session-warning-title" class="mb-3 text-xl font-bold">
      {translations.layout.session.warningTitle}
    </h2>
    <p id="session-warning-description" class="mb-2">
      {translations.layout.session.warningDescription}
    </p>
    <p class="mb-4 font-semibold" aria-live="assertive">
      {formatTranslation(translations.layout.session.remaining, {
        minutes: Math.ceil(sessionSecondsRemaining / 60),
      })}
    </p>
    <p class="mb-4">{translations.layout.session.continuePrompt}</p>
    <div class="flex flex-wrap gap-3">
      <button class="button-action-dark" onclick={staySignedIn}>
        {translations.layout.session.staySignedIn}
      </button>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="button-action-light" href={`/${appLang}/sign-in/oidc-logout`}>
        {translations.general.signOut}
      </a>
    </div>
  </AppDialog>
{/if}

{#if showLeavingSitePopup}
  <LeavingNotice />
{/if}

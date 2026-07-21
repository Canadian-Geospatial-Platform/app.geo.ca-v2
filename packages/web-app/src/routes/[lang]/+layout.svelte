<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page, updated } from '$app/state';
  import { onMount } from 'svelte';
  import '../../app.css';
  import Header from '$lib/components/header/header.svelte';
  import Footer from '$lib/components/footer/footer.svelte';
  import Feedback from '$lib/components/feedback/feedback.svelte';
  import Breadcrumbs from '$lib/components/breadcrumbs/breadcrumbs.svelte';
  import LeavingNotice from '$lib/components/leaving-notice/leaving-notice.svelte';
  import GoogleTag from '$lib/components/google-tag/google-tag.svelte';

  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let showLeavingSitePopup = $state(false);
  const lang = page.data.lang?.slice(0, 2) ?? 'en';

  // Set the language of the page. This needs to be done using onMount to
  // ensure it is only executed after the <html> element is present in the DOM.
  // Assigning the language using <svelte:head> instead sometimes caused errors
  onMount(() => {
    let previousSignedIn = Boolean(page.data.signedIn);
    document.documentElement.lang = lang;

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
      window.removeEventListener('click', handleClick);
      Element.prototype.scrollIntoView = originalScrollIntoView;
    };
  });
</script>

<GoogleTag />
<Header />
<main class="flex flex-col content-width bg-custom-1 min-h-screen pt-8" data-sveltekit-reload={updated.current ? '' : 'off'}>
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

{#if showLeavingSitePopup}
  <LeavingNotice />
{/if}
